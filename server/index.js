/**
 * Academic Analyzer — AI proxy backend
 *
 * A minimal, zero-dependency Node server that keeps the Hack Club AI key
 * server-side. The React Native client never sees the key; it only sends
 * structured academic data and receives structured AI output.
 *
 * Run:  HACK_CLUB_AI_KEY=... node server/index.js
 *       (or put the key in server/.env)
 *
 * Endpoints:
 *   GET  /health
 *   POST /api/ai        { system, user, json?: true, model? }
 *   POST /api/ai/chat   { messages: [...], model? }
 */
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

// ---- config ----
const PORT = process.env.PORT || 8787
const HACK_CLUB_AI_URL = 'https://ai.hackclub.com/proxy/v1/chat/completions'
const DEFAULT_MODEL = 'qwen/qwen3-32b'

let API_KEY = process.env.HACK_CLUB_AI_KEY || ''
if (!API_KEY) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
    const m = envFile.match(/^HACK_CLUB_AI_KEY\s*=\s*(.+)$/m)
    if (m) API_KEY = m[1].trim().replace(/^["']|["']$/g, '')
  } catch {
    /* no .env file */
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', ...CORS_HEADERS })
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

async function callHackClubAI(messages, model) {
  if (!API_KEY) {
    throw new Error('HACK_CLUB_AI_KEY is not configured on the server')
  }
  const res = await fetch(HACK_CLUB_AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 3000,
    }),
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Hack Club AI error ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('Hack Club AI returned an empty response')
  return content
}

function extractJSON(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in response')
  return JSON.parse(candidate.slice(start, end + 1))
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'GET' && url.pathname === '/health') {
    json(res, 200, { ok: true, ai: !!API_KEY, model: DEFAULT_MODEL })
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/ai') {
    try {
      const body = await readBody(req)
      const { system, user, json: wantJson, model } = body
      if (!user) return json(res, 400, { error: 'Missing "user" prompt' })
      const messages = [
        { role: 'system', content: system || 'You are a helpful academic assistant for a school.' },
        { role: 'user', content: user },
      ]
      const content = await callHackClubAI(messages, model)
      if (wantJson) {
        const parsed = extractJSON(content)
        json(res, 200, { ok: true, json: parsed, raw: content })
      } else {
        json(res, 200, { ok: true, text: content })
      }
    } catch (e) {
      json(res, 500, { ok: false, error: e.message })
    }
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/ai/chat') {
    try {
      const body = await readBody(req)
      const { messages, model } = body
      if (!Array.isArray(messages) || !messages.length) return json(res, 400, { error: 'Missing messages' })
      const content = await callHackClubAI(messages, model)
      json(res, 200, { ok: true, text: content })
    } catch (e) {
      json(res, 500, { ok: false, error: e.message })
    }
    return
  }

  json(res, 404, { error: 'Not found' })
})

server.listen(PORT, () => {
  console.log(`Academic Analyzer AI proxy listening on http://0.0.0.0:${PORT}`)
  console.log(API_KEY ? 'Hack Club AI: connected (key configured)' : 'Hack Club AI: NO API KEY — set HACK_CLUB_AI_KEY or server/.env')
})