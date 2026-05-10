import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import SettingsForm from './SettingsForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Story Settings — StoryForge',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StorySettingsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth?mode=signin')
  }

  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single()

  if (!story || story.author_id !== session.user.id) {
    notFound()
  }

  return (
    <div className="min-h-screen pt-16 bg-paper-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-story text-3xl font-bold text-ink-900 mb-8">Story Settings</h1>
        <SettingsForm story={story} />
      </div>
    </div>
  )
}
