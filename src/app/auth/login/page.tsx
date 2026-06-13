'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Fingerprint, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<'id' | 'email'>('id')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let email = identifier.trim()

      // If logging in with ID or the identifier doesn't look like an email, lookup the registered email by enrollment number / teacher ID
      if (loginMethod === 'id' && !email.includes('@')) {
        const res = await fetch('/api/auth/login-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: email }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to lookup credentials.')
          setLoading(false)
          return
        }
        email = data.email
      }

      // Log in with email and password
      const supabase = createClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })

      if (loginError) { 
        setError(loginError.message)
        setLoading(false) 
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/40 via-white to-purple-50/40 flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-[10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple-200/25 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        
        {/* LOGO */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group">
            <div className="w-9 h-9 bg-gradient-to-tr from-brand to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand/15 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-sm">E</span>
            </div>
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">EduAI</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue your personalized study path.</p>
        </div>

        {/* GLASS CARD */}
        <div className="glass-card p-8 shadow-xl">
          
          {/* Toggle Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('id')
                setIdentifier('')
                setError('')
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                loginMethod === 'id'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/20'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Fingerprint className="w-4 h-4" />
              School ID
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('email')
                setIdentifier('')
                setError('')
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                loginMethod === 'email'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/20'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Address
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl font-semibold animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
            
            <div>
              <label className="label flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide">
                {loginMethod === 'id' ? (
                  <>
                    <Fingerprint className="w-4 h-4 text-indigo-600" />
                    Enrollment No / Teacher ID
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-indigo-600" />
                    Email Address
                  </>
                )}
              </label>
              <input 
                type={loginMethod === 'id' ? 'text' : 'email'} 
                className="input mt-2" 
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                required 
                placeholder={
                  loginMethod === 'id'
                    ? 'e.g. STU1001 or TCH202'
                    : 'e.g. name@example.com'
                } 
              />
            </div>
            
            <div>
              <label className="label flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide">
                <Lock className="w-4 h-4 text-indigo-600" />
                Password
              </label>
              <input 
                type="password" 
                className="input mt-2" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full justify-center py-3 mt-3 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
            
            <p className="text-center text-xs text-gray-500 pt-2 border-t border-slate-100">
              No account?{' '}
              <Link href="/auth/signup" className="text-indigo-600 font-extrabold hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  )
}
