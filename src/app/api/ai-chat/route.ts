import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { messages, subject } = await req.json()

  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    console.error('NVIDIA_API_KEY environment variable is not defined')
    return new Response('NVIDIA API Key not configured', { status: 500 })
  }

  const systemPrompt = `You are an expert ${subject} tutor helping Indian students. 
Provide clear, step-by-step explanations. Use examples relevant to Indian curriculum (CBSE/ICSE/State boards).
For math/science: show all steps. For coding: explain with working code.
Be encouraging and patient. Respond in the same language the student uses.`

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemma-3n-e4b-it',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-20)
        ],
        max_tokens: 1024,
        temperature: 0.20,
        top_p: 0.70,
        stream: true
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('NVIDIA API error response:', errText)
      return new Response(`Error from NVIDIA API: ${errText}`, { status: response.status })
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Fetch error calling NVIDIA API:', error)
    return new Response(`Server error calling AI: ${error.message || error}`, { status: 500 })
  }
}
