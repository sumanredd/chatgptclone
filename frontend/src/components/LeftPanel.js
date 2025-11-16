import React, { useContext } from 'react'
import { ThemeContext } from '../ThemeContext'

export default function LeftPanel({ sessions, collapsed, setCollapsed, onNew, onOpen, loading, onDelete }) {
  const { theme } = useContext(ThemeContext)
  return (
    <div className={`transition-all ${collapsed ? 'w-16' : 'w-72'} h-screen flex flex-col ${theme === 'dark' ? 'bg-black border-r border-gray-800 text-gray-100' : 'bg-white border-r text-black'}`}>
      <div className="p-3 flex items-center justify-between">
        <button onClick={onNew} className="px-3 py-2 bg-blue-500 text-white rounded">New Chat</button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`px-2 py-1 rounded border ${theme === 'dark' ? 'border-gray-700 text-gray-100' : 'border-gray-300 text-black'} md:hidden`}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <div className="p-3 overflow-auto flex-1">
        {loading && <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Loading...</div>}
        {sessions.length === 0 && !loading && <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>No sessions yet</div>}

        {sessions.map(s => {
          const id = s.id || s.sessionId || s._id
          return (
            <div
              key={id}
              className={`p-2 cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-100'} rounded mb-1 flex justify-between items-center group`}
            >
              <span onClick={() => onOpen(id)} className="flex-1 truncate">
                <span className={theme === 'dark' ? 'text-gray-100' : 'text-black'}>{s.title}</span>
              </span>

              {!collapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(id)
                  }}
                  className="text-red-500 opacity-0 group-hover:opacity-100 px-2 py-1"
                >
                  🗑️
                </button>
              )}

            </div>
          )
        })}

      </div>
    </div>
  )
}
