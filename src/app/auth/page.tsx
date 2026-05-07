'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GitBranch, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

function AuthPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isSignup = searchParams.get('mode') === 'signup'

  const [mode, setMode] = useState<'signin' | 'signup'>(isSignup ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [supabase] = useState(() => {
    try {
      return createClient()
    } catch (e: any) {
      console.error('Supabase init error:', e)
      return null
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!supabase) {
      setError('Supabase client failed to initialize. Check your environment variables (.env.local) and restart the dev server.')
      setLoading(false)
      return
    }

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, full_name: username } },
        })
        if (error) throw error
        setSuccess('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/explore')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/8 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-amber-500/6 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-violet-600 flex items-center justify-center shadow-lg">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <span className="font-story text-2xl font-bold gradient-text">StoryForge</span>
          </Link>
          <p className="text-slate-500 text-sm mt-3">
            {mode === 'signup' ? 'Create your account and start forking stories' : 'Welcome back, storyteller'}
          </p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-8 border border-white/15">
          {/* Tab switcher */}
          <div className="flex gap-1 mb-7 p-1 glass rounded-xl">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                id={`auth-tab-${m}`}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-amber-500 text-navy-900 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="username-input" className="block text-xs text-slate-400 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="username-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                    required
                    className="w-full pl-10 pr-4 py-3 glass rounded-xl border border-white/10 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email-input" className="block text-xs text-slate-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 glass rounded-xl border border-white/10 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="block text-xs text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-3 glass rounded-xl border border-white/10 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-4 py-3 text-emerald-400 text-sm">
                {success}
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm mt-2"
            >
              {loading ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6">
            By {mode === 'signup' ? 'signing up' : 'signing in'}, you agree to StoryForge's{' '}
            <span className="text-slate-400 cursor-pointer hover:text-amber-400 transition-colors">
              Contributor License Agreement
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-16 flex items-center justify-center text-slate-500">Loading…</div>}>
      <AuthPageInner />
    </Suspense>
  )
}
