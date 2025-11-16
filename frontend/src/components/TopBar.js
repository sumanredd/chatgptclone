import React, { useContext } from 'react'
import { ThemeContext } from '../ThemeContext'

export default function TopBar() {
  const { theme, toggle } = useContext(ThemeContext)
  return (
    <div className={`p-3 flex items-center justify-between border-b ${theme === 'dark' ? 'border-gray-800 bg-black text-gray-100' : 'border-gray-200 bg-white text-black'}`}>
      <div>
        <h1 className="text-lg font-semibold">Mock Chat</h1>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={toggle} className={`px-3 py-1 rounded border ${theme === 'dark' ? 'border-gray-700 text-gray-100' : 'border-gray-300 text-black'}`}>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
    </div>
  )
}
