'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GitBranch, BookOpen, PenSquare, Search, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { href: '/explore', label: 'Explore', icon: Search },
    { href: '/write', label: 'Write', icon: PenSquare },
  ]

  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-violet-600 flex items-center justify-center shadow-lg group-hover:shadow-amber-500/30 transition-all duration-300">
                <GitBranch className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="font-story font-bold text-xl text-ink-900 group-hover:text-amber-600 transition-colors">
              StoryForge
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === href
                    ? 'bg-black/5 text-ink-900'
                    : 'text-ink-500 hover:text-ink-900 hover:bg-black/5'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="text-sm text-ink-500 mr-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-paper-200 border border-black/5 overflow-hidden flex items-center justify-center shadow-inner">
                    <span className="text-sm font-bold text-ink-700">{user.email?.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <button onClick={handleSignOut} className="btn-secondary text-sm py-2">
                  Sign Out
                </button>
                <Link href="/write" className="btn-primary text-sm py-2">
                  <BookOpen className="w-4 h-4" />
                  Write
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth" className="btn-secondary text-sm py-2">
                  Sign In
                </Link>
                <Link href="/auth?mode=signup" className="btn-primary text-sm py-2">
                  <BookOpen className="w-4 h-4" />
                  Start Writing
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-black/5 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-black/5 mt-0 pt-3">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-ink-600 hover:text-ink-900 hover:bg-black/5 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <div className="flex gap-2 pt-4 border-t border-black/5 mt-2">
              {user ? (
                <button onClick={handleSignOut} className="btn-secondary text-sm py-2 flex-1 justify-center">
                  Sign Out
                </button>
              ) : (
                <>
                  <Link href="/auth" className="btn-secondary text-sm py-2 flex-1 justify-center">
                    Sign In
                  </Link>
                  <Link href="/auth?mode=signup" className="btn-primary text-sm py-2 flex-1 justify-center">
                    Start Writing
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
