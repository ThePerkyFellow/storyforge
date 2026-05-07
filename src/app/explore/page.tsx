import { createClient } from '@/lib/supabase/server'
import { StoryCard } from '@/components/StoryCard'
import { Search, TrendingUp, Clock, Sparkles } from 'lucide-react'
import type { Story } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore Stories — StoryForge',
  description: 'Discover original stories across every genre. Read, fork, and co-author your favourite narratives.',
}

async function getStories(genre?: string): Promise<Story[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('stories')
      .select(`
        *,
        author:profiles(*),
        branches(id, name, is_canon, total_reads)
      `)
      .eq('is_published', true)
      .order('total_reads', { ascending: false })

    if (genre) query = query.eq('genre', genre)

    const { data, error } = await query.limit(20)
    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

const GENRES = [
  'All',
  'Science Fiction',
  'Fantasy',
  'Romance',
  'Thriller',
  'Mystery',
  'Horror',
  'Drama',
  'Adventure',
]

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>
}) {
  const params = await searchParams
  const activeGenre = params.genre || 'All'
  const stories = await getStories(activeGenre === 'All' ? undefined : activeGenre)

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-amber-600 text-sm font-bold mb-3">
            <Sparkles className="w-4 h-4" />
            EXPLORE
          </div>
          <h1 className="font-story text-4xl sm:text-5xl font-bold text-ink-900 mb-3">
            Stories worth forking
          </h1>
          <p className="text-ink-600 text-lg">
            {stories.length} {activeGenre !== 'All' ? activeGenre : ''} stories ready for your imagination
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-8 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
          <input
            id="story-search"
            type="text"
            placeholder="Search stories, authors, or tags..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-black/10 text-ink-900 placeholder-ink-400 shadow-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
          />
        </div>

        {/* Genre filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          {GENRES.map((genre) => (
            <a
              key={genre}
              href={genre === 'All' ? '/explore' : `/explore?genre=${encodeURIComponent(genre)}`}
              id={`genre-filter-${genre.toLowerCase().replace(/\s+/g, '-')}`}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                activeGenre === genre
                  ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                  : 'bg-white border-black/10 text-ink-600 hover:text-ink-900 hover:border-black/20 shadow-sm'
              }`}
            >
              {genre}
            </a>
          ))}
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-4 mb-8 border-b border-black/10 pb-4">
          <button id="sort-trending" className="flex items-center gap-1.5 text-amber-600 text-sm font-bold border-b-2 border-amber-500 pb-4 -mb-4">
            <TrendingUp className="w-4 h-4" />
            Trending
          </button>
          <button id="sort-newest" className="flex items-center gap-1.5 text-ink-500 text-sm font-medium hover:text-ink-900 transition-colors pb-4 -mb-4">
            <Clock className="w-4 h-4" />
            Newest
          </button>
        </div>

        {/* Stories grid */}
        {stories.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white/50 rounded-3xl border border-black/5">
            <div className="w-16 h-16 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-ink-400" />
            </div>
            <h3 className="font-story text-xl text-ink-900 mb-2 font-bold">No stories yet</h3>
            <p className="text-ink-500 text-sm">Be the first to write one in this genre.</p>
          </div>
        )}
      </div>
    </div>
  )
}
