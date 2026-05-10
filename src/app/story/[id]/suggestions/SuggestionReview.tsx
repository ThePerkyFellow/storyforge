'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, BookOpen, GitBranch } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SuggestionReview({ request, storyId }: { request: any, storyId: string }) {
  const supabase = createClient()
  const router = useRouter()
  
  const [expanded, setExpanded] = useState(false)
  const [chapters, setChapters] = useState<any[]>([])
  const [canonChapters, setCanonChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actioning, setActioning] = useState(false)

  // Fetch chapters for the branch when expanded
  useEffect(() => {
    if (expanded && chapters.length === 0) {
      loadChapters()
    }
  }, [expanded])

  const loadChapters = async () => {
    setLoading(true)
    try {
      // 1. Fetch the alternative chapters
      const { data: altChapters } = await supabase
        .from('chapters')
        .select('*')
        .eq('branch_id', request.from_branch_id)
        .order('chapter_number', { ascending: true })

      if (altChapters) setChapters(altChapters)

      // 2. Fetch the corresponding canon chapters (if they exist) to show diff
      if (altChapters && altChapters.length > 0) {
        const chapterNumbers = altChapters.map(c => c.chapter_number)
        const { data: cChapters } = await supabase
          .from('chapters')
          .select('*')
          .eq('branch_id', request.to_branch_id)
          .in('chapter_number', chapterNumbers)
        
        if (cChapters) setCanonChapters(cChapters)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (status: 'accepted' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${status} this suggestion?`)) return
    
    setActioning(true)
    try {
      const { error } = await supabase
        .from('merge_requests')
        .update({ status })
        .eq('id', request.id)

      if (error) throw error

      if (status === 'accepted') {
        // Simple merge: Just update the branch_id of the alternative chapters to the canon branch ID
        // Note: A real app would need conflict resolution if canon chapters exist at those numbers
        // For StoryForge Phase 2, we just mark the branch itself as canon, or reassign chapters.
        // Let's just update the chapters' branch_id and is_canon flag.
        await supabase
          .from('chapters')
          .update({ branch_id: request.to_branch_id, is_canon: true })
          .eq('branch_id', request.from_branch_id)
      }

      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to update suggestion.')
    } finally {
      setActioning(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      <div 
        className="p-6 cursor-pointer flex items-start justify-between gap-4 hover:bg-paper-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h3 className="text-xl font-bold text-ink-900 mb-1">{request.title}</h3>
          <p className="text-ink-600 text-sm mb-3">{request.description}</p>
          <div className="flex items-center gap-3 text-xs text-ink-500 font-medium">
            <span className="bg-violet-50 text-violet-700 px-2 py-1 rounded">Path: {request.from_branch.name}</span>
            <span>Suggested by @{request.author.username}</span>
          </div>
        </div>
        <div className="text-ink-400">
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-black/5 bg-paper-50 p-6">
          {loading ? (
            <div className="text-center text-ink-500 py-8">Loading diff viewer...</div>
          ) : (
            <div className="space-y-8">
              {/* Diff Viewer */}
              {chapters.map(altCh => {
                const canonCh = canonChapters.find(c => c.chapter_number === altCh.chapter_number)
                
                return (
                  <div key={altCh.id} className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-ink-900 text-white px-4 py-2 text-sm font-bold flex items-center justify-between">
                      <span>Chapter {altCh.chapter_number}</span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/10">
                      {/* Canon Side */}
                      <div className="p-6 bg-red-50/30">
                        <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-4">
                          <BookOpen className="w-4 h-4" />
                          Current Canon
                        </div>
                        {canonCh ? (
                          <div className="prose prose-sm max-w-none text-ink-600 opacity-60" dangerouslySetInnerHTML={{ __html: canonCh.content }} />
                        ) : (
                          <div className="text-ink-400 italic">No existing canon chapter. This is a pure continuation.</div>
                        )}
                      </div>

                      {/* Alternative Side */}
                      <div className="p-6 bg-emerald-50/30">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4">
                          <GitBranch className="w-4 h-4" />
                          Suggested Path
                        </div>
                        <h4 className="font-bold text-lg mb-4 text-ink-900">{altCh.title}</h4>
                        <div className="prose prose-sm max-w-none text-ink-900" dangerouslySetInnerHTML={{ __html: altCh.content }} />
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="flex justify-end gap-4 pt-4 border-t border-black/5">
                <button
                  onClick={() => handleAction('rejected')}
                  disabled={actioning}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Suggestion
                </button>
                <button
                  onClick={() => handleAction('accepted')}
                  disabled={actioning}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept & Merge to Canon
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
