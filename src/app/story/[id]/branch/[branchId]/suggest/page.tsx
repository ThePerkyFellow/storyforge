'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'

export default function SuggestPage({ params }: { params: Promise<{ id: string, branchId: string }> }) {
  const { id: storyId, branchId } = use(params)
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || submitting) return

    setSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('You must be signed in to suggest an alternative.')

      // Get the canon branch
      const { data: canonBranch, error: canonError } = await supabase
        .from('branches')
        .select('id')
        .eq('story_id', storyId)
        .eq('is_canon', true)
        .single()

      if (canonError || !canonBranch) throw new Error('Could not find the canon timeline.')

      // Insert the merge request
      const { error: mrError } = await supabase
        .from('merge_requests')
        .insert({
          story_id: storyId,
          from_branch_id: branchId,
          to_branch_id: canonBranch.id,
          author_id: session.user.id,
          title,
          description
        })

      if (mrError) throw mrError

      setSubmitted(true)
      setTimeout(() => {
        router.push(`/story/${storyId}`)
      }, 2000)

    } catch (err: any) {
      console.error('Submission failed:', err)
      alert(err.message || 'Failed to submit suggestion.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-16 bg-paper-100">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href={`/story/${storyId}`}
          className="flex items-center gap-1.5 text-ink-500 hover:text-ink-900 text-sm font-medium transition-colors mb-8 inline-flex"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to story
        </Link>
        
        <h1 className="text-3xl font-bold text-ink-900 mb-2">Suggest to Canon</h1>
        <p className="text-ink-600 mb-8">
          Propose your alternative path to the original author. If they accept, your chapters will be merged into the official story timeline!
        </p>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center shadow-sm">
            <h2 className="text-xl font-bold mb-2">Suggestion Submitted!</h2>
            <p>The author will review your alternative path. Redirecting you back to the story...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-bold text-ink-900 mb-2">
                Title of your suggestion
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. A darker ending for Chapter 3"
                className="w-full px-4 py-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-bold text-ink-900 mb-2">
                Why should the author include this? (Optional)
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly explain your alternate timeline..."
                className="w-full px-4 py-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            </div>

            <div className="pt-4 border-t border-black/5 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="btn-primary"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Suggestion'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
