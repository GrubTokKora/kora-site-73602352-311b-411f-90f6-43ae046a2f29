// Canonical realtime voice widget reference (dynamic React sites).
// xAI Voice Agent API: https://docs.x.ai/developers/model-capabilities/audio/voice-agent
// - Visibility: window.KORA_CONFIG.features.voice.enabled
// - Session bootstrap: POST /api/v1/public/voice/session (returns client_secret + websocket_url + session)
// - After WS open: send session.update; wait for session.updated before streaming audio (see docs).
// - NEVER use useEffect(() => () => disconnect(), [disconnect]) if disconnect depends on agentState —
//   React will run cleanup when state flips (e.g. connecting → listening) and close the socket immediately.

import { useEffect, useMemo, useRef, useState } from 'react'
import { createVoiceSession } from '../voice'

type Sender = 'user' | 'agent'
type Message = { sender: Sender; text: string }
type WidgetStatus = 'idle' | 'loading' | 'connected' | 'error'

type VoiceSessionBootstrap = {
  websocket_url: string
  client_secret: string
  expires_at?: number | null
  session?: Record<string, unknown>
  initial_greeting?: string
}

function KoraIcon({
  kind,
  className = 'w-5 h-5',
}: {
  kind: 'mic' | 'spinner' | 'listening' | 'speaking' | 'thinking' | 'error' | 'close'
  className?: string
}) {
  if (kind === 'close') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </svg>
    )
  }
  if (kind === 'spinner') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M21 12a9 9 0 1 1-9-9" />
      </svg>
    )
  }
  if (kind === 'listening') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M12 3v6" />
        <path d="M8 6v12" />
        <path d="M16 8v8" />
        <path d="M4 10v4" />
        <path d="M20 10v4" />
      </svg>
    )
  }
  if (kind === 'speaking') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <polygon points="11 5 6 9 3 9 3 15 6 15 11 19 11 5" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18 6a8 8 0 0 1 0 12" />
      </svg>
    )
  }
  if (kind === 'thinking') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <path d="M12 2a8 8 0 0 0-5 14.2V20l3-1 3 1v-3.8A8 8 0 1 0 12 2z" />
        <path d="M9.5 10a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4" />
        <circle cx="12" cy="17.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (kind === 'error') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <circle cx="12" cy="16.8" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 19v3" />
      <path d="M8 22h8" />
    </svg>
  )
}

function isVoiceFeatureEnabled(): boolean {
  if (typeof window === 'undefined') return false
  // Avoid relying on TypeScript global typing for KORA_CONFIG.
  // Some generated projects type `window.KORA_CONFIG` without `features`.
  const v = (window as any).KORA_CONFIG?.features?.voice as unknown
  return Boolean(
    v &&
      typeof v === 'object' &&
      (v as { enabled?: boolean }).enabled === true,
  )
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

function int16FromBase64PCM16(b64: string): Int16Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const evenLen = bytes.byteLength - (bytes.byteLength % 2)
  return new Int16Array(bytes.buffer, bytes.byteOffset, evenLen / 2)
}

function float32FromPCM16(pcm16: Int16Array): Float32Array {
  const out = new Float32Array(pcm16.length)
  for (let i = 0; i < pcm16.length; i++) out[i] = pcm16[i] / 32768.0
  return out
}

/** xAI realtime events use `delta` per docs; never concatenate if missing (avoids "undefined" in UI). */
function pickTranscriptDeltaChunk(ev: { delta?: unknown; transcript?: unknown }): string {
  const d = ev.delta
  if (typeof d === 'string') return d
  const t = ev.transcript
  if (typeof t === 'string') return t
  return ''
}

/** xAI examples use `delta`; some wire traces use `audio` — prefer whichever is non-empty. */
function pickOutputAudioBase64(ev: { delta?: unknown; audio?: unknown }): string {
  const a = ev.audio
  if (typeof a === 'string' && a.length > 0) return a
  const d = ev.delta
  if (typeof d === 'string' && d.length > 0) return d
  return ''
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

function resolvePrimaryColor(): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return '#dc2626'
  try {
    const root = window.getComputedStyle(document.documentElement)
    const candidates = [
      root.getPropertyValue('--kora-voice-primary'),
      root.getPropertyValue('--color-primary'),
      root.getPropertyValue('--color-primary'),
      root.getPropertyValue('--theme-primary'),
    ]
    for (const c of candidates) {
      const v = c.trim()
      if (v) return v
    }
  } catch {
    // ignore and use fallback
  }
  return '#dc2626'
}

