import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Mic, X, Loader2, Volume2, User, Bot, AlertTriangle } from 'lucide-react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import type { AgentState, VoiceMessage } from '../hooks/useVoiceAgent';

const AgentStateIndicator = ({ state }: { state: AgentState }) => {
  const stateMap: Record<AgentState, { text: string; icon: ReactNode }> = {
    idle: { text: 'Idle', icon: null },
    connecting: { text: 'Connecting...', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    listening: { text: 'Listening...', icon: <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> },
    speaking: { text: 'Speaking...', icon: <Volume2 className="w-4 h-4 text-blue-400" /> },
    thinking: { text: 'Thinking...', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    error: { text: 'Error', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
  };

  const { text, icon } = stateMap[state] || {};

  return (
    <div className="flex items-center space-x-2 text-xs text-stone-400">
      {icon}
      <span>{text}</span>
    </div>
  );
};

const MessageBubble = ({ message }: { message: VoiceMessage }) => {
  const isUser = message.sender === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-red-600 flex-shrink-0 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-red-600 text-white rounded-br-lg'
            : 'bg-stone-700 text-stone-200 rounded-bl-lg'
        }`}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-stone-600 flex-shrink-0 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default function VoiceAgentWidget() {
  const [showWidget, setShowWidget] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { agentState, messages, assistantStreaming, error, startSession, stopSession } = useVoiceAgent();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The decision to show the widget is based on the runtime config injected by the backend.
    if ((window as any).KORA_CONFIG?.features?.voice?.enabled === true) {
      setShowWidget(true);
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

  if (!showWidget) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[1000] w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl shadow-red-900/50 transition-all duration-300 transform hover:scale-110 ${
          isOpen ? 'bg-stone-700 hover:bg-stone-600' : 'bg-red-600 hover:bg-red-700'
        }`}
        aria-label={isOpen ? 'Close Voice Assistant' : 'Open Voice Assistant'}
      >
        {isOpen ? <X className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[999] w-[calc(100vw-3rem)] max-w-md h-[60vh] max-h-[700px] bg-stone-900/80 backdrop-blur-xl border border-stone-700 rounded-2xl shadow-2xl flex flex-col animate-slide-in-up">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-stone-700 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white">Voice Assistant</h3>
              <AgentStateIndicator state={agentState} />
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <MessageBubble key={index} message={msg} />
            ))}
            {assistantStreaming && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-600 flex-shrink-0 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-xs md:max-w-md px-4 py-3 rounded-2xl bg-stone-700 text-stone-200 rounded-bl-lg">
                  <p className="text-sm leading-relaxed">{assistantStreaming}<span className="inline-block w-1 h-4 bg-stone-400 ml-1 animate-pulse"></span></p>
                </div>
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-500/30 rounded-lg text-sm text-red-300">
                <strong>Error:</strong> {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-3 border-t border-stone-700 text-center">
            <p className="text-xs text-stone-500">Powered by Kora AI</p>
          </div>
        </div>
      )}
    </>
  );
}