export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  website: string | null
  created_at: string
  updated_at: string
}

export interface Story {
  id: string
  author_id: string
  title: string
  description: string | null
  genre: string | null
  tags: string[] | null
  cover_image_url: string | null
  is_published: boolean
  total_reads: number
  total_forks: number
  created_at: string
  updated_at: string
  // Joined fields
  author?: Profile
  branches?: Branch[]
}

export interface Branch {
  id: string
  story_id: string
  author_id: string
  name: string
  description: string | null
  is_canon: boolean
  fork_from_chapter_id: string | null
  total_reads: number
  created_at: string
  updated_at: string
  // Joined fields
  author?: Profile
  chapters?: Chapter[]
  fork_from_chapter?: Chapter
}

export interface Chapter {
  id: string
  story_id: string
  branch_id: string
  parent_chapter_id: string | null
  author_id: string
  title: string
  content: string
  chapter_number: number
  is_canon: boolean
  read_count: number
  word_count: number
  is_published: boolean
  created_at: string
  updated_at: string
  // Joined fields
  author?: Profile
  branch?: Branch
  children?: Chapter[]
}

export interface Reaction {
  id: string
  user_id: string
  chapter_id: string
  reaction: 'heart' | 'fire' | 'mind_blown' | 'cry' | 'laugh'
  created_at: string
}

export interface MergeRequest {
  id: string
  story_id: string
  from_branch_id: string
  to_branch_id: string
  author_id: string
  title: string
  description: string | null
  status: 'open' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

// Tree node for D3 visualization
export interface StoryTreeNode {
  id: string
  name: string
  chapterId: string
  branchId: string
  branchName: string
  isCanon: boolean
  authorName: string
  authorId: string
  chapterNumber: number
  readCount: number
  children: StoryTreeNode[]
  depth?: number
  x?: number
  y?: number
}
