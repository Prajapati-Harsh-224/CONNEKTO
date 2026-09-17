import { useEffect, useRef, useState } from 'react'
import { FiSend, FiSparkles } from 'react-icons/fi'
import { useLocale } from '../context/LocaleContext.jsx'
import { assistantSuggestedQuestions, getAssistantReply } from '../services/assistantService.js'

const starterMessages = []

export default function ShopOwnerAssistantPage() {
  const { t } = useLocale()
  const [messages, setMessages] = useState(starterMessages)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  async function handleSubmit(nextQuestion) {
    const trimmed = (nextQuestion ?? input).trim()
    if (!trimmed || isSending) return

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setIsSending(true)

    try {
      const reply = getAssistantReply(trimmed)
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      }
      setMessages((current) => [...current, assistantMessage])
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: t('assistantFallbackMessage'),
          timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        }
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="flex flex-col h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-10rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-orange mb-0.5">{t('shopOwnerWorkspace')}</div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FiSparkles className="w-6 h-6 text-brand-orange" />
            {t('connectoAssistant')}
          </h1>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded-full border border-slate-200">
          {t('prototypeData')}
        </span>
      </div>

      <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-4">{t('connectoAssistantDescription')}</p>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-brand-orange flex items-center justify-center text-xl font-bold mb-3 shadow-xs">
              ✦
            </div>
            <strong className="text-base font-bold text-slate-800 mb-1">{t('assistantEmptyTitle')}</strong>
            <span className="text-xs sm:text-sm text-slate-500 max-w-md mb-6">{t('assistantEmptyMessage')}</span>

            <div className="flex flex-wrap justify-center gap-2 max-w-xl">
              {assistantSuggestedQuestions.map((question) => (
                <button
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-orange-50 hover:text-brand-orange hover:border-brand-orange/40 border border-slate-200 rounded-xl shadow-xs transition-all text-left"
                  disabled={isSending}
                  key={question}
                  onClick={() => handleSubmit(question)}
                  type="button"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4" aria-live="polite">
            {messages.map((message) => {
              const isUser = message.role === 'user'
              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm shadow-xs ${
                      isUser
                        ? 'bg-brand-orange text-white rounded-br-xs'
                        : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    <small className={`block text-[10px] mt-1.5 ${isUser ? 'text-orange-100 text-right' : 'text-slate-400'}`}>
                      {message.timestamp}
                    </small>
                  </div>
                </div>
              )
            })}

            {isSending && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-4 text-sm text-slate-500 flex items-center gap-2.5 shadow-xs">
                  <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                  <span>{t('assistantLoading')}</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="pt-4 border-t border-slate-200 mt-2">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <label className="sr-only" htmlFor="assistant-input">{t('assistantInputPlaceholder')}</label>
          <input
            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange shadow-xs transition-all"
            id="assistant-input"
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('assistantInputPlaceholder')}
            type="text"
            value={input}
          />
          <button
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-brand-orange text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-xs shrink-0"
            disabled={!input.trim() || isSending}
            type="submit"
          >
            <span>{isSending ? t('assistantSending') : t('send')}</span>
            <FiSend className="w-4 h-4" />
          </button>
        </form>
      </div>
    </section>
  )
}
