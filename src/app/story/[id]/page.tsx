import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Eye, User, ArrowRight, Clock, GitBranch, Settings } from 'lucide-react'
import { formatReadCount, formatDate, estimateReadTime, GENRE_COLORS, cn } from '@/lib/utils'
import type { Story, Branch, Chapter } from '@/lib/types'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getStoryData(id: string) {
  try {
    const supabase = await createClient()

    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`*, author:profiles(*)`)
      .eq('id', id)
      .single()

    if (storyError || !story) return null

    const { data: branches } = await supabase
      .from('branches')
      .select(`*, author:profiles(*)`)
      .eq('story_id', id)
      .order('is_canon', { ascending: false })

    const { data: chapters } = await supabase
      .from('chapters')
      .select(`*, author:profiles(*)`)
      .eq('story_id', id)
      .order('chapter_number', { ascending: true })

    return { story, branches: branches || [], chapters: chapters || [] }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getStoryData(id)
  if (!data) return { title: 'Story Not Found — StoryForge' }
  return {
    title: `${data.story.title} — StoryForge`,
    description: data.story.description || `Read "${data.story.title}" on StoryForge`,
  }
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params
  const data = await getStoryData(id)
  if (!data) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { story, branches, chapters } = data
  const isAuthor = session?.user?.id === story.author_id

  const canonBranch = branches.find((b: Branch) => b.is_canon)
  const forkBranches = branches.filter((b: Branch) => !b.is_canon)
  const canonChapters = chapters.filter((c: Chapter) => c.is_canon)
  const genreColors = story.genre ? GENRE_COLORS[story.genre] : null

  return (
    <div className="min-h-screen pt-16 bg-paper-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content - left 2/3 */}
          <div className="lg:col-span-2">
            {/* Story header */}
            <div className="mb-8">
              {story.genre && genreColors && (
                <span className={cn('tag mb-4 bg-white', genreColors.text, 'border-black/5 shadow-sm')}>
                  {story.genre}
                </span>
              )}
              <h1 className="font-story text-4xl sm:text-5xl font-bold text-ink-900 leading-tight mb-4">
                {story.title}
              </h1>
              {story.description && (
                <p className="text-ink-600 text-lg leading-relaxed mb-6">{story.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <Link href={`/profile/${story.author?.username}`} className="text-amber-600 hover:text-amber-700 transition-colors">
                    @{story.author?.username}
                  </Link>
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {formatReadCount(story.total_reads)} reads
                </span>
                <span className="flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-violet-500" />
                  {story.total_forks} alternatives
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatDate(story.created_at)}
                </span>
              </div>

              {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {story.tags.map((tag: string) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg bg-white text-ink-500 text-xs border border-black/5 shadow-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-10">
              {canonChapters[0] && (
                <Link
                  href={`/story/${id}/branch/${canonBranch?.id}/chapter/1`}
                  className="btn-primary shadow-sm"
                  id="start-reading-btn"
                >
                  <BookOpen className="w-4 h-4" />
                  Start Reading
                </Link>
              )}
              <Link
                href={`/story/${id}/tree`}
                className="btn-secondary shadow-sm"
                id="view-tree-btn"
              >
                <GitBranch className="w-4 h-4" />
                View Story Tree
              </Link>
              {isAuthor && (
                <>
                  <Link
                    href={`/story/${id}/suggestions`}
                    className="btn-secondary shadow-sm ml-auto text-ink-600 bg-white border-black/10 hover:border-violet-300 hover:text-violet-700"
                    id="story-suggestions-btn"
                  >
                    <GitBranch className="w-4 h-4" />
                    Review Suggestions
                  </Link>
                  <Link
                    href={`/story/${id}/settings`}
                    className="btn-secondary shadow-sm text-ink-600 bg-white border-black/10 hover:border-black/20"
                    id="story-settings-btn"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </>
              )}
            </div>

            {/* Canon chapters list */}
            {canonBranch && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <h2 className="font-story text-xl font-bold text-ink-900">
                    Canon — {canonBranch.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                    original
                  </span>
                </div>

                <div className="space-y-3">
                  {canonChapters.map((chapter: Chapter, idx: number) => (
                    <div
                      key={chapter.id}
                      className="bg-white rounded-xl p-4 border border-black/5 shadow-sm flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-ink-400 font-mono text-sm w-6 text-right flex-shrink-0 font-bold">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1">
                          <div className="text-ink-900 text-sm font-bold">
                            {chapter.title}
                          </div>
                          <div className="text-ink-500 text-xs mt-0.5 font-medium">
                            {estimateReadTime(chapter.word_count)} · {formatReadCount(chapter.read_count)} reads
                          </div>
                        </div>
                      </div>
                      
                      {/* Chapter Actions */}
                      <div className="flex items-center gap-2 pl-10">
                        <Link
                          href={`/story/${id}/branch/${chapter.branch_id}/chapter/${chapter.chapter_number}`}
                          id={`chapter-read-${idx + 1}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Read
                        </Link>
                        {story?.allow_alternatives && (
                          <Link
                            href={`/story/${id}/branch/${chapter.branch_id}/chapter/${chapter.chapter_number}/write-alternative`}
                            id={`chapter-write-${idx + 1}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg text-xs font-bold transition-colors"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                            Write Alternative
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternative paths */}
            {forkBranches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <h2 className="font-story text-xl font-bold text-ink-900">
                    Community Alternatives
                  </h2>
                  <span className="px-2 py-0.5 rounded text-xs bg-violet-50 text-violet-700 border border-violet-200 font-semibold">
                    {forkBranches.length} alternate path{forkBranches.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  {forkBranches.map((branch: Branch) => {
                    const branchChapters = chapters.filter((c: Chapter) => c.branch_id === branch.id)
                    return (
                      <div key={branch.id} className="bg-white rounded-xl p-5 border border-violet-100 shadow-sm flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <GitBranch className="w-3.5 h-3.5 text-violet-500" />
                              <span className="text-violet-700 text-sm font-bold font-mono">
                                {branch.name}
                              </span>
                            </div>
                            {branch.description && (
                              <p className="text-ink-600 text-sm">{branch.description}</p>
                            )}
                          </div>
                          <span className="text-ink-500 text-xs flex items-center gap-1 flex-shrink-0 font-medium">
                            <Eye className="w-3 h-3" />
                            {formatReadCount(branch.total_reads)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-ink-500 text-xs font-medium">
                            by @{branch.author?.username} · {branchChapters.length} chapter{branchChapters.length !== 1 ? 's' : ''}
                          </span>
                          <div className="flex items-center gap-2">
                            {branchChapters[0] && (
                              <Link
                                href={`/story/${id}/branch/${branch.id}/chapter/${branchChapters[0].chapter_number}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                Read
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - right 1/3 */}
          <div className="space-y-5">
            {/* Story stats */}
            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
              <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider mb-4">Story Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total reads', value: formatReadCount(story.total_reads), icon: Eye },
                  { label: 'Timelines', value: branches.length, icon: GitBranch },
                  { label: 'Chapters', value: canonChapters.length, icon: BookOpen },
                  { label: 'Alternatives', value: story.total_forks, icon: GitBranch },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-paper-100 rounded-xl p-3 text-center border border-black/5">
                    <Icon className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <div className="text-ink-900 font-bold text-lg">{value}</div>
                    <div className="text-ink-500 text-xs font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Author card */}
            {story.author && (
              <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider mb-4">Author</h3>
                <Link href={`/profile/${story.author.username}`} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-ink-900 text-sm font-bold group-hover:text-amber-600 transition-colors">
                      {story.author.display_name}
                    </div>
                    <div className="text-ink-500 text-xs font-medium">@{story.author.username}</div>
                  </div>
                </Link>
                {story.author.bio && (
                  <p className="text-ink-600 text-xs leading-relaxed mt-3">{story.author.bio}</p>
                )}
              </div>
            )}

            {/* Alternative CTA */}
            {story?.allow_alternatives && (
              <div className="bg-violet-50 rounded-2xl p-5 border border-violet-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-bold text-violet-900">Write an Alternative</h3>
                </div>
                <p className="text-violet-700/80 text-xs leading-relaxed mb-4 font-medium">
                  Don't like where the story is going? Pick any chapter and write your own version of events.
                </p>
                <Link
                  href={`/story/${id}/tree`}
                  className="btn-secondary w-full justify-center text-sm shadow-sm bg-white"
                  id="fork-story-sidebar-btn"
                >
                  <GitBranch className="w-4 h-4" />
                  Choose a starting point
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
