'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message { id: string; role: 'user' | 'assistant'; content: string }

const SUBJECTS = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'English', 'Computer Science', 'Coding', 'General']

export default function DoubtSolverPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [subject, setSubject] = useState('General')
  const [loading, setLoading] = useState(false)
  const [voice, setVoice] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    loadHistory()
  }, [subject])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadHistory() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await (supabase.from('chat_messages') as any).select('*').eq('user_id', session.user.id).eq('subject', subject).order('created_at').limit(50)
    if (data) setMessages(data.map((m: any) => ({ id: m.id, role: m.role as any, content: m.content })))
  }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content: input }
    setMessages(p => [...p, userMsg])
    setInput('')
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await (supabase.from('chat_messages') as any).insert({ user_id: session.user.id, role: 'user', content: userMsg.content, subject })

    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })), subject }),
    })

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let aiContent = ''
    const aiId = crypto.randomUUID()
    setMessages(p => [...p, { id: aiId, role: 'assistant', content: '' }])

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content ?? ''
            aiContent += delta
            setMessages(p => p.map(m => m.id === aiId ? { ...m, content: aiContent } : m))
          } catch {}
        }
      }
    }

    await (supabase.from('chat_messages') as any).insert({ user_id: session.user.id, role: 'assistant', content: aiContent, subject })
    setLoading(false)
  }

  function startVoice() {
    if (!('webkitSpeechRecognition' in window)) { alert('Voice not supported in this browser'); return }
    const SpeechRecognition = (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.onresult = (e: any) => { setInput(e.results[0][0].transcript); setVoice(false) }
    recognition.onend = () => setVoice(false)
    recognitionRef.current = recognition
    recognition.start()
    setVoice(true)
  }

  function speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text)
    speechSynthesis.speak(utterance)
  }

  return (
    <div className="max-w-3xl h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">AI Tutor</h1>
        <select className="input w-auto text-sm" value={subject} onChange={e => setSubject(e.target.value)}>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card flex-1 overflow-y-auto p-4 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center text-gray-400">
            <div>
              <div className="text-4xl mb-3">🤖</div>
              <p className="font-medium">Ask me anything about {subject}</p>
              <p className="text-sm mt-1">I can explain concepts, solve problems, debug code, and more</p>
            </div>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === 'user' ? 'bg-brand text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
              {m.role === 'assistant' ? (
                <div>
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed">{m.content}</pre>
                  {m.content && (
                    <button onClick={() => speak(m.content)} className="mt-2 text-xs text-gray-500 hover:text-brand">🔊 Listen</button>
                  )}
                </div>
              ) : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Ask a ${subject} question…`}
          disabled={loading}
        />
        <button type="button" onClick={startVoice} className={`btn-secondary px-3 ${voice ? 'bg-red-100 text-red-600' : ''}`} title="Voice input">🎤</button>
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4">Send</button>
      </form>
    </div>
  )
}
