import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, GitBranch, Clock, Eye, User } from 'lucide-react'
import { estimateReadTime, formatDate, formatReadCount } from '@/lib/utils'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string; branchId: string; num: string }>
}

async function getChapterData(storyId: string, branchId: string, num: number) {
  try {
    const supabase = await createClient()

    const { data: chapter, error } = await supabase
      .from('chapters')
      .select('*, author:profiles(*), branch:branches(*)')
      .eq('story_id', storyId)
      .eq('branch_id', branchId)
      .eq('chapter_number', num)
      .single()

    if (error || !chapter) return null

    // Get story title
    const { data: story } = await supabase
      .from('stories')
      .select('title, id')
      .eq('id', storyId)
      .single()

    // Get prev/next in same branch
    const { data: prevChapter } = await supabase
      .from('chapters')
      .select('id, title, chapter_number')
      .eq('branch_id', branchId)
      .eq('chapter_number', num - 1)
      .single()

    const { data: nextChapter } = await supabase
      .from('chapters')
      .select('id, title, chapter_number')
      .eq('branch_id', branchId)
      .eq('chapter_number', num + 1)
      .single()

    // Get all chapters in branch for table of contents
    const { data: branchChapters } = await supabase
      .from('chapters')
      .select('id, title, chapter_number')
      .eq('branch_id', branchId)
      .order('chapter_number', { ascending: true })

    return { chapter, story, prevChapter, nextChapter, branchChapters: branchChapters || [] }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, branchId, num } = await params
  const data = await getChapterData(id, branchId, parseInt(num))
  if (!data) return { title: 'Chapter Not Found — StoryForge' }
  return {
    title: `${data.chapter.title} — ${data.story?.title || 'StoryForge'}`,
    description: `Read Chapter ${num}: ${data.chapter.title}`,
  }
}

export default async function ChapterPage({ params }: PageProps) {
  const { id, branchId, num } = await params
  const chapterNum = parseInt(num)
  const data = await getChapterData(id, branchId, chapterNum)
  if (!data) notFound()

  const { chapter, story, prevChapter, nextChapter, branchChapters } = data
  const branch = chapter.branch as any
  const author = chapter.author as any

  const paragraphs = chapter.content
    .split('\n\n')
    .map((p: string) => p.trim())
    .filter(Boolean)

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main reading column */}
          <div className="lg:col-span-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-8 flex-wrap">
              <Link href="/explore" className="hover:text-slate-300 transition-colors">Explore</Link>
              <span>/</span>
              <Link href={`/story/${id}`} className="hover:text-slate-300 transition-colors">
                {story?.title}
              </Link>
              <span>/</span>
              {!branch?.is_canon && (
                <>
                  <span className="text-violet-400 font-mono text-xs">{branch?.name}</span>
                  <span>/</span>
                </>
              )}
              <span className="text-slate-300">Ch.{chapterNum}</span>
            </div>

            {/* Chapter header */}
            <div className="mb-10">
              {!branch?.is_canon && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-medium mb-4">
                  <GitBranch className="w-3 h-3" />
                  Fork: {branch?.name}
                </div>
              )}
              <div className="text-slate-500 text-sm mb-2 font-mono">
                Chapter {chapterNum}
              </div>
              <h1 className="font-story text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                {chapter.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 pb-6 border-b border-white/8">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <Link
                    href={`/profile/${author?.username}`}
                    className="text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    @{author?.username}
                  </Link>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {estimateReadTime(chapter.word_count)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  {formatReadCount(chapter.read_count)} reads
                </span>
                <span>{formatDate(chapter.created_at)}</span>
              </div>
            </div>

            {/* Story content */}
            <article className="prose-story mb-16">
              {paragraphs.map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </article>

            {/* Reactions */}
            <div className="flex items-center gap-3 mb-10 pb-8 border-b border-white/8">
              <span className="text-slate-500 text-sm">React:</span>
              {[
                { emoji: '❤️', label: 'heart' },
                { emoji: '🔥', label: 'fire' },
                { emoji: '🤯', label: 'mind_blown' },
                { emoji: '😭', label: 'cry' },
                { emoji: '😂', label: 'laugh' },
              ].map(({ emoji, label }) => (
                <button
                  key={label}
                  id={`react-${label}`}
                  className="text-2xl hover:scale-125 transition-transform duration-150 cursor-pointer"
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Fork CTA */}
            <div className="glass rounded-2xl p-6 border border-violet-500/20 bg-violet-500/5 mb-8">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-violet-400" />
                <h3 className="text-white font-semibold">Fork from this chapter</h3>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                You disagree with what happens next? Fork the story from here and write your own version.
              </p>
              <Link
                href={`/write?fork=true&storyId=${id}&parentChapterId=${chapter.id}&branchId=${branchId}&chapterNum=${chapterNum}`}
                className="btn-fork"
                id="fork-from-chapter-btn"
              >
                <GitBranch className="w-4 h-4" />
                Fork from Chapter {chapterNum}
              </Link>
            </div>

            {/* Chapter navigation */}
            <div className="flex items-center justify-between gap-4">
              {prevChapter ? (
                <Link
                  href={`/story/${id}/branch/${branchId}/chapter/${prevChapter.chapter_number}`}
                  className="flex items-center gap-2 glass px-4 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/25 transition-all group flex-1"
                  id="prev-chapter-btn"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">Previous</div>
                    <div className="text-sm font-medium truncate">{prevChapter.title}</div>
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {nextChapter ? (
                <Link
                  href={`/story/${id}/branch/${branchId}/chapter/${nextChapter.chapter_number}`}
                  className="flex items-center gap-2 glass px-4 py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-white/25 transition-all group flex-1 justify-end text-right"
                  id="next-chapter-btn"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">Next</div>
                    <div className="text-sm font-medium truncate">{nextChapter.title}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </Link>
              ) : (
                <div className="glass px-4 py-3 rounded-xl border border-dashed border-white/10 text-slate-500 text-sm flex-1 text-center">
                  End of this branch — fork to continue?
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-5">
            {/* Table of contents */}
            <div className="glass rounded-2xl p-5 border border-white/10 sticky top-24">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                {branch?.is_canon ? 'Chapters' : `${branch?.name} chapters`}
              </h3>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {branchChapters.map((ch: any) => (
                  <Link
                    key={ch.id}
                    href={`/story/${id}/branch/${branchId}/chapter/${ch.chapter_number}`}
                    className={`block px-3 py-2 rounded-lg text-xs transition-colors ${
                      ch.chapter_number === chapterNum
                        ? 'bg-amber-500/15 text-amber-300 font-medium'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-slate-600 font-mono mr-2">{String(ch.chapter_number).padStart(2, '0')}</span>
                    {ch.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
