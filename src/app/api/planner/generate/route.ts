import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { study_hours, exam_date, weak_subjects, subjects } = await req.json()
  const daysLeft = exam_date ? Math.ceil((new Date(exam_date).getTime() - Date.now()) / 86400000) : null

  const prompt = `Create a concise weekly study plan for a student with these details:
- Subjects: ${subjects || 'General'}
- Daily study hours available: ${study_hours}
- ${daysLeft ? `Days until exam: ${daysLeft}` : 'No specific exam'}
- Weak areas to focus on: ${weak_subjects || 'None specified'}

Format as a practical daily schedule (Monday–Sunday) with time slots, subject allocations, and revision periods. Include smart break allocation. Keep it actionable and specific.`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const plan = (message.content[0] as any).text
  return NextResponse.json({ plan })
}
