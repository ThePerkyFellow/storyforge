'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, ArrowLeft, Lock, Unlock } from 'lucide-react'
import Link from 'next/link'

export default function SettingsForm({ story }: { story: any }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  
  const [allowAlternatives, setAllowAlternatives] = useState(story.allow_alternatives ?? true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const { error } = await supabase
        .from('stories')
        .update({ allow_alternatives: allowAlternatives })
        .eq('id', story.id)

      if (error) throw error

      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      console.error('Failed to update settings:', err)
      alert('Failed to save settings: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 border border-black/5 shadow-sm">
      <div className="mb-6">
        <Link
          href={`/story/${story.id}`}
          className="flex items-center gap-1.5 text-ink-500 hover:text-ink-900 text-sm font-medium transition-colors mb-6 inline-flex"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to story
        </Link>
        
        <h2 className="text-xl font-bold text-ink-900 mb-2">Collaboration Settings</h2>
        <p className="text-ink-600 text-sm mb-6">
          Control how other writers can interact with your story.
        </p>
      </div>

      <div className="space-y-6">
        {/* Author Lock Toggle */}
        <div className={`p-5 rounded-xl border-2 transition-colors ${allowAlternatives ? 'border-violet-100 bg-violet-50/50' : 'border-amber-100 bg-amber-50/50'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {allowAlternatives ? (
                  <Unlock className="w-5 h-5 text-violet-600" />
                ) : (
                  <Lock className="w-5 h-5 text-amber-600" />
                )}
                <h3 className="font-bold text-ink-900">Allow Alternative Paths</h3>
              </div>
              <p className="text-sm text-ink-600 leading-relaxed max-w-xl">
                {allowAlternatives 
                  ? "Your story is open. Readers can branch off from any chapter and write their own alternative endings. This encourages community engagement."
                  : "Your story is locked. Readers will only be able to read your canon timeline. They cannot write alternative paths."}
              </p>
            </div>
            
            {/* Toggle Switch */}
            <button
              onClick={() => setAllowAlternatives(!allowAlternatives)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 ${
                allowAlternatives ? 'bg-violet-600' : 'bg-ink-300'
              }`}
              role="switch"
              aria-checked={allowAlternatives}
            >
              <span className="sr-only">Allow alternatives</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  allowAlternatives ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-black/5 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${
              saved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'btn-primary'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
