import Link from 'next/link'
import { GitBranch, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="font-story text-8xl font-bold gradient-text mb-4">404</div>
        <h1 className="font-story text-2xl text-white mb-3">This branch doesn't exist</h1>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto">
          The page you're looking for may have been deleted, moved, or never existed in this branch of reality.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-primary">
            <Home className="w-4 h-4" />
            Go home
          </Link>
          <Link href="/explore" className="btn-secondary">
            <GitBranch className="w-4 h-4" />
            Explore stories
          </Link>
        </div>
      </div>
    </div>
  )
}
