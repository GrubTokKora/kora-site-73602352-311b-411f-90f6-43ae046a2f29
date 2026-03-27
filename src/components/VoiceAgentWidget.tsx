import { useMemo, useState, useEffect, useRef } from 'react';
import { Mic, Bot, X, Loader2, Volume2, BrainCircuit, AlertTriangle, Ear } from 'lucide-react';
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

  const statusIcon = {
    idle: <Mic className="w-4 h-4" />,
    connecting: <Loader2 className="w-4 h-4 animate-spin" />,
    listening: <Ear className="w-4 h-4" />,
    speaking: <Volume2 className="w-4 h-4" />,
    thinking: <BrainCircuit className="w-4 h-4" />,
    error: <AlertTriangle className="w-4 h-4" />,
  }[agentState];

  const statusLabel = {
    idle: 'Idle',
    connecting: 'Connecting',
    listening: 'Listening',
    speaking: 'Speaking',
    thinking: 'Thinking',
    error: 'Error',
  }[agentState];

  const statusTone =
    agentState === 'error'
      ? 'text-red-300 border-red-500/40 bg-red-950/30'
      : agentState === 'connecting'
        ? 'text-amber-300 border-amber-500/40 bg-amber-950/20'
        : agentState === 'thinking'
          ? 'text-yellow-300 border-yellow-500/40 bg-yellow-950/20'
          : agentState === 'speaking'
            ? 'text-sky-300 border-sky-500/40 bg-sky-950/20'
        : 'text-emerald-300 border-emerald-500/30 bg-emerald-950/20';

  return (
    <>
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 bg-red-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-red-700 transition-transform transform hover:scale-110"
        aria-label="Open Voice Assistant"
      >
        <Mic className="w-8 h-8" />
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
              <div>
                <h2 className="text-sm font-bold text-white">Voice Assistant</h2>
                <p className="text-xs text-stone-400">Powered by Kora</p>
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
              {messages.length === 0 && !assistantStreaming.trim() && agentState !== 'error' && (
                <div className="min-h-[160px] flex flex-col items-center justify-center text-center gap-3">
                  {agentState === 'connecting' ? (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-300 via-red-500 to-red-900 animate-pulse" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                      <Ear className="w-5 h-5 text-emerald-300" />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-white">
                    {agentState === 'connecting' ? 'Connecting...' : 'Ask me anything'}
                  </p>
                  <p className="text-xs text-stone-400">
                    {agentState === 'connecting'
                      ? 'Preparing your voice assistant'
                      : 'Start speaking and I will respond instantly'}
                  </p>
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`flex items-end gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.sender === 'agent' ? (
                    <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0 text-red-500">
                      <Bot className="w-5 h-5" />
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
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="max-w-[80%] p-3 rounded-2xl bg-stone-800 text-stone-200 rounded-bl-none border border-stone-600/60">
                    <p className="text-sm whitespace-pre-wrap">{assistantStreaming}</p>
                  </div>
                </div>
              ) : null}

                {error ? (
                  <div className="p-3 bg-red-900/50 border border-red-500/30 text-red-300 rounded-lg text-sm">{error}</div>
                ) : null}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 border-t border-stone-700 flex-shrink-0 flex items-center justify-between gap-3">
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold ${statusTone}`}>
                {statusIcon}
                <span>{statusLabel}</span>
              </div>
              <button
                onClick={startSession}
                disabled={agentState === 'connecting' || agentState === 'listening' || agentState === 'speaking' || agentState === 'thinking'}
                className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center disabled:bg-stone-700"
              >
                {agentState === 'connecting' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}