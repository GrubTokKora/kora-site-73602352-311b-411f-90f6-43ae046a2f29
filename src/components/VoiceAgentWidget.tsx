import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, X, Bot, Loader, Volume2, AlertTriangle } from 'lucide-react';
import { createVoiceSession } from '../voice';
import { audioBufferToPcm16Base64, downsampleBuffer } from '../utils/audio';

type VoiceAgentState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

const TARGET_SAMPLE_RATE = 16000;

export default function VoiceAgentWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agentState, setAgentState] = useState<VoiceAgentState>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const ws = useRef<WebSocket | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const audioProcessor = useRef<ScriptProcessorNode | null>(null);
  const audioQueue = useRef<AudioBuffer[]>([]);
  const isPlaying = useRef(false);

  useEffect(() => {
    // Check config on mount to decide if the widget should be enabled at all
    if ((window as any).KORA_CONFIG?.features?.voice?.enabled === true) {
      setIsVisible(true);
    }
  }, []);

  const playNextInQueue = useCallback(async () => {
    if (isPlaying.current || audioQueue.current.length === 0) {
      return;
    }
    isPlaying.current = true;
    setAgentState('speaking');

    const buffer = audioQueue.current.shift();
    if (buffer && audioContext.current) {
      const source = audioContext.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.current.destination);
      source.onended = () => {
        isPlaying.current = false;
        if (audioQueue.current.length > 0) {
          playNextInQueue();
        } else {
          // If queue is empty, go back to listening
          setAgentState('listening');
        }
      };
      source.start();
    } else {
      isPlaying.current = false;
    }
  }, []);

  const handleAudioData = useCallback(async (base64Audio: string) => {
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioData = atob(base64Audio);
      const uint8Array = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        uint8Array[i] = audioData.charCodeAt(i);
      }
      const decodedData = await audioContext.current.decodeAudioData(uint8Array.buffer);
      audioQueue.current.push(decodedData);
      playNextInQueue();
    } catch (error) {
      console.error('Error processing audio data:', error);
    }
  }, [playNextInQueue]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
    }
    if (audioProcessor.current) {
      audioProcessor.current.disconnect();
      audioProcessor.current = null;
    }
    audioQueue.current = [];
    isPlaying.current = false;
    if (agentState !== 'error') {
      setAgentState('idle');
    }
  }, [agentState]);

  const startMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Microphone access is not supported by your browser.');
      setAgentState('error');
      return;
    }

    try {
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const source = audioContext.current.createMediaStreamSource(mediaStream.current);
      const bufferSize = 4096;
      audioProcessor.current = audioContext.current.createScriptProcessor(bufferSize, 1, 1);

      audioProcessor.current.onaudioprocess = async (e) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          const downsampledBuffer = await downsampleBuffer(e.inputBuffer, TARGET_SAMPLE_RATE);
          const base64 = audioBufferToPcm16Base64(downsampledBuffer);
          ws.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64 }));
        }
      };

      source.connect(audioProcessor.current);
      audioProcessor.current.connect(audioContext.current.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setErrorMessage('Microphone access denied. Please enable it in your browser settings.');
      setAgentState('error');
    }
  }, []);

  const connect = useCallback(async () => {
    if (ws.current) return;

    setAgentState('connecting');
    setTranscript('');
    setErrorMessage('');

    try {
      const sessionData = await createVoiceSession();
      const { websocket_url, client_secret, session } = sessionData;

      if (!websocket_url || !client_secret || !session) {
        throw new Error('Invalid session data received.');
      }

      const socket = new WebSocket(websocket_url, [`xai-client-secret.${client_secret}`]);
      ws.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        socket.send(JSON.stringify({ type: 'session.update', session }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'session.updated':
            console.log('Session updated, starting microphone.');
            setAgentState('listening');
            startMicrophone();
            break;
          case 'response.output_audio_transcript.delta':
            setTranscript(prev => prev + data.delta);
            break;
          case 'response.output_audio_transcript.done':
            // Final transcript chunk
            break;
          case 'response.output_audio.delta':
            if (data.delta) {
              handleAudioData(data.delta);
            }
            break;
          case 'session.error':
            console.error('Session error:', data.error);
            setErrorMessage(data.error.message || 'A session error occurred.');
            setAgentState('error');
            disconnect();
            break;
          default:
            break;
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setErrorMessage('Connection failed. Please try again.');
        setAgentState('error');
        disconnect();
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        disconnect();
      };
    } catch (error) {
      console.error('Failed to create voice session:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setErrorMessage(message);
      setAgentState('error');
      ws.current = null;
    }
  }, [handleAudioData, disconnect, startMicrophone]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const openModal = () => {
    setIsModalOpen(true);
    connect();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    disconnect();
  };

  if (!isVisible) {
    return null;
  }

  const getStatusIndicator = () => {
    switch (agentState) {
      case 'connecting':
        return <div className="flex items-center space-x-2"><Loader className="w-4 h-4 animate-spin" /><span>Connecting...</span></div>;
      case 'listening':
        return <div className="flex items-center space-x-2 text-emerald-400"><Mic className="w-4 h-4" /><span>Listening...</span></div>;
      case 'speaking':
        return <div className="flex items-center space-x-2 text-blue-400"><Volume2 className="w-4 h-4" /><span>Speaking...</span></div>;
      case 'error':
        return <div className="flex items-center space-x-2 text-red-400"><AlertTriangle className="w-4 h-4" /><span>Error</span></div>;
      default:
        return <span>Idle</span>;
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 bg-red-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-all duration-300 transform hover:scale-110 z-50"
        aria-label="Start Voice Assistant"
      >
        <Mic className="w-8 h-8" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center p-4 border-b border-stone-700">
              <div className="flex items-center space-x-3">
                <Bot className="w-6 h-6 text-red-500" />
                <h2 className="text-lg font-semibold text-white">Voice Assistant</h2>
              </div>
              <button onClick={closeModal} className="text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 min-h-[200px] flex flex-col">
              <div className="flex-grow text-stone-200">
                {transcript || (agentState !== 'error' && <span className="text-stone-500">Say something to get started...</span>)}
                {errorMessage && <p className="text-red-400 mt-4">{errorMessage}</p>}
              </div>
              <div className="text-sm text-stone-500 mt-4">
                {getStatusIndicator()}
              </div>
            </div>
            <div className="p-4 border-t border-stone-700 text-center">
              <button
                onClick={closeModal}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}