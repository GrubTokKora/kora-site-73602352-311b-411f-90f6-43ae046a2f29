import { useState, useEffect } from 'react';
import { Mic, Bot, X, Loader, Volume2 } from 'lucide-react';
import { getApiBaseUrl, BUSINESS_ID } from '../utils/api';

type AgentStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
type Message = {
  sender: 'user' | 'agent';
  text: string;
};

export default function VoiceAgentWidget() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/v1/public/voice/config/${BUSINESS_ID}`);
        if (!response.ok) {
          throw new Error('Failed to fetch voice configuration');
        }
        const config = await response.json();
        setIsEnabled(config.enabled);
      } catch (e) {
        console.error('Voice Agent Error:', e);
        setIsEnabled(false);
      } finally {
        setIsConfigured(true);
      }
    };

    fetchConfig();
  }, []);

  const createSession = async () => {
    if (session) return;
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/public/voice/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: BUSINESS_ID }),
      });
      if (!response.ok) {
        throw new Error('Failed to create voice session');
      }
      const sessionData = await response.json();
      setSession(sessionData);
      setMessages([{ sender: 'agent', text: "Hello! How can I help you today?" }]);
    } catch (e) {
      console.error('Voice Session Error:', e);
      setError('Could not connect to the voice agent.');
      setStatus('error');
    }
  };

  const toggleWidget = () => {
    setIsOpen(prev => {
      if (!prev && isEnabled && !session) {
        createSession();
      }
      return !prev;
    });
  };

  const handleMicClick = () => {
    if (status === 'listening') {
      setStatus('processing');
      // Mock processing and response
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'user', text: 'How late are you open?' }]);
        setStatus('speaking');
        setTimeout(() => {
          setMessages(prev => [...prev, { sender: 'agent', text: 'We are open until 5:00 PM every day.' }]);
          setStatus('idle');
        }, 2000);
      }, 1500);
    } else {
      setStatus('listening');
    }
  };

  if (!isConfigured || !isEnabled) {
    return null;
  }

  const MicButton = () => {
    switch (status) {
      case 'listening':
        return (
          <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center animate-pulse">
            <Mic className="w-10 h-10 text-white" />
          </div>
        );
      case 'processing':
        return (
          <div className="w-20 h-20 rounded-full bg-stone-600 flex items-center justify-center">
            <Loader className="w-10 h-10 text-white animate-spin" />
          </div>
        );
      case 'speaking':
        return (
          <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center">
            <Volume2 className="w-10 h-10 text-white" />
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
          <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center">
            <Mic className="w-10 h-10 text-white" />
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
              {status === 'listening' && <div className="text-center text-stone-400 text-sm">Listening...</div>}
              {error && <div className="p-3 bg-red-900/50 border border-red-500/30 text-red-300 rounded-lg text-sm">{error}</div>}
            </div>

            <footer className="p-6 flex flex-col items-center justify-center border-t border-stone-700 flex-shrink-0">
              <button onClick={handleMicClick} disabled={status === 'processing' || status === 'speaking' || !!error}>
                <MicButton />
              </button>
              <p className="text-xs text-stone-500 mt-3">
                {status === 'idle' && 'Tap to speak'}
                {status === 'listening' && 'Tap to stop'}
                {status === 'processing' && 'Thinking...'}
                {status === 'speaking' && 'Responding...'}
                {status === 'error' && 'Connection failed'}
              </p>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}