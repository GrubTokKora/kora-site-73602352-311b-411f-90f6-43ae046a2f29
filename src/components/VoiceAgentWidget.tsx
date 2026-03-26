import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Mic, X, Loader2, Volume2, AlertTriangle, Bot } from 'lucide-react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';

const VoiceAgentWidget = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { agentState, messages, assistantStreaming, error, startSession, stopSession } = useVoiceAgent();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Widget visibility is controlled by runtime config injected into index.html
    const voiceEnabled = (window as any).KORA_CONFIG?.features?.voice?.enabled === true;
    setIsVisible(voiceEnabled);
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      startSession();
    } else {
      stopSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistantStreaming]);

  if (!isVisible) {
    return null;
  }

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  const renderAgentStatus = (): ReactNode => {
    switch (agentState) {
      case 'idle':
        return <span className="text-stone-400">Click the mic to start</span>;
      case 'connecting':
        return <div className="flex items-center text-stone-300"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</div>;
      case 'listening':
        return <div className="flex items-center text-emerald-400"><Volume2 className="w-4 h-4 mr-2" /> Listening...</div>;
      case 'speaking':
        return <div className="flex items-center text-cyan-400"><Volume2 className="w-4 h-4 mr-2 animate-pulse" /> Speaking...</div>;
      case 'thinking':
        return <div className="flex items-center text-amber-400"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Thinking...</div>;
      case 'error':
        return <div className="flex items-center text-red-400"><AlertTriangle className="w-4 h-4 mr-2" /> Error</div>;
      default:
        return null;
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/30 transform transition-all duration-300 hover:scale-110 hover:bg-red-700 z-50 ${isChatOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
        aria-label="Open Voice Assistant"
      >
        <Mic className="w-8 h-8" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full h-full md:w-[400px] md:h-[600px] bg-stone-900/80 backdrop-blur-xl border border-stone-700/50 rounded-t-2xl md:rounded-2xl shadow-2xl z-50 flex flex-col transition-transform duration-500 ease-in-out ${isChatOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-stone-700/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">Voice Assistant</h2>
              <p className="text-sm text-stone-400">The Pie Pizzeria</p>
            </div>
          </div>
          <button
            onClick={toggleChat}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-700/50 rounded-full transition-colors"
            aria-label="Close Voice Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <MessageBubble key={index} sender={msg.sender} text={msg.text} />
            ))}
            {assistantStreaming && (
              <MessageBubble sender="agent" text={assistantStreaming} isStreaming />
            )}
            {error && (
              <div className="p-3 bg-red-600/10 border border-red-600/30 rounded-lg text-red-400 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-stone-700/50 flex-shrink-0 flex items-center justify-between">
          <div className="text-sm font-medium">{renderAgentStatus()}</div>
          <button
            onClick={stopSession}
            className="px-4 py-2 bg-stone-700/50 text-stone-300 hover:bg-stone-700 hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            End Session
          </button>
        </footer>
      </div>
    </>
  );
};

interface MessageBubbleProps {
  sender: 'user' | 'agent';
  text: string;
  isStreaming?: boolean;
}

const MessageBubble = ({ sender, text, isStreaming = false }: MessageBubbleProps) => {
  const isUser = sender === 'user';
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-red-600 text-white rounded-br-md'
            : 'bg-stone-800 text-stone-200 rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed">{text}{isStreaming && <span className="inline-block w-1 h-4 bg-white ml-1 animate-pulse" />}</p>
      </div>
    </div>
  );
};

export default VoiceAgentWidget;