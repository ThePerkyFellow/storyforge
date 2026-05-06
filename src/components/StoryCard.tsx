import Link from 'next/link'
import { GitBranch, BookOpen, Eye, User } from 'lucide-react'
import { cn, formatReadCount, GENRE_COLORS } from '@/lib/utils'
import type { Story } from '@/lib/types'

interface StoryCardProps {
  story: Story
  className?: string
}

export function StoryCard({ story, className }: StoryCardProps) {
  const genreColors = story.genre ? GENRE_COLORS[story.genre] : null
  const branchCount = story.branches?.length || 0
  const canonBranch = story.branches?.find((b) => b.is_canon)

  return (
    <Link
      href={`/story/${story.id}`}
      className={cn('block glass rounded-2xl p-6 border border-white/10 card-hover group', className)}
      id={`story-card-${story.id}`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          {story.genre && genreColors && (
            <span className={cn('tag mb-3', genreColors.bg, genreColors.text, 'border-transparent')}>
              {story.genre}
            </span>
          )}
          <h3 className="font-story text-xl font-bold text-white leading-tight group-hover:text-amber-300 transition-colors truncate">
            {story.title}
          </h3>
        </div>
        {/* Branch count badge */}
        {branchCount > 1 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-medium flex-shrink-0">
            <GitBranch className="w-3 h-3" />
            {branchCount} branches
          </div>
        )}
      </div>

      {story.description && (
        <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
          {story.description}
        </p>
      )}

      {/* Tags */}
      {story.tags && story.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {story.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 text-slate-500 text-xs border border-white/8">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-violet-600 flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>
          <span className="text-slate-400 text-xs">
            @{story.author?.username || 'unknown'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-500 text-xs">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatReadCount(story.total_reads)}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {story.total_forks} forks
          </span>
        </div>
      </div>
    </Link>
  )
}
