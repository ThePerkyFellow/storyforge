-- ================================================================
-- StoryForge: Fix public read policies
-- Run this in Supabase SQL Editor to fix the chapter 404 issue
-- ================================================================

-- Drop the restrictive policies and replace with open SELECT for published content
drop policy if exists "Published chapters are viewable by everyone" on public.chapters;
drop policy if exists "Published stories are viewable by everyone" on public.stories;
drop policy if exists "Branches are viewable by everyone" on public.branches;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

-- Open SELECT policies — any anon user can read public content
create policy "Anyone can read published chapters"
  on public.chapters for select using (is_published = true);

create policy "Anyone can read published stories"
  on public.stories for select using (is_published = true);

create policy "Anyone can read branches"
  on public.branches for select using (true);

create policy "Anyone can read profiles"
  on public.profiles for select using (true);

-- Verify the chapters are published (in case the default wasn't applied)
update public.chapters set is_published = true where is_published is null or is_published = false;
update public.stories set is_published = true where id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002'
);
