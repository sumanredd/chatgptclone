import React, { useContext, useEffect, useState, useRef } from 'react'
import { ThemeContext } from '../ThemeContext'

export default function LeftPanel({
  sessions,
  collapsed,
  setCollapsed,
  onNew,
  onOpen,
  loading,
  onDelete
}) {
  const { theme } = useContext(ThemeContext)
  const [isMobile, setIsMobile] = useState(false)
  const [titles, setTitles] = useState({})
  const mountedRef = useRef(true)

  const API_BASE = 'https://chatgptclone-2-vq73.onrender.com'

  useEffect(() => {
    function checkScreen() {
      setIsMobile(window.innerWidth < 640)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  function isGreeting(text) {
    if (!text) return false
    const t = text.toLowerCase().trim()
    return /^(hi|hello|hey|hlo|yo)([!. ]|$)/i.test(t)
  }

  function truncateTitle(t, n = 48) {
    if (!t) return 'New Chat'
    const s = String(t).trim()
    return s.length > n ? s.slice(0, n - 3) + '...' : s
  }

  function titleFromSessionObject(s) {
    if (s.title && s.title !== 'New Chat' && String(s.title).trim() !== '') return s.title
    const hist = s.history || []
    for (let i = 0; i < hist.length; i++) {
      const h = hist[i]
      const q = h.question || (h.request && h.request.question) || ''
      if (!q) continue
      if (!isGreeting(q)) {
        const t = String(q).trim()
        return truncateTitle(t)
      }
    }
    return 'New Chat'
  }

  useEffect(() => {
    if (!sessions || sessions.length === 0) return
    sessions.forEach(s => {
      const id = s.id || s.sessionId || s._id
      if (!id) return
      const current = s.title && s.title !== 'New Chat' && String(s.title).trim() !== '' ? s.title : null
      if (titles[id]) return
      if (current) {
        setTitles(prev => ({ ...prev, [id]: current }))
        return
      }

      ;(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/session/${id}`)
          if (!res.ok) return
          const json = await res.json()
          const derived = titleFromSessionObject(json)
          if (!mountedRef.current) return
          setTitles(prev => {
            if (prev[id] === derived) return prev
            return { ...prev, [id]: derived }
          })
        } catch (e) {
          // ignore
        }
      })()
    })
  }, [sessions])

  function badgeText(title) {
    if (!title) return 'N'
    const parts = title.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + (parts[1][0] || '')).toUpperCase()
  }

  const panelBg = theme === 'dark' ? 'bg-black border-r border-gray-800 text-gray-100' : 'bg-white border-r text-black'
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-100'

  const collapsedWidthDesktop = 'w-16'
  const collapsedWidthMobile = 'w-12'
  const expandedWidthDesktop = 'w-72'
  const expandedWidthMobile = 'w-56'

  const collapsedWidth = isMobile ? collapsedWidthMobile : collapsedWidthDesktop
  const expandedWidth = isMobile ? expandedWidthMobile : expandedWidthDesktop

  if (collapsed) {
    return (
      <div className={`transition-all ${collapsedWidth} h-screen flex flex-col items-center ${panelBg} overflow-hidden`}>
        <div className="mt-3">
          <button onClick={onNew} title="New Chat" className="p-2 rounded bg-blue-500 text-white flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => setCollapsed(false)}
            className={`p-2 rounded border ${theme === 'dark' ? 'border-gray-700 text-gray-100' : 'border-gray-300 text-black'}`}
            aria-label="Expand"
          >
            →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`transition-all ${expandedWidth} h-screen flex flex-col ${panelBg}`}>
      <div className="p-2 flex items-center justify-between">
        <button onClick={onNew} className="px-3 py-2 bg-blue-500 text-white rounded">New Chat</button>

        <button
          onClick={() => setCollapsed(true)}
          className={`p-2 rounded border ${theme === 'dark' ? 'border-gray-700 text-gray-100' : 'border-gray-300 text-black'}`}
          aria-label="Collapse"
        >
          ←
        </button>
      </div>

      <div className="p-2 overflow-auto flex-1">
        {loading && <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Loading...</div>}
        {sessions.length === 0 && !loading && <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>No sessions yet</div>}

        {sessions.map(s => {
          const id = s.id || s.sessionId || s._id
          const rawTitle = s.title && s.title !== 'New Chat' && String(s.title).trim() !== '' ? s.title : null
          const displayTitle = rawTitle || titles[id] || 'New Chat'

          return (
            <div
              key={id}
              className={`p-2 cursor-pointer ${hoverBg} rounded mb-1 flex justify-between items-center group`}
              onClick={() => onOpen(id)}
            >
              <span className="flex-1 truncate" title={displayTitle}>
                <span className={theme === 'dark' ? 'text-gray-100' : 'text-black'}>{displayTitle}</span>
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(id)
                }}
                className="text-red-500 opacity-0 group-hover:opacity-100 px-2 py-1"
              >
                🗑️
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
