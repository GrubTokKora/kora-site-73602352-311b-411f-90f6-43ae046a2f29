import { useMemo, useState, useEffect, useRef } from 'react';
import { Mic, Bot, X, Loader } from 'lucide-react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';

function isVoiceFeatureEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const v = (window as any).KORA_CONFIG?.features?.voice as unknown;
  return Boolean(v && typeof v === 'object' && (v as { enabled?: boolean }).enabled === true);
}

export default function VoiceAgentWidget() {
  const visible = useMemo(() => isVoiceFeatureEnabled(), []);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    agentState,
    messages,
    assistantStreaming,
    error,
    startSession,
    stopSession,
  } = useVoiceAgent();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, assistantStreaming]);

  const handleToggle = () => {
    setIsOpen(prev => {
      if (prev) {
        stopSession();
        return false;
      } else {
        startSession();
        return true;
      }
    });
  };

  const handleClose = () => {
    stopSession();
    setIsOpen(false);
  };

  if (!visible) return null;

  const isLoading = agentState === 'connecting';
  const isConnected = agentState === 'listening' || agentState === 'speaking' || agentState === 'thinking';
  const isError = agentState === 'error';

  const getFooterText = () => {
    switch (agentState) {
      case 'connecting': return 'Connecting...';
      case 'listening': return 'Listening...';
      case 'speaking': return 'Speaking...';
      case 'thinking': return 'Thinking...';
      case 'error': return 'Connection failed';
      case 'idle': return 'Tap to start';
      default: return 'Tap to start';
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 bg-red-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-red-700 transition-transform transform hover:scale-110"
        aria-label="Open Voice Assistant"
      >
        <Bot className="w-8 h-8" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={handleClose}
        >
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
              <button
                onClick={handleClose}
                className="p-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-full"
                aria-label="Close voice assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex items-end gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.sender === 'agent' ? (
                    <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-red-500" />
                    </div>
                  ) : null}
                  <div className={`max-w-[80%] p-3 rounded-2xl ${m.sender === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-stone-800 text-stone-200 rounded-bl-none'}`}>
                    <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))}

              {assistantStreaming.trim() ? (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="max-w-[80%] p-3 rounded-2xl bg-stone-800 text-stone-200 rounded-bl-none border border-stone-600/60">
                    <p className="text-sm whitespace-pre-wrap">{assistantStreaming}</p>
                  </div>
                </div>
              ) : null}

              {isLoading && messages.length === 0 ? <div className="text-center text-stone-400 text-sm">Connecting...</div> : null}
              {isError && error ? (
                <div className="p-3 bg-red-900/50 border border-red-500/30 text-red-300 rounded-lg text-sm">{error}</div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-6 flex flex-col items-center justify-center border-t border-stone-700 flex-shrink-0">
              <button
                onClick={startSession}
                disabled={isLoading || isConnected}
                className="bg-red-600 text-white w-20 h-20 rounded-full flex items-center justify-center disabled:bg-stone-700"
              >
                {isLoading ? <Loader className="w-8 h-8 animate-spin" /> : <Mic className="w-8 h-8" />}
              </button>
              <p className="text-xs text-stone-500 mt-3">
                {getFooterText()}
              </p>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}