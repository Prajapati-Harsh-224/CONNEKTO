import { useEffect, useRef, useState } from 'react'
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

    const userMessage = { id: crypto.randomUUID(), role: 'user', text: trimmed, timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setIsSending(true)

    try {
      const reply = getAssistantReply(trimmed)
      const assistantMessage = { id: crypto.randomUUID(), role: 'assistant', text: reply, timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }
      setMessages((current) => [...current, assistantMessage])
    } catch (error) {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', text: t('assistantFallbackMessage'), timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="assistant-page">
      <div className="assistant-header">
        <div>
          <div className="eyebrow">{t('shopOwnerWorkspace')}</div>
          <h1>{t('connectoAssistant')}</h1>
        </div>
        <span className="demo-label">{t('prototypeData')}</span>
      </div>

      <p className="assistant-intro">{t('connectoAssistantDescription')}</p>

      {messages.length === 0 ? (
        <div className="assistant-empty-state">
          <div className="empty-state-mark" aria-hidden="true">✦</div>
          <strong>{t('assistantEmptyTitle')}</strong>
          <span>{t('assistantEmptyMessage')}</span>
          <div className="suggested-questions">
            {assistantSuggestedQuestions.map((question) => (
              <button className="suggestion-chip" key={question} onClick={() => handleSubmit(question)} type="button" disabled={isSending}>
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat-panel" aria-live="polite">
          {messages.map((message) => (
            <div className={`chat-message ${message.role}`} key={message.id}>
              <div className="chat-bubble">
                <p>{message.text}</p>
                <small>{message.timestamp}</small>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="chat-message assistant loading-message">
              <div className="chat-bubble">
                <span className="loading-spinner" aria-hidden="true" />
                <span>{t('assistantLoading')}</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      )}

      <div className="assistant-composer">
        <label className="sr-only" htmlFor="assistant-input">{t('assistantInputPlaceholder')}</label>
        <input
          id="assistant-input"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleSubmit()
            }
          }}
          placeholder={t('assistantInputPlaceholder')}
          type="text"
          value={input}
        />
        <button className="button primary" disabled={!input.trim() || isSending} onClick={() => handleSubmit()} type="button">
          {isSending ? t('assistantSending') : t('send')}
        </button>
      </div>
    </section>
  )
}
