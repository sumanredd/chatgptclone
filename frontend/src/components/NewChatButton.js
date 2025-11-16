import React from 'react'
export default function NewChatButton({ onNew }) {
  return <button onClick={onNew} className="px-3 py-2 bg-blue-600 text-white rounded">New Chat</button>
}
