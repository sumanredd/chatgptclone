import React, { useContext } from 'react'
import { ThemeContext } from '../ThemeContext'

export default function TableAnswer({ answer }) {
  const { theme } = useContext(ThemeContext)
  if (!answer) return null

  if (answer.type === 'table') {
    return (
      <div>
        <div className={`mb-2 text-sm font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-black'}`}>{answer.title}</div>
        <div className={`mb-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{answer.description}</div>
        <div className="overflow-auto rounded">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                {answer.columns.map((c, i) => (
                  <th key={i} className={`p-2 border ${theme === 'dark' ? 'dark:border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-gray-100 text-black'}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {answer.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={`p-2 border ${theme === 'dark' ? 'border-gray-800 text-gray-100' : 'border-gray-200 text-black'}`}>
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (answer.type === 'text' || typeof answer.text === 'string') {
    return <FormattedText text={answer.text} theme={theme} />
  }

  return <pre className={`text-xs ${theme === 'dark' ? 'text-gray-100' : 'text-black'}`}>{JSON.stringify(answer, null, 2)}</pre>
}

function FormattedText({ text, theme }) {
  if (!text) return null
  const blocks = splitIntoBlocks(text)
  return (
    <div className={`text-sm whitespace-pre-wrap leading-relaxed ${theme === 'dark' ? 'text-gray-100' : 'text-black'}`}>
      {blocks.map((block, i) => (
        <div key={i}>{renderBlock(block, theme)}</div>
      ))}
    </div>
  )
}

function splitIntoBlocks(text) {
  const lines = String(text).split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim()
      i++
      const codeLines = []
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      blocks.push({ type: 'code', lang, content: codeLines.join('\n') })
      continue
    }
    const h1 = line.match(/^#\s+(.*)$/)
    if (h1) {
      blocks.push({ type: 'h1', content: h1[1].trim() })
      i++
      continue
    }
    const h2 = line.match(/^##\s+(.*)$/)
    if (h2) {
      blocks.push({ type: 'h2', content: h2[1].trim() })
      i++
      continue
    }
    const h3 = line.match(/^###\s+(.*)$/)
    if (h3) {
      blocks.push({ type: 'h3', content: h3[1].trim() })
      i++
      continue
    }
    const h4 = line.match(/^####\s+(.*)$/)
    if (h4) {
      blocks.push({ type: 'h4', content: h4[1].trim() })
      i++
      continue
    }
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(lines[i].trim().slice(2))
        i++
      }
      blocks.push({ type: 'list', items })
      continue
    }
    const para = []
    while (i < lines.length && lines[i].trim() !== '') {
      para.push(lines[i])
      i++
    }
    if (para.length > 0) blocks.push({ type: 'p', content: para.join(' ') })
    i++
  }
  return blocks
}

function renderBlock(block, theme) {
  switch (block.type) {
    case 'h1':
      return <div className="text-3xl font-extrabold my-4">{block.content}</div>
    case 'h2':
      return <div className="text-2xl font-bold my-3">{block.content}</div>
    case 'h3':
      return <div className="text-xl font-semibold my-2">{block.content}</div>
    case 'h4':
      return <div className="text-lg font-semibold my-2">{block.content}</div>
    case 'list':
      return (
        <ul className="list-disc pl-5 my-2">
          {block.items.map((item, i) => <li key={i}>{renderInline(item, theme)}</li>)}
        </ul>
      )
    case 'code':
      return (
        <pre className={`my-3 p-3 rounded overflow-auto text-sm ${theme === 'dark' ? 'bg-gray-800 text-green-200' : 'bg-gray-100 text-gray-900'}`}>
          <code>{block.content}</code>
        </pre>
      )
    case 'p':
      return <p className="my-2">{renderInline(block.content, theme)}</p>
    default:
      return null
  }
}

function renderInline(text, theme) {
  const parts = []
  const boldRe = /\*\*(.*?)\*\*/
  const codeRe = /`([^`]+)`/
  let remaining = text
  while (remaining.length) {
    const boldMatch = remaining.match(boldRe)
    const codeMatch = remaining.match(codeRe)
    const matches = [boldMatch, codeMatch].filter(Boolean)
    if (matches.length === 0) {
      parts.push(remaining)
      break
    }
    const next = matches.sort((a, b) => a.index - b.index)[0]
    const before = remaining.slice(0, next.index)
    if (before) parts.push(before)
    if (next === boldMatch) {
      parts.push(<strong key={parts.length}>{next[1]}</strong>)
    } else if (next === codeMatch) {
      parts.push(<code key={parts.length} className={`px-1 rounded text-[0.85rem] ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>{next[1]}</code>)
    }
    remaining = remaining.slice(next.index + next[0].length)
  }
  return parts.map((p, i) => (typeof p === 'string' ? <span key={i}>{p}</span> : p))
}
