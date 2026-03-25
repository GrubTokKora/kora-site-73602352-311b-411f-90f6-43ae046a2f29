import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Bot, X, Loader } from 'lucide-react';
import { createVoiceSession } from '../voice';

type AgentStatus = 'idle' | 'loading' | 'ready' | 'listening' | 'error';
type Message = {
  sender: 'user' | 'agent';
  text: string;
};

function isVoiceFeatureEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const voiceConfig = window.KORA_CONFIG?.features?.voice as { enabled?: boolean };
    return voiceConfig?.enabled === true;
  } catch {
    return false;
  }
}

export default function VoiceAgentWidget() {
  const [visible, setVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const queueTimeRef = useRef<number>(0);
  const assistantMsgIndexRef = useRef<number | null>(null);

  useEffect(() => {
    // Visibility is determined by the static config injected into index.html
    setVisible(isVoiceFeatureEnabled());
  }, []);

  const locale = useMemo(() => (typeof navigator !== 'undefined' ? navigator.language : 'en-US'), []);

  const closeWs = () => {
    try {
      wsRef.current?.close();
    } catch {
      // ignore
    } finally {
      wsRef.current = null;
    }
  };

  const stopMic = () => {
    try {
      processorRef.current?.disconnect();
      processorRef.current = null;
    } catch {
      // ignore
    }
    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    } catch {
      // ignore
    }
    setStatus((s) => (s === 'listening' ? 'ready' : s));
  };

  const float32ToPCM16Base64 = (float32: Float32Array<ArrayBufferLike>): string => {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const sub = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...sub);
    }
    return btoa(binary);
  };

  const base64ToPCM16Float32 = (b64: string): Float32Array => {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const pcm16 = new Int16Array(bytes.buffer);
    const out = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) out[i] = pcm16[i] / 32768.0;
    return out;
  };

  const enqueueAudioPCM16 = (base64AudioDelta: string) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const audioSampleRate = 24000;

    const float32 = base64ToPCM16Float32(base64AudioDelta);
    // Some TS lib signatures require Float32Array<ArrayBuffer>; re-wrap to be safe.
    const audioFloats = new Float32Array(float32);
    const buffer = ctx.createBuffer(1, audioFloats.length, audioSampleRate);
    buffer.copyToChannel(audioFloats, 0, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startAt = Math.max(queueTimeRef.current, ctx.currentTime);
    source.start(startAt);
    queueTimeRef.current = startAt + buffer.duration;
  };

  const handleVoiceEvent = (raw: any) => {
    let event: any = raw;
    try {
      event = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return;
    }

    if (event?.type === 'error') {
      const msg = event?.error?.message || 'Voice session error';
      setError(msg);
      setStatus('error');
      return;
    }

    if (event?.type === 'conversation.item.input_audio_transcription.completed') {
      const transcript = (event?.transcript || event?.item?.transcript || '').trim();
      if (transcript) setMessages((prev) => [...prev, { sender: 'user', text: transcript }]);
      return;
    }

    if (event?.type === 'response.output_audio_transcript.delta') {
      const delta = event?.delta || '';
      if (!delta) return;
      setMessages((prev) => {
        const idx = assistantMsgIndexRef.current;
        if (idx == null) {
          const newIdx = prev.length;
          assistantMsgIndexRef.current = newIdx;
          return [...prev, { sender: 'agent', text: delta }];
        }
        return prev.map((m, i) => (i === idx ? { ...m, text: m.text + delta } : m));
      });
      return;
    }

    if (event?.type === 'response.output_audio_transcript.done') {
      assistantMsgIndexRef.current = null;
      return;
    }

    if (event?.type === 'response.output_audio.delta') {
      const delta = event?.delta;
      if (typeof delta === 'string' && delta.length > 0) enqueueAudioPCM16(delta);
      return;
    }
  };

  const connectWs = (sessionData: any) => {
    const websocketUrl = sessionData?.websocket_url;
    const clientSecret = sessionData?.client_secret;
    if (!websocketUrl || !clientSecret) throw new Error('Voice session missing websocket_url/client_secret');

    assistantMsgIndexRef.current = null;
    queueTimeRef.current = 0;

    const ws = new WebSocket(websocketUrl, [`xai-client-secret.${clientSecret}`]);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('ready');
      setError(null);
      window.dispatchEvent(new CustomEvent('kora-voice-session-ready', { detail: sessionData }));
      try {
        ws.send(
          JSON.stringify({
            type: 'session.update',
            session: {
              voice: 'Eve',
              turn_detection: { type: 'server_vad' },
              audio: {
                input: { format: { type: 'audio/pcm', rate: 24000 } },
                output: { format: { type: 'audio/pcm', rate: 24000 } },
              },
              instructions:
                'You are a helpful business voice assistant. Use the business collection as the source of truth. If data is missing, say you are not sure instead of guessing.',
              tools: [
                {
                  type: 'file_search',
                  vector_store_ids: [sessionData?.collection_id],
                  max_num_results: 8,
                },
              ],
            },
          }),
        );
        ws.send(JSON.stringify({ type: 'response.create' }));
      } catch {
        // ignore
      }
    };

    ws.onmessage = (e) => handleVoiceEvent(e.data);
    ws.onerror = () => {
      setError('Voice WebSocket error');
      setStatus('error');
    };
    ws.onclose = () => {
      assistantMsgIndexRef.current = null;
      if (status !== 'error') setStatus('idle');
    };
  };

  const startSession = async () => {
    if (session || status === 'loading') return;
    setStatus('loading');
    setError(null);
    try {
      const sessionData = await createVoiceSession(locale, {
        url: window.location.href,
        title: document.title,
      });
      setSession(sessionData);
      connectWs(sessionData);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Could not start voice session.';
      console.error('Voice Session Error:', e);
      setError(errorMessage);
      setStatus('error');
    }
  };

  const toggleWidget = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        stopMic();
        closeWs();
        setMessages([]);
        setSession(null);
        setError(null);
        setStatus('idle');
      } else {
        if (!session) startSession();
      }
      return next;
    });
  };

  const handleMicClick = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Voice connection not ready');
      setStatus('error');
      return;
    }

    if (status === 'listening') {
      stopMic();
      return;
    }

    if (status !== 'ready') return;
    setError(null);

    try {
      wsRef.current?.send(JSON.stringify({ type: 'response.create' }));
    } catch {
      // ignore
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        micStreamRef.current = stream;
        const ctx = new AudioContext({ sampleRate: 24000 });
        audioCtxRef.current = ctx;
        setStatus('listening');
        queueTimeRef.current = 0;

        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (ev) => {
          const wsNow = wsRef.current;
          if (!wsNow || wsNow.readyState !== WebSocket.OPEN) return;
          const input = ev.inputBuffer.getChannelData(0);
          const audioB64 = float32ToPCM16Base64(input);
          wsNow.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: audioB64 }));
        };

        source.connect(processor);
        processor.connect(ctx.destination);
      })
      .catch((err) => {
        console.error('Mic error', err);
        setError('Microphone permission denied or unavailable');
        setStatus('error');
      });
  };

  if (!visible) {
    return null;
  }

  const MicButton = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="w-20 h-20 rounded-full bg-stone-600 flex items-center justify-center">
            <Loader className="w-10 h-10 text-white animate-spin" />
          </div>
        );
      case 'listening':
        return (
          <div className="w-20 h-20 rounded-full bg-red-700 flex items-center justify-center">
            <Loader className="w-10 h-10 text-white animate-spin" />
          </div>
        );
      case 'ready':
        return (
          <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center">
            <Mic className="w-10 h-10 text-white" />
          </div>
        );
      case 'error':
        return (
          <div className="w-20 h-20 rounded-full bg-stone-700 flex items-center justify-center">
            <X className="w-10 h-10 text-red-400" />
          </div>
        );
      default: // idle
        return (
          <div className="w-20 h-20 rounded-full bg-stone-700 flex items-center justify-center">
            <Mic className="w-10 h-10 text-stone-400" />
          </div>
        );
    }
  };

  return (
    <>
      <button
        onClick={toggleWidget}
        className="fixed bottom-6 right-6 bg-red-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-red-700 transition-transform transform hover:scale-110"
        aria-label="Open Voice Assistant"
      >
        <Bot className="w-8 h-8" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in" onClick={toggleWidget}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full h-full md:w-[400px] md:max-h-[70vh] md:h-auto bg-stone-900/95 backdrop-blur-xl border border-stone-700 rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-up"
            style={{ minHeight: '400px' }}
          >
            <header className="flex items-center justify-between p-4 border-b border-stone-700 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Bot className="w-6 h-6 text-red-500" />
                <h2 className="text-lg font-bold text-white">Voice Assistant</h2>
              </div>
              <button onClick={toggleWidget} className="p-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'agent' && <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0"><Bot className="w-5 h-5 text-red-500" /></div>}
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-stone-800 text-stone-200 rounded-bl-none'}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              {status === 'loading' && <div className="text-center text-stone-400 text-sm">Connecting...</div>}
              {error && <div className="p-3 bg-red-900/50 border border-red-500/30 text-red-300 rounded-lg text-sm">{error}</div>}
            </div>

            <footer className="p-6 flex flex-col items-center justify-center border-t border-stone-700 flex-shrink-0">
              <button onClick={handleMicClick} disabled={status !== 'ready' && status !== 'listening'}>
                <MicButton />
              </button>
              <p className="text-xs text-stone-500 mt-3">
                {status === 'idle' && 'Tap to speak'}
                {status === 'loading' && 'Connecting...'}
                {status === 'ready' && 'Tap to speak'}
                {status === 'listening' && 'Listening...'}
                {status === 'error' && 'Connection failed'}
              </p>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}