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

  // Detect mobile screen
  useEffect(() => {
    function checkScreen() {
      setIsMobile(window.innerWidth < 640)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  // Force expanded on desktop
  useEffect(() => {
    if (!isMobile && collapsed) setCollapsed(false)
  }, [isMobile, collapsed, setCollapsed])

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

  useEffect(() => {
    mountedRef.current = true
    return () => (mountedRef.current = false)
  }, [])

  useEffect(() => {
    if (!sessions || sessions.length === 0) return
    sessions.forEach(s => {
      const id = s.id || s.sessionId || s._id
      if (!id) return

      const current = s.title && s.title.trim() !== '' ? s.title : null
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
          const derived = json.title || titleFromSessionObject(json)
          if (!mountedRef.current) return

          setTitles(prev => ({ ...prev, [id]: derived }))
        } catch (err) {}
      })()
    })
  }, [sessions])

  function titleFromSessionObject(s) {
    if (s.title && s.title.trim() !== '') return s.title
    const hist = s.history || []
    for (let i = 0; i < hist.length; i++) {
      const q = hist[i].question || ''
      if (!isGreeting(q)) return truncateTitle(q)
    }
    return 'New Chat'
  }

  const panelBg =
    theme === 'dark'
      ? 'bg-black border-r border-gray-800 text-gray-100'
      : 'bg-white border-r text-black'

  const hoverBg = theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-100'

  // MOBILE COLLAPSED MODE
  if (isMobile && collapsed) {
    return (
      <div className={`transition-all w-12 h-screen flex flex-col items-center ${panelBg}`}>
        <div className="mt-3">
          <button
            onClick={onNew}
            title="New Chat"
            className="p-2 rounded bg-blue-500 text-white flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => setCollapsed(false)}
            className="p-2 rounded border border-gray-700 text-gray-100"
          >
            →
          </button>
        </div>
      </div>
    )
  }

  // FULL PANEL (Desktop always uses this)
  return (
    <div
      className={`transition-all ${isMobile ? 'w-56' : 'w-72'} h-screen flex flex-col ${panelBg}`}
    >
      <div className="p-2 flex items-center justify-between">
        <button onClick={onNew} className="px-3 py-2 bg-blue-500 text-white rounded">
          New Chat
        </button>

        {/* Collapse button ONLY on mobile */}
        {isMobile && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-2 rounded border border-gray-700 text-gray-100"
          >
            ←
          </button>
        )}
      </div>

      <div className="p-2 overflow-auto flex-1">
        {sessions.length === 0 && <div className="text-gray-500 text-sm">No sessions yet</div>}

        {sessions.map(s => {
          const id = s.id || s.sessionId || s._id
          const title = s.title || titles[id] || 'New Chat'

          return (
            <div
              key={id}
              className={`p-2 cursor-pointer ${hoverBg} rounded mb-1 flex justify-between items-center group`}
              onClick={() => onOpen(id)}
            >
              <span className="truncate flex-1">{title}</span>

              <button
                onClick={e => {
                  e.stopPropagation()
                  onDelete(id)
                }}
                className="text-red-500 opacity-0 group-hover:opacity-100"
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
