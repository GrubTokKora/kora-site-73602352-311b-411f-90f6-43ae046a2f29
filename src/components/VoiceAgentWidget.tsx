import { useState, useEffect } from 'react';
import { Mic, X, Loader, Bot, Volume2, AlertTriangle } from 'lucide-react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';
import type { AgentState } from '../hooks/useVoiceAgent';

const StatusIndicator = ({ state }: { state: AgentState }) => {
  let icon, text, color;
  switch (state) {
    case 'connecting':
      icon = <Loader className="w-5 h-5 animate-spin" />;
      text = 'Connecting...';
      color = 'text-stone-400';
      break;
    case 'listening':
      icon = <Mic className="w-5 h-5 text-emerald-400" />;
      text = 'Listening...';
      color = 'text-emerald-400';
      break;
    case 'speaking':
      icon = <Volume2 className="w-5 h-5 text-blue-400" />;
      text = 'Speaking...';
      color = 'text-blue-400';
      break;
    case 'thinking':
      icon = <Bot className="w-5 h-5 text-amber-400" />;
      text = 'Thinking...';
      color = 'text-amber-400';
      break;
    case 'error':
      icon = <AlertTriangle className="w-5 h-5 text-red-400" />;
      text = 'Error';
      color = 'text-red-400';
      break;
    default:
      return null;
  }

  return (
    <div className={`flex items-center space-x-2 text-sm font-medium ${color}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
};

export default function VoiceAgentWidget() {
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { agentState, transcript, error, startSession, stopSession } = useVoiceAgent();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFabClick = () => {
    setIsModalOpen(true);
    startSession();
  };

  const handleClose = () => {
    stopSession();
    setIsModalOpen(false);
  };

  if (!isMounted || !(window as any).KORA_CONFIG?.features?.voice?.enabled) {
    return null;
  }

  return (
    <>
      {!isModalOpen && (
        <button
          onClick={handleFabClick}
          className="voice-agent-fab w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-600/30 hover:bg-red-700 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-600/50"
          aria-label="Start Voice Assistant"
        >
          <Mic className="w-8 h-8" />
        </button>
      )}

      {isModalOpen && (
        <div className="voice-agent-modal-overlay animate-fade-in">
          <div className="voice-agent-modal animate-slide-in-up p-6 flex flex-col h-[70vh] max-h-[600px]">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Bot className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-bold text-white">Voice Assistant</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-grow bg-stone-800/50 rounded-lg p-4 overflow-y-auto mb-4">
              <p className="text-stone-200 whitespace-pre-wrap leading-relaxed">
                {transcript || (agentState === 'connecting' ? 'Please wait...' : 'Hi! How can I help you today?')}
              </p>
              {error && (
                <p className="mt-4 text-red-400 bg-red-500/10 p-3 rounded-md">{error}</p>
              )}
            </div>

            <div className="flex-shrink-0 h-12 flex items-center justify-between">
              <StatusIndicator state={agentState} />
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors"
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
