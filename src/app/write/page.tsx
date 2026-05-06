'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { useState, Suspense } from 'react'
import { GitBranch, Save, ArrowLeft, Type, Bold, Italic, List } from 'lucide-react'
import Link from 'next/link'

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null
  return (
    <div className="flex items-center gap-1 p-2 border-b border-white/10">
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
            active ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
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
      attributes: { class: 'ProseMirror min-h-[400px] focus:outline-none' },
    },
  })

  const wordCount = editor?.storage.characterCount?.words() || 0

  const handleSave = async () => {
    if (!title.trim() || !editor?.getText().trim()) return
    setSaving(true)
    // In a real app, this would call an API route
    // For now, show a success state
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {storyId ? (
              <Link
                href={`/story/${storyId}`}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to story
              </Link>
            ) : (
              <Link href="/explore" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Explore
              </Link>
            )}
            {isFork && (
              <>
                <span className="text-slate-700">/</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs">
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              saved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'btn-primary'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Chapter'}
          </button>
        </div>

        {/* Fork context banner */}
        {isFork && (
          <div className="glass rounded-xl p-4 border border-violet-500/20 bg-violet-500/5 mb-8">
            <div className="flex items-start gap-3">
              <GitBranch className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-violet-300 text-sm font-medium mb-1">
                  You're creating a fork from Chapter {parentChapterNum}
                </div>
                <p className="text-slate-400 text-xs">
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
              className="w-full font-story text-3xl font-bold text-white bg-transparent border-none outline-none placeholder-slate-700 mb-6"
            />

            {/* Rich text editor */}
            <div className="glass rounded-2xl border border-white/10 overflow-hidden">
              <EditorToolbar editor={editor} />
              <div className="p-6">
                <EditorContent editor={editor} />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-t border-white/8 text-slate-600 text-xs">
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
              <div className="glass rounded-2xl p-5 border border-white/10">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-violet-400" />
                  Branch Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="branch-name-input" className="block text-xs text-slate-500 mb-2">
                      Branch name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="branch-name-input"
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      placeholder="my-alternate-ending"
                      className="w-full px-3 py-2 glass rounded-lg border border-white/10 text-slate-300 text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 font-mono transition-colors"
                    />
                    <p className="text-slate-600 text-xs mt-1.5">Lowercase, hyphens only. Like a git branch name.</p>
                  </div>
                  <div>
                    <label htmlFor="branch-desc-input" className="block text-xs text-slate-500 mb-2">
                      Branch description
                    </label>
                    <textarea
                      id="branch-desc-input"
                      rows={3}
                      placeholder="What makes your version different?"
                      className="w-full px-3 py-2 glass rounded-lg border border-white/10 text-slate-300 text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 resize-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Writing tips */}
            <div className="glass rounded-2xl p-5 border border-white/10">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Writing tips</h3>
              <ul className="space-y-2 text-xs text-slate-500">
                <li>· Aim for 800–2000 words per chapter</li>
                <li>· Start in the middle of the action</li>
                <li>· End with a hook or decision point</li>
                {isFork && <li className="text-violet-400">· Reference the fork point naturally in your prose</li>}
              </ul>
            </div>

            {/* Sign in prompt */}
            <div className="glass rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5">
              <p className="text-amber-300 text-sm font-medium mb-2">Sign in to publish</p>
              <p className="text-slate-400 text-xs mb-4">
                Your draft won't be lost. Sign in to save and publish your chapter.
              </p>
              <Link href="/auth" className="btn-primary text-sm w-full justify-center">
                Sign in to publish
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-16 flex items-center justify-center text-slate-500">Loading editor…</div>}>
      <WritePageInner />
    </Suspense>
  )
}
