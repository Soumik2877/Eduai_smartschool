import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { interests, strengths, class: cls, stream } = await req.json()

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a career counselor for Indian students. Give personalized career guidance for:
- Class: ${cls}, Stream: ${stream}
- Interests: ${interests}
- Strengths: ${strengths}

Provide:
1. Top 3 recommended career paths (with reasons)
2. Key entrance exams to target (JEE, NEET, CLAT, etc.)
3. Skills to develop now
4. 2-year action plan
5. Colleges/institutions to aim for

Be specific to the Indian education system. Keep it practical and motivating.`,
    }],
  })

  return NextResponse.json({ guidance: (message.content[0] as any).text })
}
