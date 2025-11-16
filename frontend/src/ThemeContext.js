import React, { createContext, useEffect, useState } from 'react'

export const ThemeContext = createContext({
  theme: 'light',
  toggle: () => {}
})

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    if (theme === 'dark') {
      document.documentElement.style.background = '#000'
    } else {
      document.documentElement.style.background = ''
    }
  }, [theme])

  function toggle() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
