import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Mic, X, Volume2, Loader, Bot } from 'lucide-react';
import { createVoiceSession } from '../voice';
import { audioBufferToPcm16Base64, downsampleBuffer } from '../utils/audio';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';

const TARGET_SAMPLE_RATE = 16000;

export default function VoiceAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [transcript, setTranscript] = useState<{ user: string; agent: string }>({ user: '', agent: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
  const audioQueue = useRef<AudioBuffer[]>([]);
  const isPlaying = useRef(false);

  const cleanup = () => {
    ws.current?.close();
    ws.current = null;

    mediaStream.current?.getTracks().forEach(track => track.stop());
    mediaStream.current = null;

    if (audioContext.current && audioContext.current.state !== 'closed') {
      scriptProcessor.current?.disconnect();
      scriptProcessor.current = null;
      audioContext.current.close().catch(console.error);
      audioContext.current = null;
    }
    
    audioQueue.current = [];
    isPlaying.current = false;
    setConnectionState('idle');
  };

  const playNextInQueue = async () => {
    if (isPlaying.current || audioQueue.current.length === 0) {
      if (audioQueue.current.length === 0 && connectionState === 'speaking') {
        setConnectionState('listening');
      }
      return;
    }

    isPlaying.current = true;
    setConnectionState('speaking');

    const buffer = audioQueue.current.shift();
    if (buffer && audioContext.current) {
      const source = audioContext.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.current.destination);
      source.onended = () => {
        isPlaying.current = false;
        playNextInQueue();
      };
      source.start();
    } else {
      isPlaying.current = false;
      playNextInQueue();
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    setConnectionState('connecting');
    setTranscript({ user: '', agent: '' });
    setErrorMessage(null);

    try {
      const sessionData = await createVoiceSession('en-US');
      const { websocket_url, client_secret, session } = sessionData;

      ws.current = new WebSocket(websocket_url, [`xai-client-secret.${client_secret}`]);

      ws.current.onopen = () => {
        ws.current?.send(JSON.stringify({ type: 'session.update', session }));
      };

      ws.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'session.updated') {
          setConnectionState('connected');
          await startMicrophone();
        } else if (data.type === 'response.output_audio_transcript.delta') {
          setTranscript(prev => ({ ...prev, agent: prev.agent + data.transcript }));
        } else if (data.type === 'response.input_audio_transcript.delta') {
            setTranscript(prev => ({ ...prev, user: data.transcript }));
        } else if (data.type === 'response.output_audio.delta') {
          if (audioContext.current && data.audio) {
            const audioData = atob(data.audio);
            const audioBytes = new Uint8Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
              audioBytes[i] = audioData.charCodeAt(i);
            }
            const audioBuffer = await audioContext.current.decodeAudioData(audioBytes.buffer);
            audioQueue.current.push(audioBuffer);
            playNextInQueue();
          }
        } else if (data.type === 'session.error') {
            setErrorMessage(data.message || 'A session error occurred.');
            setConnectionState('error');
            cleanup();
        }
      };

      ws.current.onclose = () => {
        cleanup();
      };

      ws.current.onerror = (err) => {
        console.error('WebSocket Error:', err);
        setErrorMessage('A connection error occurred.');
        setConnectionState('error');
        cleanup();
      };

    } catch (error) {
      console.error('Failed to create voice session:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start voice session.');
      setConnectionState('error');
    }
  };

  const startMicrophone = async () => {
    try {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = audioContext.current.createMediaStreamSource(mediaStream.current);
      const bufferSize = 4096;
      scriptProcessor.current = audioContext.current.createScriptProcessor(bufferSize, 1, 1);

      scriptProcessor.current.onaudioprocess = async (e) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          const inputBuffer = e.inputBuffer;
          const downsampledBuffer = await downsampleBuffer(inputBuffer, TARGET_SAMPLE_RATE);
          const base64 = audioBufferToPcm16Base64(downsampledBuffer);
          ws.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64 }));
        }
      };

      source.connect(scriptProcessor.current);
      scriptProcessor.current.connect(audioContext.current.destination);
      setConnectionState('listening');

    } catch (error) {
      console.error('Microphone access denied:', error);
      setErrorMessage('Microphone access is required. Please allow access and try again.');
      setConnectionState('error');
      cleanup();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    cleanup();
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300 z-50"
        aria-label="Start Voice Assistant"
      >
        <Mic className="w-8 h-8" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl border border-stone-700/50 flex flex-col h-[70vh] max-h-[600px] animate-slide-in-up">
            <header className="flex items-center justify-between p-4 border-b border-stone-700/50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-white">Voice Assistant</h2>
              </div>
              <button onClick={handleClose} className="p-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </header>

            <main className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {transcript.agent && (
                  <div className="text-stone-200 text-lg leading-relaxed">{transcript.agent}</div>
                )}
                {transcript.user && (
                    <div className="text-stone-400 text-right text-md italic leading-relaxed">{transcript.user}</div>
                )}
              </div>
            </main>

            <footer className="p-4 border-t border-stone-700/50 flex-shrink-0">
              <StatusIndicator state={connectionState} message={errorMessage} />
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

const StatusIndicator = ({ state, message }: { state: ConnectionState; message: string | null }) => {
  let icon: ReactNode;
  let text: string;

  switch (state) {
    case 'connecting':
      icon = <Loader className="w-5 h-5 animate-spin text-stone-400" />;
      text = 'Connecting...';
      break;
    case 'connected':
      icon = <Loader className="w-5 h-5 animate-spin text-stone-400" />;
      text = 'Initializing microphone...';
      break;
    case 'listening':
      icon = <Mic className="w-5 h-5 text-emerald-400" />;
      text = 'Listening...';
      break;
    case 'speaking':
      icon = <Volume2 className="w-5 h-5 text-blue-400" />;
      text = 'Speaking...';
      break;
    case 'error':
      icon = <X className="w-5 h-5 text-red-500" />;
      text = message || 'An error occurred.';
      break;
    default:
      icon = <div className="w-5 h-5" />;
      text = 'Idle';
  }

  return (
    <div className="flex items-center justify-center space-x-3 text-stone-400">
      {icon}
      <span className="text-sm">{text}</span>
    </div>
  );
};