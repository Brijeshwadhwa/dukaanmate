/**
 * AssistantPage — Chat UI with multi-agent backend.
 * Shows agent activity panel + structured answer cards.
 * Full implementation in Phase 5; skeleton here for Phase 1.
 */
import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import toast from 'react-hot-toast'

const EXAMPLE_QUESTIONS = [
  'What should I reorder today?',
  'Mere paas 10 chips hain, cost ₹18, price kitna rakhun?',
  'Kaun se products slow chal rahe hain?',
  'Aaj ka profit kitna hai?',
]

export default function AssistantPage() {
  const { shop }    = useAuth()
  const { t, lang } = useLanguage()
  const [messages,  setMessages]  = useState(() => {
    const saved = localStorage.getItem('dukaanmate_chat_history')
    return saved ? JSON.parse(saved) : []
  })
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [activity,  setActivity]  = useState([]) // Agent activity log
  const bottomRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('dukaanmate_chat_history', JSON.stringify(messages))
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const question = text || input.trim()
    if (!question) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)
    setActivity([])

    try {
      const data = await api.post('/api/agent/chat', {
        question,
        shop_id: shop?.id,
        language: lang,
      })
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, cards: data.cards }])
      setActivity(data.agent_steps || [])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', content: err.message || t('error') }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper flex flex-col" style={{ height: '100dvh' }}>
      <div className="page-header">
        <h2 className="flex-1">🤖 {t('assistant')}</h2>
      </div>

      {/* Agent activity panel */}
      {activity.length > 0 && (
        <div className="mx-4 mt-3 card bg-purple-50 border-purple-100">
          <p className="text-xs font-semibold text-purple-700 mb-2">🔍 {t('agentActivity')}</p>
          {activity.map((step, i) => (
            <p key={i} className="text-xs text-purple-600 leading-relaxed">
              {i + 1}. {step}
            </p>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3 mt-4">
            <p className="text-center text-gray-500 text-sm">Kuch bhi poochho apni dukaan ke baare mein 👇</p>
            {EXAMPLE_QUESTIONS.map(q => (
              <button key={q} onClick={() => sendMessage(q)}
                className="card border-orange-200 text-left text-sm text-orange-700 hover:bg-orange-50 transition-colors">
                💬 {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="bg-orange-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%] text-sm">
                {msg.content}
              </div>
            ) : msg.role === 'error' ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-2 max-w-[85%] text-sm text-red-700">
                ⚠️ {msg.content}
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-w-[90%]">
                {/* Plain text answer */}
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
                  {msg.content}
                </div>
                {/* Structured answer cards */}
                {msg.cards && (
                  <div className="flex flex-col gap-2">
                    {msg.cards.what_to_do && (
                      <div className="card border-green-200 bg-green-50 text-sm">
                        <p className="font-semibold text-green-700 mb-1">✅ {t('whatToDo')}</p>
                        <p className="text-green-800">{msg.cards.what_to_do}</p>
                      </div>
                    )}
                    {msg.cards.when && (
                      <div className="card border-blue-200 bg-blue-50 text-sm">
                        <p className="font-semibold text-blue-700 mb-1">🕐 {t('when')}</p>
                        <p className="text-blue-800">{msg.cards.when}</p>
                      </div>
                    )}
                    {msg.cards.estimated_profit && (
                      <div className="card border-orange-200 bg-orange-50 text-sm">
                        <p className="font-semibold text-orange-700 mb-1">💰 {t('estimatedProfit')}</p>
                        <p className="text-orange-800">{msg.cards.estimated_profit}</p>
                      </div>
                    )}
                    {msg.cards.warning && (
                      <div className="card border-red-200 bg-red-50 text-sm">
                        <p className="font-semibold text-red-700 mb-1">⚠️ {t('warning')}</p>
                        <p className="text-red-800">{msg.cards.warning}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-500 flex gap-2 items-center">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce delay-100">●</span>
              <span className="animate-bounce delay-200">●</span>
              <span className="ml-1">{t('thinking')}</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-200 p-3 flex gap-2 bg-white">
        <input
          className="input flex-1 !min-h-[44px]"
          placeholder={t('typeQuestion')}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl px-4 font-semibold min-h-[44px] transition-colors"
        >
          {t('send')}
        </button>
      </div>
    </div>
  )
}

