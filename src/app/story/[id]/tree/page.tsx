import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GitBranch, ArrowLeft, BookOpen } from 'lucide-react'
import { StoryBranchTree } from '@/components/StoryBranchTree'
import type { Chapter, Branch, StoryTreeNode } from '@/lib/types'
import { BRANCH_COLORS } from '@/lib/utils'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  return { title: `Story Branch Tree — StoryForge` }
}

function buildTree(chapters: Chapter[], branches: Branch[]): StoryTreeNode[] {
  const branchMap = new Map(branches.map((b) => [b.id, b]))

  // Build tree nodes from chapters
  const nodeMap = new Map<string, StoryTreeNode>()

  chapters.forEach((ch) => {
    const branch = branchMap.get(ch.branch_id)
    nodeMap.set(ch.id, {
      id: ch.id,
      name: ch.title,
      chapterId: ch.id,
      branchId: ch.branch_id,
      branchName: branch?.name || 'unknown',
      isCanon: ch.is_canon,
      authorName: (ch.author as any)?.username || 'unknown',
      authorId: ch.author_id,
      chapterNumber: ch.chapter_number,
      readCount: ch.read_count,
      children: [],
    })
  })

  // Link children to parents
  const roots: StoryTreeNode[] = []
  chapters.forEach((ch) => {
    const node = nodeMap.get(ch.id)!
    if (ch.parent_chapter_id && nodeMap.has(ch.parent_chapter_id)) {
      const parent = nodeMap.get(ch.parent_chapter_id)!
      // Avoid adding duplicate children
      if (!parent.children.find((c) => c.id === node.id)) {
        parent.children.push(node)
      }
    } else if (!ch.parent_chapter_id) {
      roots.push(node)
    }
  })

  return roots
}

export default async function StoryTreePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: story, error: storyErr } = await supabase
    .from('stories')
    .select('*, author:profiles(*)')
    .eq('id', id)
    .single()

  if (storyErr || !story) notFound()

  const { data: branches } = await supabase
    .from('branches')
    .select('*, author:profiles(*)')
    .eq('story_id', id)
    .order('is_canon', { ascending: false })

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*, author:profiles(*)')
    .eq('story_id', id)
    .order('chapter_number', { ascending: true })

  const allBranches = branches || []
  const allChapters = chapters || []

  const treeNodes = buildTree(allChapters, allBranches)

  // Legend
  const branchLegend = allBranches.map((b, i) => ({
    name: b.name,
    isCanon: b.is_canon,
    author: (b.author as any)?.username,
    color: b.is_canon ? BRANCH_COLORS[0] : BRANCH_COLORS[(i % (BRANCH_COLORS.length - 1)) + 1],
  }))

  return (
    <div className="min-h-screen pt-16 bg-paper-100">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 max-w-7xl mx-auto">
          <Link
            href={`/story/${id}`}
            className="flex items-center gap-2 text-ink-500 hover:text-ink-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to story
          </Link>
          <div className="h-4 w-px bg-black/10" />
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-violet-500" />
            <span className="text-ink-500 text-sm font-medium">Branch Tree</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="font-story text-3xl sm:text-4xl font-bold text-ink-900 mb-2">
              {story.title}
            </h1>
            <p className="text-ink-600">
              {allBranches.length} branch{allBranches.length !== 1 ? 'es' : ''} · {allChapters.length} chapters total · Click any node to read
            </p>
          </div>

          {/* Branch legend */}
          <div className="flex flex-wrap gap-3 mb-8">
            {branchLegend.map((b) => (
              <div
                key={b.name}
                className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-black/5 text-sm shadow-sm"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-ink-900 font-mono text-xs font-bold">{b.name}</span>
                {b.isCanon && (
                  <span className="text-amber-600 text-xs font-bold">(canon)</span>
                )}
                <span className="text-ink-500 text-xs font-medium">@{b.author}</span>
              </div>
            ))}
          </div>

          {/* Tree container */}
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm" style={{ minHeight: 500 }}>
            {treeNodes.length > 0 ? (
              <div className="p-6">
                <StoryBranchTree
                  nodes={treeNodes}
                  storyId={id}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-ink-400">
                <BookOpen className="w-10 h-10 mb-3 opacity-40" />
                <p className="font-medium">No chapters yet</p>
              </div>
            )}
          </div>

          {/* Help text */}
          <p className="text-ink-500 text-xs text-center mt-4 font-medium">
            Scroll to zoom · Drag to pan · Click any node to read that chapter
          </p>
        </div>
      </div>
    </div>
  )
}
