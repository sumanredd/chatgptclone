const express = require('express')
const cors = require('cors')
const { nanoid } = require('nanoid')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

const DATA_PATH = path.join(__dirname, 'mock-data.json')

function readData() {
  if (!fs.existsSync(DATA_PATH)) {
    const base = { sessions: [], templates: {} }
    fs.writeFileSync(DATA_PATH, JSON.stringify(base, null, 2))
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'))
}

function writeData(js) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(js, null, 2))
}

function isGreeting(text) {
  if (!text) return false
  const t = text.toLowerCase().trim()
  return /^(hi|hello|hey|hlo|yo)([!. ]|$)/i.test(t)
}

function truncateTitle(t, n = 48) {
  if (!t) return ''
  const s = String(t).trim()
  return s.length > n ? s.slice(0, n - 3) + '...' : s
}

async function askGemini(question) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY missing in .env")
  const model = process.env.GEMINI_MODEL || "gemini-2.5-pro"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

  const payload = {
    contents: [{ parts: [{ text: question }] }],
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.4
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${txt}`)
  }

  const data = await res.json()

  let text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.content?.parts?.map(p => p.text).join(" ") ||
    data?.candidates?.[0]?.content?.text ||
    data?.text ||
    null

  if (!text) text = JSON.stringify(data, null, 2)
  return text
}

async function askGeminiWithRetry(question, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await askGemini(question)
    } catch (err) {
      const msg = String(err)
      const retryable =
        msg.includes("503") ||
        msg.includes("500") ||
        msg.includes("429")
      if (retryable && i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000))
        continue
      }
      throw err
    }
  }
}

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.post("/api/start", (req, res) => {
  const data = readData()
  const id = nanoid(8)
  const session = { id, title: "New Chat", history: [] }
  data.sessions.unshift(session)
  writeData(data)
  res.json({ sessionId: id, title: session.title })
})

app.post("/api/ask", async (req, res) => {
  try {
    const { sessionId, question } = req.body
    if (!question) return res.status(400).json({ error: "question required" })

    const data = readData()

    const session = data.sessions.find(s => s.id === sessionId)
    if (!session) return res.status(404).json({ error: "session not found" })

    
    const userEntry = {
      id: nanoid(8),
      role: "user",
      question
    }
    session.history.push(userEntry)


    let reply = ""
    if (isGreeting(question)) {
      reply = "Hello! How can I help you today?"
    } else {
      try {
        reply = await askGeminiWithRetry(question)
      } catch (e) {
        reply = `Gemini Error: ${e.message}`
      }
    }

  
    const answer = {
      id: nanoid(8),
      role: "assistant",
      response: reply,
      feedback: { likes: 0, dislikes: 0 }
    }

    
    const currentTitle = String(session.title || '').trim()
    if ((!currentTitle || currentTitle === 'New Chat') && !isGreeting(question)) {
      session.title = truncateTitle(question)
    }

    
    session.history.push(answer)

    writeData(data)
    res.json(answer)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get("/api/sessions", (req, res) => {
  const data = readData()
  res.json(data.sessions.map(s => ({ id: s.id, title: s.title })))
})

app.get("/api/session/:id", (req, res) => {
  const data = readData()
  const session = data.sessions.find(s => s.id === req.params.id)
  if (!session) return res.status(404).json({ error: "not found" })
  res.json(session)
})

app.post("/api/feedback", (req, res) => {
  const { sessionId, answerId, type } = req.body
  const data = readData()

  const session = data.sessions.find(s => s.id === sessionId)
  if (!session) return res.status(404).json({ error: "session not found" })

  const answer = session.history.find(h => h.id === answerId)
  if (!answer) return res.status(404).json({ error: "answer not found" })

  if (!answer.feedback) {
    answer.feedback = { likes: 0, dislikes: 0 }
  }

  if (type === "like") {
    answer.feedback.likes = answer.feedback.likes === 1 ? 0 : 1
    answer.feedback.dislikes = 0
  }

  if (type === "dislike") {
    answer.feedback.dislikes = answer.feedback.dislikes === 1 ? 0 : 1
    answer.feedback.likes = 0
  }

  writeData(data)

  res.json({
    feedback: answer.feedback
  })
})

app.delete("/api/session/:id", (req, res) => {
  const data = readData()
  const id = req.params.id
  const idx = data.sessions.findIndex(s => s.id === id)
  if (idx === -1) return res.status(404).json({ error: "session not found" })
  data.sessions.splice(idx, 1)
  writeData(data)
  res.json({ ok: true })
})

const buildPath = path.join(__dirname, 'frontend', 'build')
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath))
  app.get('*', (req, res) => {
    const index = path.join(buildPath, 'index.html')
    if (fs.existsSync(index)) return res.sendFile(index)
    res.status(404).send('Not found')
  })
}

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
