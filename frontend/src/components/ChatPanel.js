import React, { useEffect, useRef, useState, useContext } from 'react'
import TableAnswer from './TableAnswer'
import { ThemeContext } from '../ThemeContext'

export default function ChatPanel({ sessionId, onTitleUpdate, onSessionUpdate }) {
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
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000'

  useEffect(() => {
    setError(null)
    if (!sessionId) {
      setHistory([])
      return
    }
    fetch(`${API_BASE}/api/session/${sessionId}`)
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

    fetch(`${API_BASE}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, question })
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        const assistantMsg = {
          id: data.id ?? `a-${Date.now()}`,
          role: 'assistant',
          question: data.question,
          response: data.response,
          feedback: data.feedback ?? { likes: 0, dislikes: 0 }
        }
        setHistory(prev => [...prev, assistantMsg])
        setQ('')

     
        const cleanTitle = stripMarkdown(data.sessionTitle ?? data.question ?? '')
        if (cleanTitle && onTitleUpdate && sessionId) {
          onTitleUpdate(sessionId, cleanTitle)
        }

        
        if (onSessionUpdate) onSessionUpdate()
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
    fetch(`${API_BASE}/api/feedback`, {
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

  function stripMarkdown(s = '') {
    return s
      .replace(/^#+\s+/gm, '')           
      .replace(/\*\*(.*?)\*\*/g, '$1')    
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')        
      .replace(/_(.*?)_/g, '$1')
      .replace(/`(.*?)`/g, '$1')         
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') 
      .trim()
  }

  const cardUser = theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white' : 'bg-green-600 text-white'
  const cardAssistant = theme === 'dark' ? 'bg-gray-900 text-gray-100 border border-gray-800' : 'bg-gray-100 text-black border border-gray-200'

  return (
    <div className="relative flex-1 h-full font-sans" style={{ backgroundColor: theme === 'dark' ? '#0b0b0b' : '#f5f7fb' }}>
      {error && (
        <div className="mb-3 p-2 rounded z-50 mx-auto max-w-3xl text-center" style={{ background: theme === 'dark' ? '#3b0b0b' : '#fee2e2', color: theme === 'dark' ? '#ffdede' : '#7f1d1d' }}>
          {error}
        </div>
      )}

      <div ref={messagesRef} onScroll={handleScroll} className="absolute left-0 right-0 top-0 overflow-y-auto px-4 py-6" style={{ bottom: `${INPUT_HEIGHT}px` }}>
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          <div className={`pt-2 pb-4 border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Chat</div>
          </div>

          {history.length === 0 && (
            <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No messages yet. Start by sending a question.</div>
          )}

          {history.map(h => {
            const isUser = h.role === 'user'
         
            if (isUser) {
              return (
                <div key={h.id} className="flex justify-end mb-4">
                  <div className={`rounded-2xl px-4 py-2 max-w-[72%]`} style={{ background: theme === 'dark' ? '#0f1724' : '#10b981', color: theme === 'dark' ? '#e6edf3' : '#ffffff' }}>
                    <div className="text-sm break-words whitespace-pre-wrap" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{h.question}</div>
                  </div>
                </div>
              )
            }

  
            return (
              <div key={h.id} className="mb-4">
                {h.question && (
                  <div className="flex justify-end mb-2">
                    <div className={`rounded-2xl px-4 py-2 max-w-[72%]`} style={{ background: theme === 'dark' ? '#0f1724' : '#10b981', color: theme === 'dark' ? '#e6edf3' : '#ffffff' }}>
                      <div className="text-sm break-words whitespace-pre-wrap" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{h.question}</div>
                    </div>
                  </div>
                )}

                <div className="flex justify-start">
                  <div className={`rounded-2xl p-4 max-w-[72%] ${theme === 'dark' ? 'bg-gray-900 border border-gray-800 text-gray-100' : 'bg-gray-100 border border-gray-200 text-black'}`} style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    <TableAnswer answer={h.response} />
                    <div className="mt-3 flex items-center gap-3">
                      <button onClick={() => sendFeedback(h.id, 'like')} className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}>👍 {h.feedback?.likes ?? 0}</button>
                      <button onClick={() => sendFeedback(h.id, 'dislike')} className={`text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}>👎 {h.feedback?.dislikes ?? 0}</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="flex justify-start">
              <div className={`rounded-2xl p-4 break-words max-w-[72%] ${cardAssistant}`}><div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Typing...</div></div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed left-0 right-0 bottom-0 z-50 pointer-events-auto">
        <div className="flex justify-center">
          <div className="w-full max-w-3xl px-4 pb-6">
            <div className={`mx-auto w-full flex items-center border rounded-full px-4 py-3 transition-all ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} style={{ transform: 'translateY(-6px)' }}>
              <textarea value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKeyDown} rows={1} className={`flex-1 bg-transparent resize-none outline-none rounded-full px-3 py-1 ${theme === 'dark' ? 'text-gray-100 placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`} placeholder={sessionId ? 'Ask a question...' : 'Start a session first'} />
              <button onClick={onSend} disabled={loading || !sessionId} className={`ml-3 px-4 py-2 rounded-full font-medium ${loading || !sessionId ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>{loading ? '...' : 'Send'}</button>
            </div>
          </div>
        </div>
      </div>

      {/* {showNewBtn && (
        <div className="fixed right-6 bottom-28 z-50">
          <button onClick={() => scrollToBottom()} className="px-4 py-2 rounded-full shadow-lg" style={{ background: '#2563eb', color: '#fff' }}>New messages</button>
        </div>
      )} */}
    </div>
  )
}
