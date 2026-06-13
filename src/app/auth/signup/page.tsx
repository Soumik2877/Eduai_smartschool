'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/types/database.types'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ 
    full_name: '', 
    email: '', 
    password: '', 
    role: 'student' as Role,
    enrollment_no: '',
    teacher_id: '',
    child_enrollment_no: '',
    class_id: ''
  })
  const [classesList, setClassesList] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadClasses() {
      const { data } = await supabase.from('classes').select('id, name').order('name')
      if (data) setClassesList(data)
    }
    loadClasses()
  }, [])

  function update(k: string, v: string) { 
    setForm(p => ({ ...p, [k]: v })) 
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Package metadata payload
    const signUpOptions: any = {
      full_name: form.full_name,
      role: form.role,
    }

    if (form.role === 'student') {
      signUpOptions.enrollment_no = form.enrollment_no.trim()
      signUpOptions.class_id = form.class_id
    } else if (form.role === 'teacher') {
      signUpOptions.teacher_id = form.teacher_id.trim()
    } else if (form.role === 'parent') {
      signUpOptions.child_enrollment_no = form.child_enrollment_no.trim()
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: signUpOptions },
    })

    if (signUpError) { 
      setError(signUpError.message)
      setLoading(false) 
    } else {
      // Manually save fields to profiles if session is directly active
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const updateData: any = { role: form.role }
        if (form.role === 'student') {
          updateData.enrollment_no = form.enrollment_no.trim()
          updateData.class_id = form.class_id || null
        }
        if (form.role === 'teacher') updateData.teacher_id = form.teacher_id.trim()

        await (supabase.from('profiles') as any)
          .update(updateData)
          .eq('id', session.user.id)

        // If parent, associate child
        if (form.role === 'parent' && form.child_enrollment_no.trim()) {
          const { data: student } = await (supabase.from('profiles') as any)
            .select('id')
            .eq('enrollment_no', form.child_enrollment_no.trim())
            .single()

          if (student) {
            await (supabase.from('profiles') as any)
              .update({ parent_id: session.user.id })
              .eq('id', student.id)
          }
        }
      }
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/40 via-white to-purple-50/40 flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-[10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple-200/25 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up my-8">
        
        {/* LOGO */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group">
            <div className="w-9 h-9 bg-gradient-to-tr from-brand to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand/15 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-sm">E</span>
            </div>
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">EduAI</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Get started with AI-driven learning tools.</p>
        </div>

        {/* SIGNUP FORM glass-card */}
        <form onSubmit={handleSignup} className="glass-card p-8 space-y-4 shadow-xl">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-3 py-2 rounded-xl font-medium animate-in fade-in">
              {error}
            </div>
          )}
          
          <div>
            <label className="label">Full Name</label>
            <input 
              className="input mt-1.5" 
              value={form.full_name} 
              onChange={e => update('full_name', e.target.value)} 
              required 
              placeholder="Arjun Sharma" 
            />
          </div>
          
          <div>
            <label className="label">Email Address</label>
            <input 
              type="email" 
              className="input mt-1.5" 
              value={form.email} 
              onChange={e => update('email', e.target.value)} 
              required 
              placeholder="arjun@example.com"
            />
          </div>
          
          <div>
            <label className="label">Password</label>
            <input 
              type="password" 
              className="input mt-1.5" 
              value={form.password} 
              onChange={e => update('password', e.target.value)} 
              required 
              minLength={8} 
              placeholder="Min. 8 characters" 
            />
          </div>
          
          <div>
            <label className="label">I am a</label>
            <select 
              className="input mt-1.5 bg-white cursor-pointer font-medium text-gray-750" 
              value={form.role} 
              onChange={e => update('role', e.target.value)}
            >
              <option value="student">👨‍🎓 Student</option>
              <option value="teacher">👩‍🏫 Teacher</option>
              <option value="parent">👨‍👩‍👧 Parent</option>
            </select>
          </div>

          {/* Conditional Field: Enrollment Number & Class for Student */}
          {form.role === 'student' && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <label className="label">Student Enrollment Number</label>
                <input 
                  className="input mt-1.5" 
                  value={form.enrollment_no} 
                  onChange={e => update('enrollment_no', e.target.value)} 
                  required 
                  placeholder="e.g. STU1001" 
                />
              </div>
              <div>
                <label className="label">Select Class</label>
                <select
                  className="input mt-1.5 bg-white cursor-pointer font-medium text-gray-750"
                  value={form.class_id}
                  onChange={e => update('class_id', e.target.value)}
                  required
                >
                  <option value="">-- Choose Class --</option>
                  {classesList.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Conditional Field: Teacher ID for Teacher */}
          {form.role === 'teacher' && (
            <div className="animate-fade-in-up">
              <label className="label">Teacher ID</label>
              <input 
                className="input mt-1.5" 
                value={form.teacher_id} 
                onChange={e => update('teacher_id', e.target.value)} 
                required 
                placeholder="e.g. TCH202" 
              />
            </div>
          )}

          {/* Conditional Field: Child's Enrollment Number for Parent */}
          {form.role === 'parent' && (
            <div className="animate-fade-in-up">
              <label className="label">Child's Enrollment Number</label>
              <input 
                className="input mt-1.5" 
                value={form.child_enrollment_no} 
                onChange={e => update('child_enrollment_no', e.target.value)} 
                required 
                placeholder="e.g. STU1001" 
              />
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary w-full justify-center py-3 mt-3"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
          
          <p className="text-center text-xs text-gray-500 pt-1">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </form>

      </div>
    </div>
  )
}
