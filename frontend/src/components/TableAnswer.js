import React, { useContext } from 'react'
import { ThemeContext } from '../ThemeContext'

export default function TableAnswer({ answer }) {
  const { theme } = useContext(ThemeContext)
  if (!answer) return null

  if (typeof answer === 'string') {
    return <FormattedText text={answer} theme={theme} />
  }

  if (answer.type === 'text' && answer.text) {
    return <FormattedText text={answer.text} theme={theme} />
  }

  return (
    <pre className={`whitespace-pre-wrap break-words ${theme === 'dark' ? 'text-gray-100' : 'text-black'}`}>
      {JSON.stringify(answer, null, 2)}
    </pre>
  )
}

function FormattedText({ text, theme }) {
  if (!text) return null
  const blocks = parseBlocks(text)

  return (
    <div className={`leading-relaxed break-words whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
      {blocks.map((b, i) => render(b, theme, i))}
    </div>
  )
}

function parseBlocks(text) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const code = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i])
        i++
      }
      i++
      blocks.push({ type: 'code', content: code.join('\n') })
      continue
    }

    if (/^####\s+/.test(line)) {
      blocks.push({ type: 'h4', content: line.replace(/^####\s+/, '') })
      i++
      continue
    }

    if (/^###\s+/.test(line)) {
      blocks.push({ type: 'h3', content: line.replace(/^###\s+/, '') })
      i++
      continue
    }

    if (/^##\s+/.test(line)) {
      blocks.push({ type: 'h2', content: line.replace(/^##\s+/, '') })
      i++
      continue
    }

    if (/^#\s+/.test(line)) {
      blocks.push({ type: 'h1', content: line.replace(/^#\s+/, '') })
      i++
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      blocks.push({ type: 'li-num', content: line.replace(/^\d+\.\s/, '') })
      i++
      continue
    }

    if (/^[-*]\s/.test(line)) {
      blocks.push({ type: 'li', content: line.replace(/^[-*]\s/, '') })
      i++
      continue
    }

    blocks.push({ type: 'p', content: line })
    i++
  }

  return blocks
}

function render(block, theme, key) {
  const bold = text =>
    text.split(/(\*\*.*?\*\*)/g).map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : p
    )

  const base = theme === 'dark' ? 'text-gray-100' : 'text-gray-900'

  switch (block.type) {
    case 'h1':
      return <h1 key={key} className={`text-3xl font-bold my-3 ${base}`}>{bold(block.content)}</h1>
    case 'h2':
      return <h2 key={key} className={`text-xl font-bold my-2 ${base}`}>{bold(block.content)}</h2>
    case 'h3':
      return <h3 key={key} className={`text-lg font-semibold my-2 ${base}`}>{bold(block.content)}</h3>
    case 'h4':
      return <h4 key={key} className={`text-base font-semibold my-2 ${base}`}>{bold(block.content)}</h4>
    case 'li':
      return <li key={key} className={`ml-6 list-disc my-1 ${base}`}>{bold(block.content)}</li>
    case 'li-num':
      return <li key={key} className={`ml-6 list-decimal my-1 ${base}`}>{bold(block.content)}</li>
    case 'code':
      return (
        <pre key={key}
          className={`p-3 my-3 rounded overflow-auto text-sm ${theme === 'dark' ? 'bg-gray-800 text-green-200' : 'bg-gray-200 text-gray-900'}`}
        >{block.content}</pre>
      )
    case 'p':
      if (!block.content.trim()) return <div key={key} className="my-2" />
      return <p key={key} className={`my-2 ${base}`}>{bold(block.content)}</p>
    default:
      return null
  }
}
