'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { useState, Suspense } from 'react'
import { GitBranch, Save, ArrowLeft, Type, Bold, Italic, List } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null
  return (
    <div className="flex items-center gap-1 p-2 border-b border-black/5 bg-paper-100">
      {[
        { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), label: 'Bold', active: editor.isActive('bold') },
        { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), label: 'Italic', active: editor.isActive('italic') },
        { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), label: 'List', active: editor.isActive('bulletList') },
      ].map(({ icon: Icon, action, label, active }) => (
        <button
          key={label}
          onMouseDown={(e) => { e.preventDefault(); action() }}
          title={label}
          className={`p-2 rounded-lg transition-colors ${
            active ? 'bg-amber-100 text-amber-700' : 'text-ink-500 hover:text-ink-900 hover:bg-black/5'
          }`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}

function WritePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const isFork = searchParams.get('fork') === 'true'
  const storyId = searchParams.get('storyId')
  const parentChapterId = searchParams.get('parentChapterId')
  const branchId = searchParams.get('branchId')
  const parentChapterNum = parseInt(searchParams.get('chapterNum') || '0')

  const [title, setTitle] = useState('')
  const [branchName, setBranchName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [supabase] = useState(() => createClient())

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: isFork
          ? 'This is where the story diverges. Write your version of what happens next…'
          : 'Begin your story here. The first sentence is the hardest…',
      }),
      CharacterCount,
    ],
    editorProps: {
      attributes: { class: 'ProseMirror min-h-[400px] focus:outline-none text-ink-800' },
    },
  })

  const wordCount = editor?.storage.characterCount?.words() || 0

  const handleSave = async () => {
    if (!title.trim() || !editor?.getText().trim() || !supabase) return
    
    // Require branch name if forking
    if (isFork && !branchName.trim()) {
      alert('Please provide a branch name')
      return
    }

    setSaving(true)

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session) {
        router.push('/auth?mode=signin')
        return
      }

      if (isFork && storyId && parentChapterId) {
        // --- 1. FORK EXISTING STORY ---
        
        // Create the new branch
        const { data: branch, error: branchError } = await supabase.from('branches').insert({
          story_id: storyId,
          author_id: session.user.id,
          name: branchName,
          description: 'A forked narrative path',
          is_canon: false,
          fork_from_chapter_id: parentChapterId
        }).select().single()

        if (branchError) throw branchError

        // Create the new chapter
        const { error: chapterError } = await supabase.from('chapters').insert({
          story_id: storyId,
          branch_id: branch.id,
          parent_chapter_id: parentChapterId,
          author_id: session.user.id,
          title: title,
          content: editor.getHTML(),
          chapter_number: parentChapterNum + 1,
          is_canon: false,
          word_count: wordCount,
          is_published: true
        })

        if (chapterError) throw chapterError

        setSaved(true)
        // Navigate to the story to see the new branch
        router.push(`/story/${storyId}`)
        
      } else {
        // --- 2. CREATE BRAND NEW STORY ---
        
        // Create the story
        const { data: story, error: storyError } = await supabase.from('stories').insert({
          author_id: session.user.id,
          title: title,
          description: 'A new narrative universe begins...',
          is_published: true
        }).select().single()

        if (storyError) throw storyError

        // Create the canon branch
        const { data: branch, error: branchError } = await supabase.from('branches').insert({
          story_id: story.id,
          author_id: session.user.id,
          name: 'canon',
          is_canon: true
        }).select().single()

        if (branchError) throw branchError

        // Create the first chapter
        const { error: chapterError } = await supabase.from('chapters').insert({
          story_id: story.id,
          branch_id: branch.id,
          parent_chapter_id: null,
          author_id: session.user.id,
          title: title,
          content: editor.getHTML(),
          chapter_number: 1,
          is_canon: true,
          word_count: wordCount,
          is_published: true
        })

        if (chapterError) throw chapterError

        setSaved(true)
        // Navigate to the newly created story
        router.push(`/story/${story.id}`)
      }
      
      router.refresh() // Tell Next.js to re-fetch server data
      
    } catch (err: any) {
      console.error('Failed to save chapter:', err)
      alert('Failed to save chapter: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen pt-16 bg-paper-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {storyId ? (
              <Link
                href={`/story/${storyId}`}
                className="flex items-center gap-1.5 text-ink-500 hover:text-ink-900 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to story
              </Link>
            ) : (
              <Link href="/explore" className="flex items-center gap-1.5 text-ink-500 hover:text-ink-900 text-sm font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Explore
              </Link>
            )}
            {isFork && (
              <>
                <span className="text-ink-300">/</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold">
                  <GitBranch className="w-3 h-3" />
                  Forking from Chapter {parentChapterNum}
                </div>
              </>
            )}
          </div>

          <button
            id="save-chapter-btn"
            onClick={handleSave}
            disabled={saving || saved || !title.trim()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all ${
              saved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'btn-primary'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Chapter'}
          </button>
        </div>

        {/* Fork context banner */}
        {isFork && (
          <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 mb-8 shadow-sm">
            <div className="flex items-start gap-3">
              <GitBranch className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-violet-900 text-sm font-bold mb-1">
                  You're creating a fork from Chapter {parentChapterNum}
                </div>
                <p className="text-violet-700/80 text-xs">
                  Your fork will branch from this point. The original story continues unchanged.
                  Give your branch a unique name below.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor - main column */}
          <div className="lg:col-span-2">
            {/* Chapter title */}
            <input
              id="chapter-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chapter title…"
              className="w-full font-story text-3xl font-bold text-ink-900 bg-transparent border-none outline-none placeholder-ink-300 mb-6"
            />

            {/* Rich text editor */}
            <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
              <EditorToolbar editor={editor} />
              <div className="p-6">
                <EditorContent editor={editor} />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-black/5 text-ink-500 text-xs font-medium bg-paper-50">
                <span className="flex items-center gap-1.5">
                  <Type className="w-3 h-3" />
                  {wordCount} words
                </span>
                <span>~{Math.ceil(wordCount / 250)} min read</span>
              </div>
            </div>
          </div>

          {/* Settings sidebar */}
          <div className="space-y-5">
            {/* Branch settings */}
            {isFork && (
              <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                <h3 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-violet-500" />
                  Branch Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="branch-name-input" className="block text-xs font-bold text-ink-600 mb-2 uppercase tracking-wide">
                      Branch name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="branch-name-input"
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="my-alternate-ending"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-black/10 text-ink-900 text-sm placeholder-ink-300 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono transition-colors shadow-inner"
                    />
                    <p className="text-ink-500 text-xs mt-1.5 font-medium">Lowercase, hyphens only. Like a git branch name.</p>
                  </div>
                  <div>
                    <label htmlFor="branch-desc-input" className="block text-xs font-bold text-ink-600 mb-2 uppercase tracking-wide">
                      Branch description
                    </label>
                    <textarea
                      id="branch-desc-input"
                      rows={3}
                      placeholder="What makes your version different?"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-black/10 text-ink-900 text-sm placeholder-ink-300 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none transition-colors shadow-inner"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Writing tips */}
            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
              <h3 className="text-sm font-bold text-ink-900 mb-3">Writing tips</h3>
              <ul className="space-y-2 text-xs text-ink-600 font-medium">
                <li>· Aim for 800–2000 words per chapter</li>
                <li>· Start in the middle of the action</li>
                <li>· End with a hook or decision point</li>
                {isFork && <li className="text-violet-600">· Reference the fork point naturally in your prose</li>}
              </ul>
            </div>

            {/* Sign in prompt */}
            {!supabase && (
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 shadow-sm">
                <p className="text-amber-800 text-sm font-bold mb-2">Sign in to publish</p>
                <p className="text-amber-700/80 text-xs mb-4">
                  Your draft won't be lost. Sign in to save and publish your chapter.
                </p>
                <Link href="/auth" className="btn-primary text-sm w-full justify-center shadow-md">
                  Sign in to publish
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-16 flex items-center justify-center text-ink-500 bg-paper-100">Loading editor…</div>}>
      <WritePageInner />
    </Suspense>
  )
}
