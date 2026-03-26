/**
 * Canonical `useVoiceAgent` for dynamic React sites (use with VoiceAgentWidget).
 * xAI Voice Agent: https://docs.x.ai/docs/guides/voice/agent
 *
 * CRITICAL: Do **not** store the whole conversation in one `transcript` string.
 * Expose `messages: { sender: 'user' | 'agent'; text: string }[]` plus `assistantStreaming`
 * so the UI can render separate bubbles. Wire events per VOICE_WIDGET_CONTRACT.
 *
 * Adapt `import { createVoiceSession } from '../voice'` to your repo’s `voice.ts` signature.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createVoiceSession } from '../voice'

export type VoiceMessage = { sender: 'user' | 'agent'; text: string }

export type AgentState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking' | 'error'

function pickTranscriptDeltaChunk(ev: { delta?: unknown; transcript?: unknown }): string {
  const d = ev.delta
  if (typeof d === 'string') return d
  const t = ev.transcript
  if (typeof t === 'string') return t
  return ''
}

/** Docs use `delta`; live traffic may use `audio` for the same PCM16 payload. */
function pickOutputAudioBase64(ev: { delta?: unknown; audio?: unknown }): string {
  const a = ev.audio
  if (typeof a === 'string' && a.length > 0) return a
  const d = ev.delta
  if (typeof d === 'string' && d.length > 0) return d
  return ''
}

function int16FromBase64PCM16(b64: string): Int16Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const evenLen = bytes.byteLength - (bytes.byteLength % 2)
  return new Int16Array(bytes.buffer, bytes.byteOffset, evenLen / 2)
}

