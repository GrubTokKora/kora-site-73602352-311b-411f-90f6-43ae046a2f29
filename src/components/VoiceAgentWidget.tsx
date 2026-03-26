import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Mic, Bot, User, X, Loader2, Volume2, AlertTriangle } from 'lucide-react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import type { AgentState, VoiceMessage } from '../hooks/useVoiceAgent';

const AgentStatusIndicator = ({ state }: { state: AgentState }) => {
  const statusMap: Record<AgentState, { text: string; icon: ReactNode; color: string }> = {
    idle: { text: 'Tap to speak', icon: <Mic className="w-6 h-6" />, color: 'bg-red-600' },
    connecting: { text: 'Connecting...', icon: <Loader2 className="w-6 h-6 animate-spin" />, color: 'bg-blue-500' },
    listening: { text: 'Listening...', icon: <Volume2 className="w-6 h-6 animate-pulse" />, color: 'bg-green-500' },
    speaking: { text: 'Speaking...', icon: <Bot className="w-6 h-6" />, color: 'bg-purple-500' },
    thinking: { text: 'Thinking...', icon: <Loader2 className="w-6 h-6 animate-spin" />, color: 'bg-yellow-500' },
    error: { text: 'Error', icon: <AlertTriangle className="w-6 h-6" />, color: 'bg-gray-500' },
  };

  const { text, icon, color } = statusMap[state] || statusMap.idle;

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <button
        className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg ${color}`}
      >
        {icon}
      </button>
      <p className="mt-4 text-sm text-stone-400">{text}</p>
    </div>
  );
};

const MessageBubble = ({ message }: { message: VoiceMessage }) => {
  const isAgent = message.sender === 'agent';
  return (
    <div className={`flex items-start gap-3 ${isAgent ? '' : 'justify-end'}`}>
      {isAgent && (
        <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-red-500" />
        </div>
      )}
      <div
        className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
          isAgent
            ? 'bg-stone-700 text-stone-200 rounded-tl-none'
            : 'bg-red-600 text-white rounded-br-none'
        }`}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
      </div>
      {!isAgent && (
        <div className="w-8 h-8 rounded-full bg-stone-600 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-stone-300" />
        </div>
      )}
    </div>
  );
};

export default function VoiceAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { agentState, messages, assistantStreaming, error, startSession, stopSession } = useVoiceAgent();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check runtime config to decide if the widget should be visible at all.
    if ((window as any).KORA_CONFIG?.features?.voice?.enabled === true) {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      stopSession();
    }
  }, [isOpen, startSession, stopSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistantStreaming]);

  if (!isVisible) {
    return null;
  }

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/30 transition-all duration-300 transform hover:scale-110 hover:bg-red-700 ${
          isOpen ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
        }`}
        aria-label="Open Voice Assistant"
      >
        <Mic className="w-7 h-7" />
      </button>

      {/* Widget Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] max-w-md h-[70vh] max-h-[600px] bg-stone-900/80 backdrop-blur-xl border border-stone-700 rounded-2xl shadow-2xl flex flex-col transition-all duration-500 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-stone-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-white">Voice Assistant</h2>
          </div>
          <button
            onClick={toggleOpen}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-full transition-colors"
            aria-label="Close Voice Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {assistantStreaming && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-red-500" />
                </div>
                <div className="max-w-xs md:max-w-md px-4 py-3 rounded-2xl bg-stone-700 text-stone-200 rounded-tl-none">
                  <p className="text-sm leading-relaxed">{assistantStreaming}<span className="inline-block w-1 h-4 bg-white ml-1 animate-pulse"></span></p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Footer / Controls */}
        <footer className="p-6 border-t border-stone-700 flex-shrink-0">
          {error ? (
            <div className="text-center text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">
              <p>{error}</p>
            </div>
          ) : (
            <AgentStatusIndicator state={agentState} />
          )}
        </footer>
      </div>
    </>
  );
}