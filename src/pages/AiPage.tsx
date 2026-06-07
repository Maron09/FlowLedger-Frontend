import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api, { workspaceUrl } from '../lib/axios'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_PROMPTS = [
  'Where am I spending the most?',
  'How is my savings rate?',
  'Am I on track with my budgets?',
  'Give me tips to save more',
  'How does my income compare to expenses?',
  'What are my biggest financial risks?',
]

function formatMessage(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>')
}

export default function AiPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const message = text ?? input.trim()
    if (!message || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setLoading(true)

    try {
      const { data } = await api.post(workspaceUrl(workspaceId!, '/ai/chat'), { message })
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-white text-xl font-semibold">AI Financial Assistant</h1>
        <p className="text-white/30 text-sm mt-0.5">Ask anything about your finances</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 10 10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div className="bg-[#0a0d12] border border-white/5 rounded-xl rounded-tl-none p-4 max-w-lg">
                <p className="text-white/70 text-sm">Hi! I'm your AI financial assistant. I can analyze your spending, income, and budgets to help you make better financial decisions. What would you like to know?</p>
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="space-y-2">
              <p className="text-white/20 text-xs uppercase tracking-wider px-1">Suggested questions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 text-white/50 hover:text-white/70 text-sm transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-emerald-500/20' : 'bg-white/5'
              }`}>
                {msg.role === 'user' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff60" strokeWidth="2">
                    <path d="M12 2a10 10 0 1 0 10 10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                )}
              </div>
              <div className={`rounded-xl p-4 max-w-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-white/80 rounded-tr-none'
                  : 'bg-[#0a0d12] border border-white/5 text-white/70 rounded-tl-none'
              }`}>
                <p dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}/>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff60" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div className="bg-[#0a0d12] border border-white/5 rounded-xl rounded-tl-none p-4">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }}/>
                <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }}/>
                <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }}/>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        <div className="flex gap-3 items-end bg-[#0a0d12] border border-white/10 rounded-xl p-3 focus-within:border-emerald-500/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your finances..."
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-white/20 text-sm resize-none focus:outline-none max-h-32"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = `${t.scrollHeight}px`
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p className="text-white/20 text-xs text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}