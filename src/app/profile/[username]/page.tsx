import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, GitBranch, Eye, User, Calendar } from 'lucide-react'
import { formatDate, formatReadCount } from '@/lib/utils'
import { StoryCard } from '@/components/StoryCard'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ username: string }>
}

async function getProfile(username: string) {
  try {
    const supabase = await createClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !profile) return null

    const { data: stories } = await supabase
      .from('stories')
      .select('*, author:profiles(*), branches(id, name, is_canon, total_reads)')
      .eq('author_id', profile.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    const { data: authoredBranches } = await supabase
      .from('branches')
      .select('*, story:stories(title, id)')
      .eq('author_id', profile.id)
      .eq('is_canon', false)
      .order('created_at', { ascending: false })

    return { profile, stories: stories || [], forks: authoredBranches || [] }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `@${username} — StoryForge`,
    description: `Read stories and forks by @${username} on StoryForge`,
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params
  const data = await getProfile(username)
  if (!data) notFound()

  const { profile, stories, forks } = data

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile header */}
        <div className="glass rounded-3xl p-8 border border-white/10 mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-violet-600 flex items-center justify-center flex-shrink-0 text-white text-3xl font-bold font-story">
              {profile.display_name?.[0] || profile.username[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-story text-2xl sm:text-3xl font-bold text-white mb-1">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-slate-500 text-sm mb-3">@{profile.username}</p>
              {profile.bio && (
                <p className="text-slate-400 leading-relaxed max-w-xl">{profile.bio}</p>
              )}
              <div className="flex items-center gap-1.5 mt-3 text-slate-600 text-xs">
                <Calendar className="w-3 h-3" />
                Joined {formatDate(profile.created_at)}
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-white font-story">{stories.length}</div>
                <div className="text-slate-500 text-xs">Stories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-story">{forks.length}</div>
                <div className="text-slate-500 text-xs">Forks</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stories */}
        {stories.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h2 className="font-story text-xl font-bold text-white">Stories</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {stories.map((story: any) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        )}

        {/* Forks */}
        {forks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <GitBranch className="w-4 h-4 text-violet-400" />
              <h2 className="font-story text-xl font-bold text-white">Forks</h2>
            </div>
            <div className="space-y-3">
              {forks.map((fork: any) => (
                <Link
                  key={fork.id}
                  href={`/story/${fork.story?.id}`}
                  className="glass rounded-xl p-5 border border-violet-500/15 card-hover flex items-center justify-between gap-4 group"
                >
                  <div>
                    <div className="text-violet-400 font-mono text-xs mb-1">
                      ⎇ {fork.name}
                    </div>
                    <div className="text-white text-sm font-medium group-hover:text-violet-300 transition-colors">
                      forked from: {fork.story?.title}
                    </div>
                    {fork.description && (
                      <p className="text-slate-500 text-xs mt-1">{fork.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs flex-shrink-0">
                    <Eye className="w-3 h-3" />
                    {formatReadCount(fork.total_reads)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {stories.length === 0 && forks.length === 0 && (
          <div className="text-center py-20">
            <User className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500">No stories published yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
