-- ================================================================
-- StoryForge Database Schema
-- Run this in your Supabase SQL Editor
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ================================================================
-- PROFILES (extends Supabase auth.users)
-- ================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  website text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ================================================================
-- STORIES (the root of each narrative)
-- ================================================================
create table public.stories (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  genre text,
  tags text[],
  cover_image_url text,
  is_published boolean default false,
  allow_alternatives boolean default true,
  total_reads integer default 0,
  total_forks integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.stories enable row level security;

create policy "Published stories are viewable by everyone"
  on stories for select using (is_published = true or author_id = auth.uid());

create policy "Authors can insert stories"
  on stories for insert with check (auth.uid() = author_id);

create policy "Authors can update their stories"
  on stories for update using (auth.uid() = author_id);

-- ================================================================
-- BRANCHES (named branches within a story — like git branches)
-- ================================================================
create table public.branches (
  id uuid default uuid_generate_v4() primary key,
  story_id uuid references public.stories(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  is_canon boolean default false,
  fork_from_chapter_id uuid, -- filled in after chapters table exists
  total_reads integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(story_id, name)
);

alter table public.branches enable row level security;

create policy "Branches are viewable by everyone"
  on branches for select using (true);

create policy "Authors can create branches"
  on branches for insert with check (auth.uid() = author_id);

create policy "Authors can update their branches"
  on branches for update using (auth.uid() = author_id);

-- ================================================================
-- CHAPTERS (the DAG — self-referencing tree structure)
-- ================================================================
create table public.chapters (
  id uuid default uuid_generate_v4() primary key,
  story_id uuid references public.stories(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  parent_chapter_id uuid references public.chapters(id) on delete set null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  chapter_number integer not null,
  is_canon boolean default false,
  read_count integer default 0,
  word_count integer default 0,
  is_published boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.chapters enable row level security;

create policy "Published chapters are viewable by everyone"
  on chapters for select using (is_published = true or author_id = auth.uid());

create policy "Authors can insert chapters"
  on chapters for insert with check (auth.uid() = author_id);

create policy "Authors can update their chapters"
  on chapters for update using (auth.uid() = author_id);

-- Now add the FK from branches to chapters (circular ref workaround)
alter table public.branches
  add constraint branches_fork_from_chapter_id_fkey
  foreign key (fork_from_chapter_id)
  references public.chapters(id)
  on delete set null;

-- ================================================================
-- FOLLOWS (user follows a story or branch)
-- ================================================================
create table public.follows (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  story_id uuid references public.stories(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  created_at timestamptz default now() not null,
  unique(user_id, story_id, branch_id)
);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on follows for select using (true);

create policy "Users can manage their follows"
  on follows for all using (auth.uid() = user_id);

-- ================================================================
-- REACTIONS (emoji reactions on chapters)
-- ================================================================
create type reaction_type as enum ('heart', 'fire', 'mind_blown', 'cry', 'laugh');

create table public.reactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  chapter_id uuid references public.chapters(id) on delete cascade not null,
  reaction reaction_type not null,
  created_at timestamptz default now() not null,
  unique(user_id, chapter_id, reaction)
);

alter table public.reactions enable row level security;

create policy "Reactions are viewable by everyone"
  on reactions for select using (true);

create policy "Users can manage their reactions"
  on reactions for all using (auth.uid() = user_id);

-- ================================================================
-- MERGE REQUESTS (fork author proposes PR to canon)
-- ================================================================
create type merge_status as enum ('open', 'accepted', 'rejected');

create table public.merge_requests (
  id uuid default uuid_generate_v4() primary key,
  story_id uuid references public.stories(id) on delete cascade not null,
  from_branch_id uuid references public.branches(id) on delete cascade not null,
  to_branch_id uuid references public.branches(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  status merge_status default 'open',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.merge_requests enable row level security;

create policy "Merge requests are viewable by everyone"
  on merge_requests for select using (true);

create policy "Authors can create merge requests"
  on merge_requests for insert with check (auth.uid() = author_id);

-- ================================================================
-- FUNCTIONS & TRIGGERS
-- ================================================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated before update on public.profiles
  for each row execute procedure public.handle_updated_at();
create trigger on_stories_updated before update on public.stories
  for each row execute procedure public.handle_updated_at();
create trigger on_branches_updated before update on public.branches
  for each row execute procedure public.handle_updated_at();
create trigger on_chapters_updated before update on public.chapters
  for each row execute procedure public.handle_updated_at();

-- ================================================================
-- INDEXES for performance
-- ================================================================
create index idx_chapters_story_id on public.chapters(story_id);
create index idx_chapters_branch_id on public.chapters(branch_id);
create index idx_chapters_parent_id on public.chapters(parent_chapter_id);
create index idx_branches_story_id on public.branches(story_id);
create index idx_follows_user_id on public.follows(user_id);
create index idx_follows_story_id on public.follows(story_id);
create index idx_reactions_chapter_id on public.reactions(chapter_id);
