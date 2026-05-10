import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, GitBranch, Clock, Eye, User, Split } from 'lucide-react'
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
      .select('*, author:profiles(*), branch:branches!chapters_branch_id_fkey(*)')
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

    // Get alternative paths that branch off from this chapter
    const { data: alternativePaths } = await supabase
      .from('branches')
      .select('*, author:profiles(*)')
      .eq('fork_from_chapter_id', chapter.id)

    // Get canon branch ID for suggestions
    const { data: canonBranch } = await supabase
      .from('branches')
      .select('id')
      .eq('story_id', storyId)
      .eq('is_canon', true)
      .single()

    return { 
      chapter, 
      story, 
      prevChapter, 
      nextChapter, 
      branchChapters: branchChapters || [],
      alternativePaths: alternativePaths || [],
      canonBranchId: canonBranch?.id
    }
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

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { chapter, story, prevChapter, nextChapter, branchChapters, alternativePaths, canonBranchId } = data
  const branch = chapter.branch as any
  const author = chapter.author as any
  const isBranchAuthor = session?.user?.id === author.id

  const paragraphs = chapter.content
    .split('\n\n')
    .map((p: string) => p.trim())
    .filter(Boolean)

  return (
    <div className="min-h-screen pt-16 bg-paper-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main reading column */}
          <div className="lg:col-span-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-ink-500 mb-8 flex-wrap font-medium">
              <Link href="/explore" className="hover:text-ink-900 transition-colors">Explore</Link>
              <span>/</span>
              <Link href={`/story/${id}`} className="hover:text-ink-900 transition-colors">
                {story?.title}
              </Link>
              <span>/</span>
              {!branch?.is_canon && (
                <>
                  <span className="text-violet-600 font-mono text-xs">{branch?.name}</span>
                  <span>/</span>
                </>
              )}
              <span className="text-ink-900 font-bold">Ch.{chapterNum}</span>
            </div>

            {/* Chapter header */}
            <div className="mb-10">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                {!branch?.is_canon && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold">
                    <Split className="w-3 h-3" />
                    Path: {branch?.name}
                  </div>
                )}
                
                {/* Suggest to Canon Button */}
                {!branch?.is_canon && isBranchAuthor && canonBranchId && (
                  <Link
                    href={`/story/${id}/branch/${branchId}/suggest`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition-colors ml-auto shadow-sm"
                  >
                    Suggest to Canon
                  </Link>
                )}
              </div>
              <div className="text-ink-500 text-sm mb-2 font-mono font-bold uppercase tracking-wider">
                Chapter {chapterNum}
              </div>
              <h1 className="font-story text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-900 leading-tight mb-6">
                {chapter.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-500 pb-6 border-b border-black/5 font-medium">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <Link
                    href={`/profile/${author?.username}`}
                    className="text-amber-600 hover:text-amber-700 transition-colors"
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
            <div className="flex items-center gap-3 mb-10 pb-8 border-b border-black/5">
              <span className="text-ink-500 text-sm font-bold">React:</span>
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

            {/* Crossroads UI */}
            <div className="mt-16 pt-10 border-t border-black/10">
              <h2 className="font-story text-3xl font-bold text-ink-900 text-center mb-2">
                What happens next?
              </h2>
              <p className="text-center text-ink-500 mb-8 font-medium">Choose a path to continue the story, or write your own.</p>
              
              <div className="flex flex-col gap-4">
                {/* 1. The Next Chapter in Current Timeline */}
                {nextChapter && (
                  <Link
                    href={`/story/${id}/branch/${branchId}/chapter/${nextChapter.chapter_number}`}
                    className="flex items-center justify-between bg-white px-6 py-5 rounded-2xl border-2 border-amber-500/20 hover:border-amber-500 hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
                        <ArrowRight className="w-4 h-4" />
                        Current Timeline
                      </div>
                      <div className="text-xl font-bold text-ink-900 group-hover:text-amber-700 transition-colors">
                        Chapter {nextChapter.chapter_number}: {nextChapter.title}
                      </div>
                    </div>
                    <div className="bg-amber-50 text-amber-600 p-3 rounded-full group-hover:bg-amber-100 transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </Link>
                )}

                {/* 2. Alternative Paths */}
                {alternativePaths.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-4 px-2">
                      Alternative Paths
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {alternativePaths.map((altPath: any) => (
                        <Link
                          key={altPath.id}
                          href={`/story/${id}/branch/${altPath.id}/chapter/${chapterNum + 1}`}
                          className="bg-white p-5 rounded-2xl border border-black/5 hover:border-violet-300 hover:shadow-md transition-all group flex flex-col"
                        >
                          <div className="flex items-center gap-2 text-violet-600 text-xs font-bold uppercase tracking-wider mb-2">
                            <Split className="w-3.5 h-3.5" />
                            Alternative Path
                          </div>
                          <div className="text-lg font-bold text-ink-900 group-hover:text-violet-700 transition-colors mb-2">
                            {altPath.name}
                          </div>
                          {altPath.description && (
                            <p className="text-sm text-ink-600 mb-4 line-clamp-2 flex-grow">{altPath.description}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-ink-500 font-medium mt-auto">
                            <span>by @{altPath.author?.username}</span>
                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {formatReadCount(altPath.total_reads)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. End of branch placeholder (if no next chapter) */}
                {!nextChapter && alternativePaths.length === 0 && (
                  <div className="bg-paper-100 p-8 rounded-2xl border-2 border-dashed border-black/10 text-center flex flex-col items-center justify-center mb-4">
                    <div className="text-ink-400 mb-2">
                      <Split className="w-8 h-8 mx-auto opacity-50" />
                    </div>
                    <h3 className="text-lg font-bold text-ink-900 mb-1">End of the line</h3>
                    <p className="text-ink-500 text-sm">This timeline ends here... for now.</p>
                  </div>
                )}

                {/* 4. Write Alternative Action */}
                {story.allow_alternatives && (
                  <div className="mt-6 flex justify-center">
                    <Link
                      href={`/write?fork=true&storyId=${id}&parentChapterId=${chapter.id}&branchId=${branchId}&chapterNum=${chapterNum}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 rounded-xl font-bold transition-colors shadow-sm"
                      id="write-alternative-btn"
                    >
                      <Split className="w-4 h-4" />
                      Write an Alternative Path
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Previous chapter nav (bottom) */}
            {prevChapter && (
              <div className="mt-12 pt-6 border-t border-black/5 flex justify-center">
                <Link
                  href={`/story/${id}/branch/${branchId}/chapter/${prevChapter.chapter_number}`}
                  className="flex items-center gap-2 text-ink-500 hover:text-ink-900 text-sm font-bold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Chapter {prevChapter.chapter_number}: {prevChapter.title}
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-5">
            {/* Table of contents */}
            <div className="bg-white rounded-2xl p-5 border border-black/5 sticky top-24 shadow-sm">
              <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wider mb-4">
                {branch?.is_canon ? 'Chapters' : `${branch?.name} chapters`}
              </h3>
              <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
                {branchChapters.map((ch: any) => (
                  <Link
                    key={ch.id}
                    href={`/story/${id}/branch/${branchId}/chapter/${ch.chapter_number}`}
                    className={`block px-3 py-2 rounded-lg text-xs transition-colors font-medium ${
                      ch.chapter_number === chapterNum
                        ? 'bg-amber-50 text-amber-800 font-bold'
                        : 'text-ink-600 hover:text-ink-900 hover:bg-black/5'
                    }`}
                  >
                    <span className="text-ink-400 font-mono mr-2">{String(ch.chapter_number).padStart(2, '0')}</span>
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
