import { useState, useRef, useCallback, useEffect } from 'react';
import { createVoiceSession } from '../voice';
import { audioBufferToPcm16Base64, downsampleBuffer } from '../utils/audio';

export type AgentState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'thinking'
  | 'error';

export function useVoiceAgent() {
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const websocketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const sessionConfigRef = useRef<any>(null);

  const processAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }
    isPlayingRef.current = true;
    setAgentState('speaking');

    const audioData = audioQueueRef.current.shift();
    if (audioData && audioContextRef.current) {
      try {
        const decodedData = atob(audioData);
        const uint8Array = new Uint8Array(decodedData.length);
        for (let i = 0; i < decodedData.length; i++) {
          uint8Array[i] = decodedData.charCodeAt(i);
        }

        const audioBuffer = await audioContextRef.current.decodeAudioData(uint8Array.buffer);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          isPlayingRef.current = false;
          processAudioQueue();
        };
        source.start();
      } catch (e) {
        console.error('Error playing audio:', e);
        isPlayingRef.current = false;
        processAudioQueue();
      }
    } else {
      isPlayingRef.current = false;
      if (agentState === 'speaking') {
        setAgentState('listening');
      }
    }
  }, [agentState]);

  const stopSession = useCallback(() => {
    setAgentState('idle');
    setTranscript('');
    setError(null);

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  const startMic = useCallback(async () => {
    if (!sessionConfigRef.current) {
        console.error("Session config not available");
        setError("Session config not available");
        setAgentState('error');
        return;
    }
    const targetSampleRate = sessionConfigRef.current.audio.input.format.rate || 24000;

    try {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;
      
      await context.resume();

      const source = context.createMediaStreamSource(micStreamRef.current);
      const processor = context.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = async (e) => {
        if (websocketRef.current?.readyState !== WebSocket.OPEN) return;

        const inputBuffer = e.inputBuffer;
        const downsampledBuffer = await downsampleBuffer(inputBuffer, targetSampleRate);
        const base64 = audioBufferToPcm16Base64(downsampledBuffer);
        
        websocketRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64,
        }));
      };

      source.connect(processor);
      processor.connect(context.destination);
      setAgentState('listening');
    } catch (err) {
      console.error('Error starting microphone:', err);
      setError('Could not access microphone. Please check permissions.');
      setAgentState('error');
      stopSession();
    }
  }, [stopSession]);

  const startSession = useCallback(async () => {
    if (agentState !== 'idle' && agentState !== 'error') return;

    setAgentState('connecting');
    setError(null);
    setTranscript('');

    try {
      const { websocket_url, client_secret, session } = await createVoiceSession();
      sessionConfigRef.current = session;

      const ws = new WebSocket(websocket_url, [`xai-client-secret.${client_secret}`]);
      websocketRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'session.update', session }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'session.updated':
            startMic();
            break;
          case 'response.output_audio_transcript.delta':
            setTranscript(prev => prev + data.delta);
            break;
          case 'response.output_audio_transcript.done':
            // Final transcript if needed, delta should be sufficient
            break;
          case 'response.output_audio.delta':
            if (data.delta) {
              audioQueueRef.current.push(data.delta);
              processAudioQueue();
            }
            break;
          case 'response.state.updated':
            if (data.state === 'thinking') {
                setAgentState('thinking');
            } else if (data.state === 'speaking') {
                setAgentState('speaking');
            } else {
                if (agentState !== 'listening') setAgentState('listening');
            }
            break;
          case 'session.error':
            console.error('Session error:', data.message);
            setError(data.message);
            setAgentState('error');
            stopSession();
            break;
        }
      };

      ws.onclose = () => {
        if (agentState !== 'idle') {
          stopSession();
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error.');
        setAgentState('error');
        stopSession();
      };
    } catch (err) {
      console.error('Failed to create voice session:', err);
      setError((err as Error).message || 'Failed to start session.');
      setAgentState('error');
    }
  }, [agentState, startMic, stopSession, processAudioQueue]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return { agentState, transcript, error, startSession, stopSession };
}
