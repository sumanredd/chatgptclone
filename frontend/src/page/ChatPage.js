import React, { useEffect, useState, useContext } from 'react'
import LeftPanel from '../components/LeftPanel'
import TopBar from '../components/TopBar'
import ChatPanel from '../components/ChatPanel'
import { useParams, useNavigate } from 'react-router-dom'
import { ThemeContext } from '../ThemeContext'

export default function ChatPage() {
  const { theme } = useContext(ThemeContext)
  const [sessions, setSessions] = useState([])
  const [collapsed, setCollapsed] = useState(false)
  const params = useParams()
  const navigate = useNavigate()
  const [activeSession, setActiveSession] = useState(null)
  const [loadingSessions, setLoadingSessions] = useState(false)
  // const API_BASE = 'https://chatgptclone-2-vq73.onrender.com'
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000'
  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    setLoadingSessions(true)
    try {
      const res = await fetch(`${API_BASE}/api/sessions`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const list = json || []
      setSessions(list)
      if (params.sessionId) {
        setActiveSession(params.sessionId)
      } else if (list.length > 0) {
        const firstId = list[0].id || list[0].sessionId || list[0]._id
        if (firstId) {
          setActiveSession(firstId)
          navigate(`/chat/${firstId}`, { replace: true })
        }
      } else {
        setActiveSession(null)
        navigate('/', { replace: true })
      }
    } catch (e) {
      setSessions([])
      console.error('fetchSessions error', e)
    } finally {
      setLoadingSessions(false)
    }
  }

  async function deleteSession(id) {
    try {
      const remaining = sessions.filter(s => {
        const sid = s.id || s.sessionId || s._id
        return sid !== id
      })
      setSessions(remaining)
      if (activeSession === id) {
        if (remaining.length > 0) {
          const newId = remaining[0].id || remaining[0].sessionId || remaining[0]._id
          setActiveSession(newId)
          navigate(`/chat/${newId}`, { replace: true })
        } else {
          setActiveSession(null)
          navigate('/', { replace: true })
        }
      }
      const res = await fetch(`${API_BASE}/api/session/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        console.error('delete failed on server', await res.text().catch(() => ''))
        await fetchSessions()
      }
    } catch (e) {
      console.error('deleteSession error', e)
      await fetchSessions()
    }
  }

  async function startNewChat() {
    try {
      const res = await fetch(`${API_BASE}/api/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Session ${Date.now()}` })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      const id = j.sessionId || j.id || j._id
      await fetchSessions()
      if (id) {
        navigate(`/chat/${id}`)
        setActiveSession(id)
      }
    } catch (e) {
      console.error('startNewChat error', e)
    }
  }

  useEffect(() => {
    if (params.sessionId) setActiveSession(params.sessionId)
  }, [params.sessionId])

  function handleOpen(id) {
    navigate(`/chat/${id}`)
    setActiveSession(id)
  }

  function handleTitleUpdate(sessionId, newTitle) {
    setSessions(prev => 
      prev.map(s => 
        s.id === sessionId 
          ? { ...s, title: newTitle } 
          : s
      )
    )
  }

  function handleSessionUpdate() {
    fetchSessions() 
  }

  const pageBg = theme === 'dark' ? '#000000' : '#ffffff'
  const pageTextTitle = theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
  const pageTextSub = theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
  const newBtnBg = 'bg-indigo-600 text-white'

  return (
    <div className="flex h-screen min-h-screen" style={{ backgroundColor: pageBg }}>
      <div className="flex-shrink-0 h-full">
        <LeftPanel
          sessions={sessions}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onNew={startNewChat}
          onOpen={handleOpen}
          loading={loadingSessions}
          onDelete={deleteSession}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <TopBar />
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeSession ? (
            <div className="h-full min-h-0">
              <ChatPanel 
                sessionId={activeSession} 
                onTitleUpdate={handleTitleUpdate}
                onSessionUpdate={handleSessionUpdate}
              />
            </div>
          ) : (
            <div className="h-full min-h-0 flex items-center justify-center p-6">
              <div className="max-w-lg text-center">
                <div className={`text-2xl font-semibold mb-2 ${pageTextTitle}`}>No chat selected</div>
                <div className={`text-sm mb-4 ${pageTextSub}`}>Click New Chat or select a conversation from the left to start.</div>
                <button onClick={startNewChat} className={`px-4 py-2 rounded-md ${newBtnBg}`}>New Chat</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