function base64FromInt16LE(pcm16: Int16Array): string {
  const bytes = new Uint8Array(pcm16.buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function toFriendlyVoiceError(raw: unknown): string {
  const text = typeof raw === 'string' ? raw : ''
  const lower = text.toLowerCase()
  if (
    lower.includes('statuscode.unavailable') ||
    lower.includes('grpc_status:14') ||
    lower.includes('service unavailable') ||
    lower.includes('aiorpcerror')
  ) {
    return 'Voice service is temporarily unavailable. Please try again in a moment.'
  }
  if (lower.includes('network') || lower.includes('connection')) {
    return 'We could not connect right now. Please check your internet and try again.'
  }
  if (!text.trim()) return 'Voice assistant is currently unavailable. Please try again.'
  return text
}

export function useVoiceAgent() {
  const [agentState, setAgentState] = useState<AgentState>('idle')
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  /** In-progress assistant text (same turn as latest transcript deltas). */
  const [assistantStreaming, setAssistantStreaming] = useState('')
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const sessionRef = useRef<Record<string, unknown> | null>(null)
  const sessionOutputRateRef = useRef(24000)
  const bootstrapRef = useRef<any>(null)

  const micStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const nextPlayTimeRef = useRef(0)
  const audioQueueRef = useRef<string[]>([])
  const isPlayingRef = useRef(false)

  const assistantDraftRef = useRef('')
  const lastTranscriptTurnKeyRef = useRef('')
  const lastUserItemIdRef = useRef('')
  const greetedRef = useRef(false)

  const agentStateRef = useRef<AgentState>('idle')
  useEffect(() => {
    agentStateRef.current = agentState
  }, [agentState])

  const flushAgentTranscriptToMessages = useCallback(() => {
    const text = assistantDraftRef.current.trim()
    assistantDraftRef.current = ''
    setAssistantStreaming('')
    if (!text) return
    setMessages((prev) => [...prev, { sender: 'agent', text }])
  }, [])

  const appendUserTranscript = useCallback(
    (text: string, itemId?: string) => {
      const t = (typeof text === 'string' ? text : '').trim()
      if (!t) return
      if (itemId && itemId === lastUserItemIdRef.current) return
      flushAgentTranscriptToMessages()
      if (itemId) lastUserItemIdRef.current = itemId
      setMessages((prev) => [...prev, { sender: 'user', text: t }])
    },
    [flushAgentTranscriptToMessages],
  )

  const processAudioQueue = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return
    const ctx = audioCtxRef.current
    if (!ctx) return

    isPlayingRef.current = true
    setAgentState('speaking')

    const b64 = audioQueueRef.current.shift()
    if (!b64) {
      isPlayingRef.current = false
      setAgentState('listening')
      return
    }

    try {
      if (ctx.state === 'suspended') void ctx.resume()
      const pcm = int16FromBase64PCM16(b64)
      if (pcm.length === 0) {
        isPlayingRef.current = false
        processAudioQueue()
        return
      }
      const rate = sessionOutputRateRef.current
      const buf = ctx.createBuffer(1, pcm.length, rate)
      const ch = buf.getChannelData(0)
      for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768.0

      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      const startAt = Math.max(ctx.currentTime, nextPlayTimeRef.current)
      src.start(startAt)
      nextPlayTimeRef.current = startAt + buf.duration
      src.onended = () => {
        isPlayingRef.current = false
        if (audioQueueRef.current.length === 0) setAgentState('listening')
        else processAudioQueue()
      }
    } catch (e) {
      console.error('Voice playback error:', e)
      isPlayingRef.current = false
      processAudioQueue()
    }
  }, [])

  const startMicPipelineRef = useRef<() => Promise<void>>(async () => {})

  const startMicPipeline = useCallback(async () => {
    const ws = wsRef.current
    const session = sessionRef.current as any
    if (!ws || !session?.audio?.input?.format) {
      setError('Session not ready for microphone')
      setAgentState('error')
      return
    }
    const targetRate = Number(session.audio.input.format.rate) || 24000

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: targetRate,
      })
      audioCtxRef.current = ctx
      if (ctx.state === 'suspended') await ctx.resume()
      nextPlayTimeRef.current = ctx.currentTime

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream

      const src = ctx.createMediaStreamSource(stream)
      const proc = ctx.createScriptProcessor(4096, 1, 1)
      processorRef.current = proc

      const gain = ctx.createGain()
      gain.gain.value = 0
      proc.connect(gain)
      gain.connect(ctx.destination)

      proc.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return
        const input = e.inputBuffer.getChannelData(0)
        const pcm16 = new Int16Array(input.length)
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]))
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
        }
        ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64FromInt16LE(pcm16) }))
      }

      src.connect(proc)
      setAgentState('listening')
    } catch (err) {
      console.error('Mic error:', err)
      setError('Could not access microphone.')
      setAgentState('error')
    }
  }, [])

  startMicPipelineRef.current = startMicPipeline

  const handleRealtimeEvent = useCallback(
    (data: any) => {
      if (!data?.type) return

      switch (data.type) {
        case 'session.updated':
          setAgentState('listening')
          // Speak first: ask the model to produce output immediately.
          // Official xAI flow: create a conversation item, then request a response.
          try {
            const ws = wsRef.current
            if (ws && ws.readyState === WebSocket.OPEN && !greetedRef.current) {
              greetedRef.current = true
              const greeting = String(bootstrapRef.current?.initial_greeting || '').trim()
              if (greeting) {
                ws.send(
                  JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                      type: 'message',
                      role: 'user',
                      content: [
                        {
                          type: 'input_text',
                          text: `Please greet the visitor by saying exactly: "${greeting}"`,
                        },
                      ],
                    },
                  }),
                )
              }
              ws.send(JSON.stringify({ type: 'response.create', response: { modalities: ['text', 'audio'] } }))
            }
          } catch {
            /* ignore */
          }
          void startMicPipelineRef.current()
          break

        case 'response.created':
          flushAgentTranscriptToMessages()
          break

        case 'conversation.item.input_audio_transcription.completed':
          appendUserTranscript(data.transcript, data.item_id)
          break

        case 'conversation.item.added': {
          const item = data.item
          if (item?.role === 'user' && Array.isArray(item?.content)) {
            const part = item.content.find(
              (c: any) => c?.type === 'input_audio' && typeof c?.transcript === 'string',
            )
            if (part?.transcript) appendUserTranscript(part.transcript, item?.id)
          }
          break
        }

        case 'response.output_audio.delta': {
          const b64 = pickOutputAudioBase64(data)
          if (b64) {
            audioQueueRef.current.push(b64)
            processAudioQueue()
          }
          break
        }

        case 'response.output_audio_transcript.delta': {
          const piece = pickTranscriptDeltaChunk(data)
          if (!piece) break
          const turnKey =
            (typeof data.item_id === 'string' && data.item_id) ||
            (typeof data.response_id === 'string' && data.response_id) ||
            ''
          if (
            turnKey &&
            lastTranscriptTurnKeyRef.current &&
            turnKey !== lastTranscriptTurnKeyRef.current
          ) {
            flushAgentTranscriptToMessages()
          }
          if (turnKey) lastTranscriptTurnKeyRef.current = turnKey
          assistantDraftRef.current += piece
          setAssistantStreaming(assistantDraftRef.current)
          break
        }

        case 'response.output_audio_transcript.done':
          flushAgentTranscriptToMessages()
          break

        case 'response.output_audio.done':
        case 'response.done':
          flushAgentTranscriptToMessages()
          break

        case 'input_audio_buffer.speech_started':
          flushAgentTranscriptToMessages()
          break

        case 'input_audio_buffer.speech_stopped':
          try {
            const ws = wsRef.current
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'response.create',
                  response: { modalities: ['text', 'audio'] },
                }),
              )
            }
          } catch {
            /* ignore */
          }
          break

        case 'error':
          setError(
            toFriendlyVoiceError(
              (typeof data.error?.message === 'string' && data.error.message) ||
                (typeof data.message === 'string' && data.message) ||
                'Voice agent error',
            ),
          )
          setAgentState('error')
          break

        default:
          if (data.type === 'response.state.updated' && typeof data.state === 'string') {
            const s = data.state
            if (s === 'thinking') setAgentState('thinking')
          }
      }
    },
    [appendUserTranscript, flushAgentTranscriptToMessages, processAudioQueue],
  )

  const stopSession = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    sessionRef.current = null
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
    try {
      processorRef.current?.disconnect()
    } catch {
      /* ignore */
    }
    processorRef.current = null
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {})
    }
    audioCtxRef.current = null

    audioQueueRef.current = []
    isPlayingRef.current = false
    assistantDraftRef.current = ''
    lastTranscriptTurnKeyRef.current = ''
    lastUserItemIdRef.current = ''
    greetedRef.current = false
    setAssistantStreaming('')
    setAgentState('idle')
    setError(null)
  }, [])

  const startSession = useCallback(async () => {
    if (agentStateRef.current !== 'idle' && agentStateRef.current !== 'error') return

    stopSession()
    setAgentState('connecting')
    setError(null)
    setMessages([])
    assistantDraftRef.current = ''
    setAssistantStreaming('')

    // Default to xAI automatic language detection.
    const locale = 'auto'

    try {
      const bootstrap: any = await createVoiceSession(locale, {
        url: typeof window !== 'undefined' ? window.location.href : '',
        title: typeof document !== 'undefined' ? document.title : '',
      } as Record<string, unknown>)
      bootstrapRef.current = bootstrap

      const { websocket_url, client_secret, session } = bootstrap
      if (!websocket_url || !client_secret) throw new Error('Invalid voice session response')

      sessionRef.current = session || {}
      const sess = session as Record<string, unknown> | undefined
      const a = sess?.audio as Record<string, unknown> | undefined
      const inF = (a?.input as { format?: { rate?: number } } | undefined)?.format?.rate
      const outF = (a?.output as { format?: { rate?: number } } | undefined)?.format?.rate
      const inRate = typeof inF === 'number' && inF > 0 ? inF : 24000
      const outRate = typeof outF === 'number' && outF > 0 ? outF : inRate
      sessionOutputRateRef.current = outRate

      const ws = new WebSocket(websocket_url, [`xai-client-secret.${client_secret}`])
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'session.update', session: session || {} }))
      }

      ws.onmessage = (ev) => {
        try {
          handleRealtimeEvent(JSON.parse(ev.data))
        } catch {
          /* ignore */
        }
      }

      ws.onerror = () => {
        setError('We could not connect to the voice assistant right now. Please try again.')
        setAgentState('error')
      }

      ws.onclose = () => {
        wsRef.current = null
        if (agentStateRef.current !== 'idle') {
          stopSession()
        }
      }
    } catch (e) {
      console.error(e)
      setError(toFriendlyVoiceError((e as Error).message || 'Failed to start session.'))
      setAgentState('error')
    }
  }, [handleRealtimeEvent, stopSession])

  useEffect(() => () => stopSession(), [stopSession])

  return {
    agentState,
    messages,
    assistantStreaming,
    error,
    startSession,
    stopSession,
  }
}