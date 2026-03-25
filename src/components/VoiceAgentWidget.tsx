import { useState, useEffect } from 'react';
import type { AgentState } from '../hooks/useVoiceAgent';
import { Mic, X, Bot, AlertTriangle, Loader } from 'lucide-react';
import { useVoiceAgent } from '../hooks/useVoiceAgent';

const VoiceAgentWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { agentState, transcript, error, startSession, stopSession } = useVoiceAgent();

  const isVoiceEnabled = (window as any).KORA_CONFIG?.features?.voice?.enabled === true;

  useEffect(() => {
    if (isOpen && (agentState === 'idle' || agentState === 'error')) {
      startSession();
    }
  }, [isOpen, agentState, startSession]);

  const handleToggle = () => {
    if (isOpen) {
      stopSession();
    }
    setIsOpen(!isOpen);
  };

  if (!isVoiceEnabled) {
    return null;
  }

  const getStatusIndicator = (state: AgentState) => {
    switch (state) {
      case 'connecting':
        return <div className="p-2"><Loader className="w-6 h-6 animate-spin text-blue-400" /></div>;
      case 'listening':
        return <div className="p-2 bg-green-500/20 rounded-full"><div className="w-6 h-6 bg-green-500 rounded-full animate-pulse" /></div>;
      case 'thinking':
        return <div className="p-2 bg-yellow-500/20 rounded-full"><div className="w-6 h-6 bg-yellow-500 rounded-full animate-ping" /></div>;
      case 'speaking':
        return <div className="p-2 bg-blue-500/20 rounded-full"><div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse" /></div>;
      case 'error':
        return <div className="p-2"><AlertTriangle className="w-6 h-6 text-red-500" /></div>;
      default:
        return <Mic className="w-6 h-6" />;
    }
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className="fixed bottom-6 right-6 bg-red-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-red-700 transition-all transform hover:scale-110"
        aria-label={isOpen ? 'Close Voice Assistant' : 'Open Voice Assistant'}
      >
        {isOpen ? <X className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-[60vh] bg-stone-900/80 backdrop-blur-md rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-stone-700 animate-slide-in-up">
          <div className="flex-shrink-0 p-4 border-b border-stone-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-white">Voice Assistant</h3>
            </div>
            {getStatusIndicator(agentState)}
          </div>
          <div className="flex-grow p-4 overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-500/10 text-red-400 rounded-lg mb-4">
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            )}
            <p className="text-stone-200 whitespace-pre-wrap leading-relaxed">
              {transcript || (agentState === 'listening' ? 'Listening...' : 'Say something to start...')}
            </p>
          </div>
          <div className="flex-shrink-0 p-4 border-t border-stone-700">
            <button
              onClick={handleToggle}
              className="w-full bg-stone-700 hover:bg-stone-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAgentWidget;