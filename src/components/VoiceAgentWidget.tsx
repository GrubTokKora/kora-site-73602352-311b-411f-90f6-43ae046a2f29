import { useState, useEffect, useRef } from 'react'
import type { FC, FormEvent } from 'react'
import { Mic, Send, Bot, X, LoaderCircle } from 'lucide-react'

// Helper to get API base URL from runtime config
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.KORA_CONFIG?.apiBaseUrl) {
    return window.KORA_CONFIG.apiBaseUrl.replace(/\/+$/, '')
  }
  // Fallback, though the backend should always provide this.
  return 'http://localhost:8000'
}

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
}

interface VoiceAgentWidgetProps {
  businessId: string
}

const VoiceAgentWidget: FC<VoiceAgentWidgetProps> = ({ businessId }) => {
  const [isConfigEnabled, setIsConfigEnabled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch public voice config to determine if the widget should be shown
    const fetchVoiceConfig = async () => {
      try {
        const apiBaseUrl = getApiBaseUrl()
        const response = await fetch(`${apiBaseUrl}/api/v1/public/voice/config/${businessId}`)
        if (!response.ok) {
          throw new Error('Could not fetch voice configuration.')
        }
        const config = await response.json()
        if (config.enabled) {
          setIsConfigEnabled(true)
        }
      } catch (err) {
        console.error('Voice Agent: Error fetching config:', err)
        // Silently fail, widget will not be rendered
      } finally {
        setIsLoading(false)
      }
    }

    fetchVoiceConfig()
  }, [businessId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const startSession = async () => {
    if (sessionId) return
    setIsSending(true)
    setError(null)
    try {
      const apiBaseUrl = getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/api/v1/public/voice/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
      })
      if (!response.ok) throw new Error('Failed to start session.')
      const data = await response.json()
      setSessionId(data.session_id)
      setMessages([{ id: 'welcome', text: data.welcome_message || 'Hello! How can I help you today?', sender: 'bot' }])
    } catch (err) {
      setError('Could not connect to the voice agent. Please try again later.')
      console.error('Voice Agent: Session start error:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleWidgetToggle = () => {
    const nextIsOpen = !isOpen
    setIsOpen(nextIsOpen)
    if (nextIsOpen && !sessionId) {
      startSession()
    }
  }

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!userInput.trim() || isSending || !sessionId) return

    const userMessage: Message = { id: Date.now().toString(), text: userInput, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setUserInput('')
    setIsSending(true)
    setError(null)

    try {
      const apiBaseUrl = getApiBaseUrl()
      const response = await fetch(`${apiBaseUrl}/api/v1/public/voice/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: userInput,
        }),
      })

      if (!response.ok) throw new Error('Failed to get a response.')
      
      const data = await response.json()
      const botMessage: Message = { id: data.id || Date.now().toString() + 'b', text: data.reply, sender: 'bot' }
      setMessages(prev => [...prev, botMessage])

    } catch (err) {
      setError('Sorry, something went wrong. Please try again.')
      console.error('Voice Agent: Chat error:', err)
      const errorMessage: Message = { id: 'error-' + Date.now(), text: 'I seem to be having trouble connecting. Please try again in a moment.', sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading || !isConfigEnabled) {
    return null
  }

  return (
    <>
      {/* Chat Panel */}
      <div className={`fixed bottom-24 right-4 sm:right-6 md:right-8 z-50 w-[calc(100%-2rem)] sm:w-96 h-[60vh] bg-stone-900/80 backdrop-blur-xl border border-stone-700 rounded-2xl shadow-2xl flex flex-col transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-stone-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">AI Assistant</h3>
              <p className="text-xs text-emerald-400 flex items-center"><span className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5"></span>Online</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-stone-400 hover:text-white hover:bg-stone-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && <div className="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center flex-shrink-0"><Bot className="w-5 h-5 text-stone-300" /></div>}
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-stone-800 text-stone-200 rounded-bl-none'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isSending && messages[messages.length - 1]?.sender === 'user' && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center flex-shrink-0"><Bot className="w-5 h-5 text-stone-300" /></div>
                <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-stone-800 text-stone-200 rounded-bl-none">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-pulse delay-200"></span>
                    <span className="w-2 h-2 bg-stone-400 rounded-full animate-pulse delay-400"></span>
                  </div>
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-400 text-center pt-2">{error}</p>}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t border-stone-700">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question..."
              className="w-full px-4 py-2 bg-stone-800 border border-stone-700 rounded-full text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
              disabled={isSending || !sessionId}
            />
            <button type="button" className="p-3 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-full transition-colors disabled:opacity-50" disabled={isSending || !sessionId}>
              <Mic className="w-5 h-5" />
            </button>
            <button type="submit" className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors disabled:opacity-50" disabled={isSending || !sessionId}>
              {isSending ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>

      {/* Trigger Button */}
      <button
        onClick={handleWidgetToggle}
        className={`fixed bottom-4 right-4 sm:right-6 md:right-8 z-50 w-16 h-16 bg-red-600 text-white rounded-full shadow-2xl shadow-red-600/30 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-600/50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Open AI Assistant"
      >
        <Bot className="w-8 h-8" />
      </button>
    </>
  )
}

export default VoiceAgentWidget