export default function VoiceAgentWidget() {
  const INACTIVITY_TIMEOUT_MS = 15_000
  const visible = useMemo(() => isVoiceFeatureEnabled(), [])

  const [status, setStatus] = useState<WidgetStatus>('idle')
  const [phase, setPhase] = useState<
    'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking' | 'error'
  >('idle')
  const primaryColor = useMemo(() => resolvePrimaryColor(), [])
  const [errorText, setErrorText] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  /** Live assistant text while deltas arrive (same turn). */
  const [assistantStreaming, setAssistantStreaming] = useState('')

  const wsRef = useRef<WebSocket | null>(null)
  const bootstrapRef = useRef<VoiceSessionBootstrap | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const nextStartTimeRef = useRef<number>(0)
  const assistantDraftRef = useRef<string>('')
  const isSessionReadyRef = useRef<boolean>(false)
  const pendingAudioRef = useRef<string[]>([]) // base64 PCM16 chunks buffered until session.updated
  const lastUserItemIdRef = useRef<string>('') // de-dupe user transcripts across event types
  /** Split assistant bubbles when xAI rotates `item_id` / `response_id` between model turns. */
  const lastTranscriptTurnKeyRef = useRef<string>('')
  const greetedRef = useRef<boolean>(false)
  const inactivityTimerRef = useRef<number | null>(null)
  /** Must match session.audio.input.format.rate from bootstrap (see xAI docs). */
  const sessionInputSampleRateRef = useRef<number>(24000)
  /** Decode output PCM with session.audio.output.format.rate (may differ from input in theory). */
  const sessionOutputSampleRateRef = useRef<number>(24000)

  // Use xAI auto language detection by default so users can switch languages naturally.
  const locale = useMemo(() => 'auto', [])

  function stop() {
    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
    try {
      wsRef.current?.close()
    } catch {}
    wsRef.current = null
    bootstrapRef.current = null
    try {
      processorRef.current?.disconnect()
    } catch {}
    processorRef.current = null
    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {}
    micStreamRef.current = null
    try {
      audioCtxRef.current?.close()
    } catch {}
    audioCtxRef.current = null

    isSessionReadyRef.current = false
    pendingAudioRef.current = []
    assistantDraftRef.current = ''
    lastUserItemIdRef.current = ''
    lastTranscriptTurnKeyRef.current = ''
    greetedRef.current = false
    nextStartTimeRef.current = 0
    setAssistantStreaming('')

    setStatus('idle')
    setPhase('idle')
  }

  function resetInactivityTimer() {
    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current)
    }
    inactivityTimerRef.current = window.setTimeout(() => {
      setIsOpen(false)
      stop()
    }, INACTIVITY_TIMEOUT_MS)
  }

  function flushAgentTranscriptToMessages() {
    const text = assistantDraftRef.current.trim()
    assistantDraftRef.current = ''
    setAssistantStreaming('')
    if (!text) return
    setMessages((prev) => [...prev, { sender: 'agent', text }])
  }

  function appendUserTranscript(text: string, itemId?: string) {
    const t = (typeof text === 'string' ? text : '').trim()
    if (!t) return
    if (itemId && itemId === lastUserItemIdRef.current) return
    // New human turn: close any open assistant bubble first (correct ordering).
    flushAgentTranscriptToMessages()
    if (itemId) lastUserItemIdRef.current = itemId
    setMessages((prev) => [...prev, { sender: 'user', text: t }])
  }

  async function start() {
    if (status === 'loading') return
    setStatus('loading')
    setPhase('connecting')
    setErrorText('')
    setMessages([])
    assistantDraftRef.current = ''
    setAssistantStreaming('')
    lastTranscriptTurnKeyRef.current = ''

    try {
      // Respect user consent first: do not call /public/voice/session until mic permission is granted.
      const preGrantedMic = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = preGrantedMic

      // Backend returns: { websocket_url, client_secret, expires_at, ... }
      const bootstrap = (await createVoiceSession(locale, {
        url: window.location.href,
        title: document.title,
      } as unknown as Record<string, unknown>)) as VoiceSessionBootstrap
      bootstrapRef.current = bootstrap

      const websocketUrl = bootstrap.websocket_url
      const clientSecret = bootstrap.client_secret

      if (!websocketUrl || !clientSecret) {
        throw new Error('Voice session missing websocket_url/client_secret')
      }

      const sess = bootstrap.session as Record<string, unknown> | undefined
      const sessionAudio = sess?.audio as Record<string, unknown> | undefined
      const inputFmt = sessionAudio?.input as Record<string, unknown> | undefined
      const outputFmt = sessionAudio?.output as Record<string, unknown> | undefined
      const inForm = inputFmt?.format as Record<string, unknown> | undefined
      const outForm = outputFmt?.format as Record<string, unknown> | undefined
      const inRate = inForm?.rate
      const outRate = outForm?.rate
      sessionInputSampleRateRef.current =
        typeof inRate === 'number' && Number.isFinite(inRate) && inRate > 0 ? inRate : 24000
      sessionOutputSampleRateRef.current =
        typeof outRate === 'number' && Number.isFinite(outRate) && outRate > 0
          ? outRate
          : sessionInputSampleRateRef.current

      const ws = new WebSocket(websocketUrl, [`xai-client-secret.${clientSecret}`])
      wsRef.current = ws
      isSessionReadyRef.current = false
      pendingAudioRef.current = []

      ws.onopen = async () => {
        // Per xAI docs: must send `session.update` after connecting.
        const sessionObj = (bootstrap.session || {}) as Record<string, unknown>
        ws.send(JSON.stringify({ type: 'session.update', session: sessionObj }))
      }

      ws.onmessage = (ev) => {
        // Any realtime message from server counts as activity.
        resetInactivityTimer()
        try {
          const event = JSON.parse(ev.data)
          handleRealtimeEvent(event)
        } catch {
          // Ignore unknown event shapes.
        }
      }

      ws.onerror = () => {
        setStatus('error')
        setPhase('error')
        setErrorText('Voice connection failed.')
      }

      ws.onclose = () => {
        // If user closed the popup, this ensures mic stops.
        try {
          processorRef.current?.disconnect()
        } catch {}
        try {
          micStreamRef.current?.getTracks().forEach((t) => t.stop())
        } catch {}
        try {
          audioCtxRef.current?.close()
        } catch {}
        wsRef.current = null
        isSessionReadyRef.current = false
        pendingAudioRef.current = []
        assistantDraftRef.current = ''
        lastTranscriptTurnKeyRef.current = ''
        setAssistantStreaming('')
        // Keep messages; just mark idle unless an error is already shown.
        setStatus((s) => (s === 'error' ? s : 'idle'))
        setPhase((p) => (p === 'error' ? p : 'idle'))
      }
    } catch (e) {
      // If session bootstrap fails after permission grant, release the open stream.
      try {
        micStreamRef.current?.getTracks().forEach((t) => t.stop())
      } catch {}
      micStreamRef.current = null
      const msg = e instanceof Error ? e.message : String(e)
      setStatus('error')
      setPhase('error')
      setErrorText(toFriendlyVoiceError(msg || 'Could not start voice session.'))
    }
  }

  async function startMicAndStream(ws: WebSocket) {
    const sampleRate = sessionInputSampleRateRef.current
    const ctx = new AudioContext({ sampleRate })
    audioCtxRef.current = ctx
    // After await boundaries, many browsers leave AudioContext "suspended" until resumed.
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        /* ignore */
      }
    }
    nextStartTimeRef.current = ctx.currentTime

    // Reuse the stream that was granted before session bootstrap to avoid a second permission gate.
    const stream = micStreamRef.current ?? (await navigator.mediaDevices.getUserMedia({ audio: true }))
    micStreamRef.current = stream

    const source = ctx.createMediaStreamSource(stream)

    // ScriptProcessor is deprecated but works for a PoC across browsers without AudioWorklet.
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    processorRef.current = processor

    // Route to a silent gain to avoid echo.
    const gain = ctx.createGain()
    gain.gain.value = 0
    processor.connect(gain)
    gain.connect(ctx.destination)

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return
      const input = e.inputBuffer.getChannelData(0)

      // Assume ctx sample rate is already 24kHz. If not, we still send at whatever rate ctx provides;
      // the backend session audio config is expected to match.
      const pcm16 = new Int16Array(input.length)
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]))
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      const b64 = base64FromInt16LE(pcm16)
      // User audio chunks count as activity.
      resetInactivityTimer()
      // Buffer audio until we receive `session.updated` as recommended by xAI docs.
      if (!isSessionReadyRef.current) {
        pendingAudioRef.current.push(b64)
        // cap buffer to avoid unbounded growth (~10s at this chunk size; best-effort)
        if (pendingAudioRef.current.length > 80) pendingAudioRef.current.shift()
        return
      }
      ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64 }))
    }

    source.connect(processor)
  }

  function playPCM16Audio(base64Pcm16: string) {
    const ctx = audioCtxRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') {
      try {
        void ctx.resume()
      } catch {
        /* ignore */
      }
    }

    const pcm16 = int16FromBase64PCM16(base64Pcm16)
    if (pcm16.length === 0) return
    const float32 = float32FromPCM16(pcm16)
    const decodeRate = sessionOutputSampleRateRef.current

    const buffer = ctx.createBuffer(1, float32.length, decodeRate)
    // TS/lib typings can treat Float32Array as ArrayBufferLike; ensure a plain Float32Array for copyToChannel.
    buffer.copyToChannel(new Float32Array(float32), 0)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current)
    source.start(startAt)

    nextStartTimeRef.current = startAt + buffer.duration
  }

  function handleRealtimeEvent(event: any) {
    if (!event?.type) return

    if (event.type === 'session.updated') {
      isSessionReadyRef.current = true
      setStatus('connected')
      setPhase('listening')
      // Start inactivity countdown only when session is live.
      resetInactivityTimer()
      // Flush buffered audio in chronological order.
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        for (const b64 of pendingAudioRef.current) {
          ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64 }))
        }
        pendingAudioRef.current = []
      }
      // Speak first (official xAI flow): create a conversation item, then request a response.
      try {
        const ws = wsRef.current
        if (ws && ws.readyState === WebSocket.OPEN && !greetedRef.current) {
          greetedRef.current = true
          const greeting = String((bootstrapRef.current as any)?.initial_greeting || '').trim()
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
      // Start mic after session is ready so the first speech isn't dropped.
      // (Mic init can still be requested earlier in prod; keep this simple.)
      void startMicAndStream(wsRef.current as WebSocket)
      return
    }

    // New model response turn: finalize any assistant transcript still open from the prior turn.
    if (event.type === 'response.created') {
      flushAgentTranscriptToMessages()
      return
    }

    // User speech transcription (show human text in chat).
    // Depending on config, xAI may send either/both of these.
    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      setPhase('thinking')
      appendUserTranscript(event.transcript, event.item_id)
      return
    }
    if (event.type === 'conversation.item.added') {
      const item = event.item
      if (item?.role === 'user' && Array.isArray(item?.content)) {
        const audioPart = item.content.find((c: any) => c?.type === 'input_audio' && typeof c?.transcript === 'string')
        if (audioPart?.transcript) appendUserTranscript(audioPart.transcript, item?.id)
      }
      if (item?.role === 'user') setPhase('thinking')
      return
    }

    if (event.type === 'response.output_audio.delta') {
      const b64 = pickOutputAudioBase64(event)
      if (b64) {
        setPhase('speaking')
        playPCM16Audio(b64)
      }
      return
    }

    if (event.type === 'response.output_audio_transcript.delta') {
      const piece = pickTranscriptDeltaChunk(event)
      if (!piece) return
      const turnKey =
        (typeof event.item_id === 'string' && event.item_id) ||
        (typeof event.response_id === 'string' && event.response_id) ||
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
      return
    }

    if (event.type === 'response.output_audio_transcript.done') {
      flushAgentTranscriptToMessages()
      setPhase('listening')
      return
    }

    if (event.type === 'response.output_audio.done' || event.type === 'response.done') {
      flushAgentTranscriptToMessages()
      setPhase('listening')
      return
    }

    // User started speaking again — separate bubbles before the next assistant stream.
    if (event.type === 'input_audio_buffer.speech_started') {
      flushAgentTranscriptToMessages()
      return
    }

    // If server VAD is enabled, it should auto-respond, but some configurations still
    // require a `response.create`. Safe to send on speech end.
    if (event.type === 'input_audio_buffer.speech_stopped') {
      try {
        const ws = wsRef.current
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'response.create', response: { modalities: ['text', 'audio'] } }))
        }
      } catch {}
      return
    }

    if (event.type === 'error') {
      setStatus('error')
      setPhase('error')
      const msg =
        (typeof event.error?.message === 'string' && event.error.message) ||
        (typeof event.message === 'string' && event.message) ||
        'Voice agent error.'
      setErrorText(toFriendlyVoiceError(msg))
      return
    }
  }

  useEffect(() => {
    return () => {
      stop()
    }
  }, [])

  if (!visible) return null

  const statusTone =
    phase === 'error'
      ? 'text-red-300 border-red-500/40 bg-red-950/30'
      : phase === 'connecting'
        ? 'text-amber-300 border-amber-500/40 bg-amber-950/20'
        : phase === 'thinking'
          ? 'text-yellow-300 border-yellow-500/40 bg-yellow-950/20'
          : phase === 'speaking'
            ? 'text-sky-300 border-sky-500/40 bg-sky-950/20'
        : 'text-emerald-300 border-emerald-500/30 bg-emerald-950/20'
  const statusLabel =
    phase === 'connecting'
      ? 'Connecting'
      : phase === 'error'
        ? 'Error'
        : phase === 'thinking'
          ? 'Thinking'
          : phase === 'speaking'
            ? 'Speaking'
            : 'Listening'
  const statusIcon: 'spinner' | 'error' | 'listening' | 'thinking' | 'speaking' =
    phase === 'connecting'
      ? 'spinner'
      : phase === 'error'
        ? 'error'
        : phase === 'thinking'
          ? 'thinking'
          : phase === 'speaking'
            ? 'speaking'
            : 'listening'

  return (
    <>
      <button
        onClick={() => {
          setIsOpen((v) => {
            const next = !v
            if (!next) stop()
            return next
          })
          if (!isOpen && wsRef.current == null && status !== 'connected') start()
        }}
        className="fixed bottom-6 right-6 text-white w-16 h-16 rounded-full flex items-center justify-center z-50 transition-transform transform hover:scale-110"
        style={{ backgroundColor: primaryColor }}
        aria-label="Open Voice Assistant"
      >
        <KoraIcon kind="mic" className="w-8 h-8" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            setIsOpen(false)
            stop()
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full h-full md:w-[400px] md:max-h-[70vh] md:h-auto bg-stone-900/95 backdrop-blur-xl border border-stone-700 rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up"
            style={{ minHeight: '400px' }}
          >
            <header className="flex items-center justify-between p-4 border-b border-stone-700 flex-shrink-0">
              <div>
                <h2 className="text-sm font-bold text-white">Voice Assistant</h2>
                <p className="text-xs text-stone-400">Powered by Kora</p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false)
                  stop()
                }}
                className="p-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-full"
                aria-label="Close voice assistant"
              >
                <KoraIcon kind="close" className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {phase === 'connecting' && messages.length === 0 && !assistantStreaming.trim() ? (
                <div className="min-h-[160px] flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-300 via-red-500 to-red-900 animate-pulse" />
                  <p className="text-sm font-semibold text-white">Connecting...</p>
                  <p className="text-xs text-stone-400">
                    Preparing your voice assistant
                  </p>
                </div>
              ) : null}
              {messages.map((m, idx) => (
                <div key={idx} className={`flex items-end gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.sender === 'agent' ? (
                    <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0 text-red-500">
                      <KoraIcon kind="mic" className="w-5 h-5" />
                    </div>
                  ) : null}
                  <div className={`max-w-[80%] p-3 rounded-2xl ${m.sender === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-stone-800 text-stone-200 rounded-bl-none'}`}>
                    <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}

              {assistantStreaming.trim() ? (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0 text-red-500">
                    <KoraIcon kind="mic" className="w-5 h-5" />
                  </div>
                  <div className="max-w-[80%] p-3 rounded-2xl bg-stone-800 text-stone-200 rounded-bl-none border border-stone-600/60">
                    <p className="text-sm whitespace-pre-wrap">{assistantStreaming}</p>
                  </div>
                </div>
              ) : null}

              {phase === 'connecting' ? <div className="text-center text-stone-400 text-sm">Connecting...</div> : null}
              {status === 'error' && errorText ? (
                <div className="p-3 bg-red-900/50 border border-red-500/30 text-red-300 rounded-lg text-sm">{errorText}</div>
              ) : null}
            </div>

            <footer className="p-4 border-t border-stone-700 flex-shrink-0 flex items-center justify-between gap-3">
              {phase !== 'idle' ? (
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold ${statusTone}`}>
                  <span className={phase === 'connecting' ? 'animate-spin' : ''}>
                    <KoraIcon kind={statusIcon} className="w-4 h-4" />
                  </span>
                  <span>{statusLabel}</span>
                </div>
              ) : (
                <div />
              )}
              <button
                onClick={() => start()}
                disabled={status === 'loading'}
                className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center disabled:bg-stone-700"
              >
                {status === 'loading' ? (
                  <span className="animate-spin">
                    <KoraIcon kind="spinner" className="w-5 h-5" />
                  </span>
                ) : (
                  <KoraIcon kind="mic" className="w-5 h-5" />
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}