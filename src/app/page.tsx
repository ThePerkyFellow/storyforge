import Link from 'next/link'
import { GitBranch, BookOpen, Users, ArrowRight, Star, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StoryCard } from '@/components/StoryCard'
import type { Story } from '@/lib/types'

async function getFeaturedStories(): Promise<Story[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        author:profiles(*),
        branches(id, name, is_canon, total_reads)
      `)
      .eq('is_published', true)
      .order('total_reads', { ascending: false })
      .limit(4)

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

const HOW_IT_WORKS = [
  {
    icon: BookOpen,
    color: 'from-amber-500 to-orange-500',
    step: '01',
    title: 'Read any story',
    description:
      'Browse thousands of original stories. Every narrative is a tree waiting to branch.',
  },
  {
    icon: GitBranch,
    color: 'from-violet-500 to-purple-600',
    step: '02',
    title: 'Fork from any chapter',
    description:
      'Disagree with where the story is going? Hit Fork and take the narrative in your direction — from that exact moment.',
  },
  {
    icon: Users,
    color: 'from-cyan-500 to-blue-500',
    step: '03',
    title: 'Build a universe together',
    description:
      'Your fork lives alongside the original. Readers choose their path. All contributors get credited.',
  },
]

const STATS = [
  { value: '2', label: 'Stories live', icon: BookOpen },
  { value: '5', label: 'Branches forked', icon: GitBranch },
  { value: '3', label: 'Authors', icon: Users },
  { value: '∞', label: 'Possible endings', icon: Star },
]

export default async function HomePage() {
  const featuredStories = await getFeaturedStories()

  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-24 sm:pt-28 sm:pb-32">
        {/* Background glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-violet-600/5 blur-3xl animate-pulse-glow" />
          <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-black/5 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-amber-500/30 text-amber-600 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            GitHub × Wattpad — but for stories
          </div>

          {/* Headline */}
          <h1 className="font-story text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-ink-900">
            Every story has{' '}
            <span className="gradient-text">infinite</span>
            <br />
            <span className="italic text-ink-600">endings.</span>
          </h1>

          <p className="text-lg sm:text-xl text-ink-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            StoryForge is where readers become co-authors. Fork any story from any chapter,
            write your own continuation, and let the community choose which branch they love most.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore" className="btn-primary text-base px-6 py-3">
              <BookOpen className="w-5 h-5" />
              Start Reading
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/write" className="btn-secondary text-base px-6 py-3">
              <GitBranch className="w-5 h-5" />
              Start Writing
            </Link>
          </div>

          {/* Floating stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-2xl mx-auto">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="glass rounded-xl p-4 text-center card-hover">
                <Icon className="w-4 h-4 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-ink-900 font-story">{value}</div>
                <div className="text-xs text-ink-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Branch tree visual explainer */}
      <section className="px-4 py-20 relative">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-8 sm:p-12 border border-black/5 relative overflow-hidden bg-white/50">
            <div className="relative">
              <div className="text-center mb-10">
                <h2 className="font-story text-3xl sm:text-4xl font-bold text-ink-900 mb-3">
                  Stories as <span className="gradient-text-violet">living trees</span>
                </h2>
                <p className="text-ink-600">Every fork creates a new branch in the story universe</p>
              </div>

              {/* Visual branch diagram */}
              <div className="font-mono text-sm overflow-x-auto bg-white/60 rounded-xl p-6 border border-black/5 shadow-sm">
                <div className="min-w-max mx-auto space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0 shadow-sm" />
                    <span className="text-ink-900 font-semibold">Ch.1 — The Signal</span>
                    <span className="text-ink-500 text-xs">[canon] @aria_voss</span>
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    <span className="text-ink-300">│</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0 shadow-sm" />
                    <span className="text-ink-900 font-semibold">Ch.2 — The Translation</span>
                    <span className="text-ink-500 text-xs">[canon] @aria_voss</span>
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    <span className="text-ink-300">├──</span>
                    <span className="w-3 h-3 rounded-full bg-violet-500 flex-shrink-0 shadow-sm" />
                    <span className="text-violet-700 font-semibold">Ch.3 — The Other Signal</span>
                    <span className="text-ink-500 text-xs">[fork: dex-they-survived] @dex_morlan</span>
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    <span className="text-ink-300">│</span>
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    <span className="text-ink-300">└──</span>
                    <span className="w-3 h-3 rounded-full bg-cyan-500 flex-shrink-0 shadow-sm" />
                    <span className="text-cyan-700 font-semibold">Ch.3 — What Comes Before</span>
                    <span className="text-ink-500 text-xs">[fork: luna-dark-ending] @luna_writes</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0 shadow-sm" />
                    <span className="text-ink-900 font-semibold">Ch.3 — The Decision</span>
                    <span className="text-ink-500 text-xs">[canon] @aria_voss</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Link href="/story/10000000-0000-0000-0000-000000000001/tree" className="btn-fork">
                  <GitBranch className="w-4 h-4" />
                  See Live Branch Tree
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-story text-4xl font-bold text-ink-900 mb-4">
              How StoryForge works
            </h2>
            <p className="text-ink-600 text-lg max-w-xl mx-auto">
              Three steps from reader to co-author
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ icon: Icon, color, step, title, description }) => (
              <div key={step} className="glass rounded-2xl p-7 border border-black/5 card-hover group bg-white/40">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs font-mono text-ink-500 mb-2">STEP {step}</div>
                <h3 className="font-story text-xl font-bold text-ink-900 mb-3">{title}</h3>
                <p className="text-ink-600 leading-relaxed text-sm">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured stories */}
      {featuredStories.length > 0 && (
        <section className="px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 text-amber-600 text-sm font-bold mb-2">
                  <TrendingUp className="w-4 h-4" />
                  FEATURED STORIES
                </div>
                <h2 className="font-story text-3xl font-bold text-ink-900">
                  Stories worth forking
                </h2>
              </div>
              <Link href="/explore" className="btn-secondary hidden sm:flex">
                Explore all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5">
              {featuredStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-4 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 border border-violet-500/10 glow-violet relative overflow-hidden bg-white/60">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-amber-500/5 pointer-events-none" />
            <div className="relative">
              <h2 className="font-story text-4xl font-bold text-ink-900 mb-4">
                Ready to write your ending?
              </h2>
              <p className="text-ink-600 mb-8 text-lg">
                Join the first platform where your fork of a story is as valid as the original.
              </p>
              <Link href="/auth?mode=signup" className="btn-primary text-base px-8 py-3.5">
                <GitBranch className="w-5 h-5" />
                Create your account — it's free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 px-4 py-10 bg-white/30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-amber-500" />
            <span className="font-story font-bold text-ink-800">StoryForge</span>
            <span className="text-ink-500 text-sm">· Every story, infinitely forked.</span>
          </div>
          <div className="text-ink-500 text-sm">
            Built for writers, by storytellers · {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  )
}
