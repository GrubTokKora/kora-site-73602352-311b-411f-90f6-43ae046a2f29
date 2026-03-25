import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, X, Loader, Bot, Volume2 } from 'lucide-react';
import { createVoiceSession } from '../voice';
import { audioBufferToPcm16Base64, downsampleBuffer } from '../utils/audio';

type AgentState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';
type TranscriptItem = { speaker: 'user' | 'agent'; text: string };

const AgentStateIndicator = ({ state, error }: { state: AgentState; error?: string }) => {
  switch (state) {
    case 'connecting':
      return (
        <div className="flex items-center justify-center space-x-2 text-stone-400">
          <Loader className="w-4 h-4 animate-spin" />
          <span>Connecting...</span>
        </div>
      );
    case 'listening':
      return (
        <div className="flex items-center justify-center space-x-2 text-emerald-400">
          <Mic className="w-4 h-4" />
          <span>Listening...</span>
        </div>
      );
    case 'speaking':
      return (
        <div className="flex items-center justify-center space-x-2 text-sky-400">
          <Volume2 className="w-4 h-4" />
          <span>Speaking...</span>
        </div>
      );
    case 'error':
      return <div className="text-red-400 text-sm">{error || 'An error occurred.'}</div>;
    case 'idle':
    default:
      return <div className="text-stone-500">Session ended.</div>;
  }
};

export default function VoiceAgentWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const targetSampleRateRef = useRef(24000);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).KORA_CONFIG?.features?.voice?.enabled === true) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const processAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }
    isPlayingRef.current = true;
    setAgentState('speaking');

    const audioBase64 = audioQueueRef.current.shift();
    if (!audioBase64 || !audioContextRef.current || audioContextRef.current.state === 'closed') {
      isPlayingRef.current = false;
      if (audioQueueRef.current.length === 0) setAgentState('listening');
      return;
    }

    try {
      const audioData = atob(audioBase64);
      const audioBytes = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioBytes[i] = audioData.charCodeAt(i);
      }
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioBytes.buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        processAudioQueue();
      };
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
      isPlayingRef.current = false;
      processAudioQueue();
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopMicrophone();
    setAgentState('idle');
  }, [stopMicrophone]);

  const startMicrophone = useCallback(async () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: targetSampleRateRef.current });
      audioContextRef.current = context;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = async (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const downsampledBuffer = await downsampleBuffer(e.inputBuffer, targetSampleRateRef.current);
          const base64 = audioBufferToPcm16Base64(downsampledBuffer);
          wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64 }));
        }
      };

      source.connect(processor);
      processor.connect(context.destination);
    } catch (error) {
      console.error('Microphone access denied:', error);
      setErrorMessage('Microphone access is required to use the voice assistant.');
      setAgentState('error');
      disconnect();
    }
  }, [disconnect]);

  const startAgent = useCallback(async () => {
    if (agentState !== 'idle' && agentState !== 'error') return;

    setAgentState('connecting');
    setTranscript([]);
    setErrorMessage('');

    try {
      const sessionData = await createVoiceSession();
      const { websocket_url, client_secret, session } = sessionData;
      targetSampleRateRef.current = session.audio.input.format.rate || 24000;

      const ws = new WebSocket(websocket_url, [`xai-client-secret.${client_secret}`]);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'session.update', session }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'session.updated':
            setAgentState('listening');
            startMicrophone();
            break;
          case 'response.output_audio_transcript.delta':
            setTranscript(prev => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'agent') {
                return [...prev.slice(0, -1), { ...last, text: last.text + message.delta }];
              }
              return [...prev, { speaker: 'agent', text: message.delta }];
            });
            break;
          case 'response.output_audio.delta':
            if (message.delta) {
              audioQueueRef.current.push(message.delta);
              if (!isPlayingRef.current) {
                processAudioQueue();
              }
            }
            break;
          case 'session.ended':
            disconnect();
            break;
          case 'error':
            setErrorMessage(message.message || 'An unknown error occurred.');
            setAgentState('error');
            disconnect();
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setErrorMessage('A connection error occurred.');
        setAgentState('error');
        disconnect();
      };

      ws.onclose = () => {
        if (agentState !== 'idle') {
          disconnect();
        }
      };
    } catch (error: any) {
      console.error('Failed to start voice session:', error);
      setErrorMessage(error.message || 'Failed to start the session.');
      setAgentState('error');
    }
  }, [agentState, disconnect, processAudioQueue, startMicrophone]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const handleFabClick = () => {
    setIsModalOpen(true);
    startAgent();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    disconnect();
  };

  if (!isVisible) return null;

  return (
    <>
      <button
        onClick={handleFabClick}
        className="fixed bottom-6 right-6 bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-red-700 transition-all transform hover:scale-110 z-50 animate-fade-in"
        aria-label="Start Voice Assistant"
      >
        <Bot size={28} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl border border-stone-700 flex flex-col h-[80vh] max-h-[600px] animate-slide-in-up">
            <div className="flex items-center justify-between p-4 border-b border-stone-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bot className="text-red-500" />
                Voice Assistant
              </h3>
              <button onClick={handleCloseModal} className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-700">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {transcript.map((item, index) => (
                <div key={index} className={`flex ${item.speaker === 'agent' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${item.speaker === 'agent' ? 'bg-stone-800 text-stone-200 rounded-bl-none' : 'bg-red-600 text-white rounded-br-none'}`}>
                    <p className="text-sm">{item.text}</p>
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>

            <div className="p-4 border-t border-stone-700 text-center flex-shrink-0">
              <AgentStateIndicator state={agentState} error={errorMessage} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
