import React, { useEffect, useRef, useState, useContext } from 'react'
import TableAnswer from '../components/TableAnswer'
import { ThemeContext } from '../ThemeContext'

export default function ChatPanel({ sessionId }) {
  const { theme } = useContext(ThemeContext)

  useEffect(() => {
    try {
      if (theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    } catch (e) {}
  }, [theme])

  const [history, setHistory] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showNewBtn, setShowNewBtn] = useState(false)
  const messagesRef = useRef(null)

  const INPUT_HEIGHT = 96

  useEffect(() => {
    setError(null)
    if (!sessionId) {
      setHistory([])
      return
    }
    fetch(`http://localhost:4000/api/session/${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(json => {
        const normalized = (json.history || []).map(h => ({
          ...h,
          role: h.role ?? (h.response || h.answer || h.text ? 'assistant' : 'user')
        }))
        setHistory(normalized)
        setTimeout(() => scrollToBottom(true), 50)
      })
      .catch(() => {
        setHistory([])
        setError('Could not load session history (check backend).')
      })
  }, [sessionId])

  useEffect(() => {
    if (!messagesRef.current) return
    if (isAtBottom) {
      scrollToBottom(true)
      setShowNewBtn(false)
    } else {
      setShowNewBtn(true)
    }
  }, [history])

  function clearErrorLater() {
    setTimeout(() => setError(null), 4000)
  }

  function scrollToBottom(immediate = false) {
    const el = messagesRef.current
    if (!el) return
    const top = el.scrollHeight
    if (immediate) el.scrollTo({ top, behavior: 'auto' })
    else el.scrollTo({ top, behavior: 'smooth' })
    setShowNewBtn(false)
  }

  function handleScroll() {
    const el = messagesRef.current
    if (!el) return
    const threshold = 120
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    setIsAtBottom(atBottom)
    if (atBottom) setShowNewBtn(false)
  }

  function onSend() {
    setError(null)
    if (!sessionId) {
      setError('Start a session first (click New Chat).')
      clearErrorLater()
      return
    }
    const question = q.trim()
    if (!question) {
      setError('Please type a question before sending.')
      clearErrorLater()
      return
    }

    const userMsg = { id: `u-${Date.now()}`, role: 'user', question }
    setHistory(prev => [...prev, userMsg])
    setQ('')
    setLoading(true)

    fetch('http://localhost:4000/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, question })
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(answer => {
        const assistantText = answer?.response ?? answer?.answer ?? answer?.text ?? ''
        const assistantMsg = {
          id: answer?.id ?? `a-${Date.now()}`,
          role: 'assistant',
          response: assistantText,
          feedback: answer?.feedback ?? null
        }
        setHistory(prev => [...prev, assistantMsg])
      })
      .catch(() => {
        setError('Failed to send question. Check console / backend.')
        clearErrorLater()
      })
      .finally(() => setLoading(false))
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  function sendFeedback(answerId, type) {
    if (!sessionId) return
    fetch('http://localhost:4000/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, answerId, type })
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(r => {
        setHistory(prev => prev.map(h => (h.id === answerId ? { ...h, feedback: r.feedback } : h)))
      })
      .catch(() => {
        setError('Could not send feedback.')
        clearErrorLater()
      })
  }

  const cardBaseLight = 'bg-white border border-gray-200 text-black'
  const cardBaseDark = 'bg-gray-900 border border-gray-800 text-gray-100'

  return (
    <div
      className="relative flex-1 h-full"
      style={{ backgroundColor: theme === 'dark' ? '#000000' : '#ffffff' }}
    >
      {error && (
        <div
          className="mb-3 p-2 rounded z-50"
          style={{
            background: theme === 'dark' ? '#3b0b0b' : '#fee2e2',
            color: theme === 'dark' ? '#ffdede' : '#7f1d1d'
          }}
        >
          {error}
        </div>
      )}

      <div
        ref={messagesRef}
        onScroll={handleScroll}
        className="absolute left-0 right-0 top-0 overflow-y-auto scroll-smooth px-4 py-6"
        style={{
          bottom: `${INPUT_HEIGHT}px`,
          backgroundColor: theme === 'dark' ? '#000000' : '#ffffff'
        }}
      >
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
          {history.length === 0 && (
            <div className={theme === 'dark' ? 'text-gray-400 text-center' : 'text-gray-600 text-center'}>
              No messages yet. Start by sending a question.
            </div>
          )}

          {history.map(h => {
            const isUser = h.role === 'user'
            if (isUser) {
              return (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    className={`${theme === 'dark' ? cardBaseDark : cardBaseLight} p-3 rounded-xl inline-block break-words whitespace-pre-wrap max-w-[60%]`}
                  >
                    <div className={theme === 'dark' ? 'text-gray-100 text-right' : 'text-black text-right'}>
                      {h.question}
                    </div>
                  </div>
                </div>
              )
            } else {
              return (
                <div key={h.id} className={`${theme === 'dark' ? cardBaseDark : cardBaseLight} p-4 rounded-xl w-full break-words`}>
                  <div className="w-full">
                    <TableAnswer answer={h.response} />
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() => sendFeedback(h.id, 'like')}
                        className={theme === 'dark' ? 'text-gray-100' : 'text-black'}
                      >
                        👍 {h.feedback?.likes ?? 0}
                      </button>
                      <button
                        onClick={() => sendFeedback(h.id, 'dislike')}
                        className={theme === 'dark' ? 'text-gray-100' : 'text-black'}
                      >
                        👎 {h.feedback?.dislikes ?? 0}
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
          })}

          {loading && (
            <div
              className={`${theme === 'dark' ? cardBaseDark : cardBaseLight} p-4 rounded-xl w-full`}
            >
              <div className={theme === 'dark' ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>Typing...</div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed left-0 right-0 bottom-0 z-50 pointer-events-auto">
        <div className="flex justify-center">
          <div className="w-full max-w-3xl px-4 pb-4">
            <div className="flex justify-center">
              <div
                className={`mx-auto w-full sm:max-w-[80%] md:max-w-[70%] lg:max-w-2xl flex items-center border rounded-full px-4 py-3 transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-900 border-gray-800 shadow-sm'
                    : 'bg-white border-gray-300 shadow-md'
                }`}
                style={{ transform: 'translateY(-6px)' }}
              >
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onKeyDown={onKeyDown}
                  className={`flex-1 bg-transparent appearance-none outline-none py-1 rounded-full px-3 ${
                    theme === 'dark' ? 'text-gray-100 placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                  }`}
                  autoComplete="off"
                  placeholder={sessionId ? 'Ask a question...' : 'Start a session first'}
                />

                <button
                  onClick={onSend}
                  disabled={loading || !sessionId}
                  className={`ml-3 px-4 py-2 rounded-full font-medium transition-all ${
                    loading || !sessionId ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {loading ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNewBtn && (
        <div className="fixed right-6 bottom-28 z-50">
          <button onClick={() => scrollToBottom()} className="px-4 py-2 rounded-full shadow-lg" style={{ background: '#2563eb', color: '#fff' }}>
            New messages
          </button>
        </div>
      )}
    </div>
  )
}
