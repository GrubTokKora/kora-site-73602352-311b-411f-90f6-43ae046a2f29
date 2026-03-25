import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { Mic, X, Loader, Volume2, AlertTriangle } from 'lucide-react';
import { createVoiceSession } from '../voice';
import { audioBufferToPcm16Base64, downsampleBuffer } from '../utils/audio';

type AgentState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

const TARGET_SAMPLE_RATE = 16000;

export const VoiceAgentWidget: FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const webSocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const sessionDataRef = useRef<any>(null);

  useEffect(() => {
    const voiceEnabled = (window as any).KORA_CONFIG?.features?.voice?.enabled === true;
    setIsVisible(voiceEnabled);
  }, []);

  const stopSession = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
      });
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setAgentState('idle');
    setTranscript('');
  }, []);

  const playNextInQueue = useCallback(async () => {
    if (audioQueueRef.current.length === 0 || isPlayingRef.current) {
      if (audioQueueRef.current.length === 0) {
        isPlayingRef.current = false;
      }
      return;
    }

    isPlayingRef.current = true;
    setAgentState('speaking');

    const base64Audio = audioQueueRef.current.shift();
    if (!base64Audio || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }

    try {
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        playNextInQueue();
      };
      source.start();
    } catch (e) {
      console.error('Error playing audio:', e);
      isPlayingRef.current = false;
      playNextInQueue();
    }
  }, []);

  const startMicrophone = useCallback(async () => {
    if (!mediaStreamRef.current) {
      try {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = audioContextRef.current!;
        const source = audioContext.createMediaStreamSource(mediaStreamRef.current);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = async (e) => {
          if (webSocketRef.current?.readyState === WebSocket.OPEN) {
            const downsampled = await downsampleBuffer(e.inputBuffer, TARGET_SAMPLE_RATE);
            const base64 = audioBufferToPcm16Base64(downsampled);
            webSocketRef.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64 }));
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        processorRef.current = processor;
      } catch (err) {
        console.error('Error accessing microphone:', err);
        setError('Microphone access denied. Please enable it in your browser settings.');
        setAgentState('error');
      }
    }
  }, []);

  const startSession = useCallback(async () => {
    if (agentState !== 'idle' && agentState !== 'error') return;
    setAgentState('connecting');
    setError(null);
    setTranscript('');

    try {
      const session = await createVoiceSession();
      sessionDataRef.current = session;
      const ws = new WebSocket(session.websocket_url, [`xai-client-secret.${session.client_secret}`]);
      webSocketRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'session.update', session: session.session }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'session.updated':
            setAgentState('listening');
            if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: TARGET_SAMPLE_RATE,
              });
            }
            startMicrophone();
            break;
          case 'response.output_audio.delta':
            if (data.audio) {
              audioQueueRef.current.push(data.audio);
              playNextInQueue();
            }
            break;
          case 'response.output_audio_transcript.delta':
            setTranscript(prev => prev + data.transcript);
            break;
          case 'response.output_audio_transcript.done':
            // Potentially finalize transcript here if needed
            break;
          case 'turn.done':
            setTranscript(''); // Clear transcript for the next turn
            setAgentState('listening');
            break;
          case 'session.error':
            setError(data.message || 'A session error occurred.');
            setAgentState('error');
            break;
        }
      };

      ws.onclose = () => {
        stopSession();
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection failed. Please try again.');
        setAgentState('error');
        stopSession();
      };
    } catch (err: any) {
      console.error('Failed to create voice session:', err);
      setError(err.message || 'Could not start voice session.');
      setAgentState('error');
    }
  }, [agentState, playNextInQueue, startMicrophone, stopSession]);

  if (!isVisible) {
    return null;
  }

  const handleFabClick = () => {
    if (agentState === 'idle' || agentState === 'error') {
      startSession();
    } else {
      stopSession();
    }
  };

  const renderStateIcon = () => {
    switch (agentState) {
      case 'connecting':
        return <Loader className="w-8 h-8 text-white animate-spin" />;
      case 'listening':
        return <Mic className="w-8 h-8 text-white" />;
      case 'speaking':
        return <Volume2 className="w-8 h-8 text-white" />;
      case 'error':
        return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
      case 'idle':
      default:
        return <Mic className="w-8 h-8 text-white" />;
    }
  };

  return (
    <>
      <button
        onClick={handleFabClick}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-50
          ${agentState === 'idle' || agentState === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-stone-700 hover:bg-stone-600'}
        `}
        aria-label="Start Voice Assistant"
      >
        {agentState === 'idle' || agentState === 'error' ? (
          <Mic className="w-8 h-8 text-white" />
        ) : (
          <X className="w-8 h-8 text-white" />
        )}
      </button>

      {agentState !== 'idle' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-stone-900/80 border border-stone-700 rounded-2xl w-full max-w-lg p-8 text-center animate-scale-in">
            <div className="relative w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center bg-stone-800 border-2 border-stone-700">
              {renderStateIcon()}
              {agentState === 'listening' && <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping"></div>}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 capitalize">{agentState}</h3>
            <p className="text-stone-400 min-h-[5rem]">
              {error ? <span className="text-yellow-400">{error}</span> : transcript || 'Say something...'}
            </p>
            <button
              onClick={stopSession}
              className="mt-8 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAgentWidget;