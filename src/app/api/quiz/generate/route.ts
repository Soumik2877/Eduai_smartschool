import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topic, difficulty, count } = await req.json()

  const prompt = `Generate ${count} multiple choice questions on "${topic}" at ${difficulty} difficulty level for Indian school students (CBSE/ICSE standard).

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}

The "correct" field is the 0-based index of the correct option.
Make questions progressively harder. Include application-based questions.`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (message.content[0] as any).text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse questions' }, { status: 500 })

  const parsed = JSON.parse(jsonMatch[0])
  return NextResponse.json(parsed)
}
