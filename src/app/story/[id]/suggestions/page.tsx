import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Split, CheckCircle, XCircle } from 'lucide-react'
import SuggestionReview from './SuggestionReview'

export default async function SuggestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth?mode=signin')

  // Fetch story
  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single()

  if (!story || story.author_id !== session.user.id) notFound()

  // Fetch open merge requests
  const { data: requests } = await supabase
    .from('merge_requests')
    .select(`
      *,
      author:profiles(*),
      from_branch:branches!merge_requests_from_branch_id_fkey(*)
    `)
    .eq('story_id', id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen pt-16 bg-paper-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href={`/story/${id}`}
            className="flex items-center gap-1.5 text-ink-500 hover:text-ink-900 text-sm font-medium transition-colors mb-6 inline-flex"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to story
          </Link>
          <h1 className="text-3xl font-bold text-ink-900 mb-2">Review Suggestions</h1>
          <p className="text-ink-600">Review alternative paths submitted by the community.</p>
        </div>

        {(!requests || requests.length === 0) ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-black/5 shadow-sm">
            <Split className="w-12 h-12 text-ink-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-ink-900 mb-2">No open suggestions</h3>
            <p className="text-ink-500">When readers suggest alternative paths to become canon, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {requests.map((req) => (
              <SuggestionReview key={req.id} request={req} storyId={id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
