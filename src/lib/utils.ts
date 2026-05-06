import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatReadCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function estimateReadTime(wordCount: number): string {
  const wordsPerMinute = 250
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min read`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Genre colors for badges
export const GENRE_COLORS: Record<string, { bg: string; text: string }> = {
  'Science Fiction': { bg: 'bg-blue-500/20', text: 'text-blue-300' },
  Fantasy: { bg: 'bg-violet-500/20', text: 'text-violet-300' },
  Romance: { bg: 'bg-pink-500/20', text: 'text-pink-300' },
  Thriller: { bg: 'bg-red-500/20', text: 'text-red-300' },
  Mystery: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  Horror: { bg: 'bg-orange-500/20', text: 'text-orange-300' },
  Drama: { bg: 'bg-teal-500/20', text: 'text-teal-300' },
  Adventure: { bg: 'bg-green-500/20', text: 'text-green-300' },
}

export const BRANCH_COLORS = [
  '#f59e0b', // amber - canon
  '#8b5cf6', // violet - fork 1
  '#06b6d4', // cyan - fork 2
  '#10b981', // emerald - fork 3
  '#f43f5e', // rose - fork 4
  '#3b82f6', // blue - fork 5
]
