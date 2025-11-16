import React from 'react'
import ChatPage from './page/ChatPage'
import { ThemeProvider } from './ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen min-w-screen bg-black dark:bg-black text-gray-100 dark:text-gray-100">
        <ChatPage />
      </div>
    </ThemeProvider>
  )
}
