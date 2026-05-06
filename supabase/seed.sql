-- ================================================================
-- StoryForge Seed Data
-- Run this AFTER schema.sql in your Supabase SQL Editor
-- Creates demo stories with visible fork branches for the demo
-- ================================================================

-- ----------------------------------------------------------------
-- Step 1: Create demo users in auth.users first
-- (profiles.id is a FK to auth.users.id)
-- ----------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, confirmation_token, recovery_token,
  email_change_token_new, email_change
) values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'aria@storyforge.dev',
    '$2a$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456',
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"aria_voss","full_name":"Aria Voss"}',
    false, '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'dex@storyforge.dev',
    '$2a$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456',
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"dex_morlan","full_name":"Dex Morlan"}',
    false, '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'luna@storyforge.dev',
    '$2a$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456',
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"luna_writes","full_name":"Luna Writes"}',
    false, '', '', '', ''
  );

-- ----------------------------------------------------------------
-- Step 2: Insert demo profiles (now auth.users rows exist)
-- ----------------------------------------------------------------
insert into public.profiles (id, username, display_name, bio, avatar_url) values
  ('00000000-0000-0000-0000-000000000001', 'aria_voss', 'Aria Voss', 'Fantasy & sci-fi author. Lover of unexpected plot twists.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=aria'),
  ('00000000-0000-0000-0000-000000000002', 'dex_morlan', 'Dex Morlan', 'Writing my way through parallel universes, one fork at a time.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=dex'),
  ('00000000-0000-0000-0000-000000000003', 'luna_writes', 'Luna Writes', 'Dark romance and thriller. I give characters no mercy.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=luna')
on conflict (id) do nothing;

-- ================================================================
-- STORY 1: "The Last Signal" (Sci-Fi)
-- ================================================================
insert into public.stories (id, author_id, title, description, genre, tags, is_published, total_reads, total_forks) values
  ('10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'The Last Signal',
   'When Earth receives a signal from a dead star, astrophysicist Dr. Kira Nolan discovers it contains a warning — one that was sent 4,000 years ago. But who sent it, and are they still out there?',
   'Science Fiction',
   array['space', 'mystery', 'first-contact', 'thriller'],
   true, 1842, 3);

-- Branches for Story 1
insert into public.branches (id, story_id, author_id, name, description, is_canon, total_reads) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'canon', 'The original story by Aria Voss', true, 1200),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'dex-they-survived', 'What if the senders are still alive and watching?', false, 420),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'luna-dark-ending', 'The warning was not meant as a help — it was a threat.', false, 222);

-- Canon chapters for Story 1
insert into public.chapters (id, story_id, branch_id, parent_chapter_id, author_id, title, content, chapter_number, is_canon, read_count, word_count) values
  ('30000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   null,
   '00000000-0000-0000-0000-000000000001',
   'The Signal',
   'The radio telescope array stretched across the New Mexico desert like the fingers of a buried giant. Dr. Kira Nolan had been stationed at the Farpoint Observatory for three years, cataloguing noise from dead stars, when the anomaly appeared.

It was 3:17 AM when the alert tone pierced the control room silence. Kira jolted upright from her half-sleep, knocking over a cold coffee. On the monitor, a waveform pulsed with impossible regularity — not the chaotic static of a pulsar, not the rhythmic sweep of a neutron star. This was structured. Mathematical.

"No," she whispered, pulling her glasses on. "That can''t be right."

She ran the verification sequence four times. Each time, the same result: the signal originated from Kepler-452, a star system 1,400 light-years away. And it had been dead for 600 years.

She picked up the phone. Her hands were shaking.',
   1, true, 890, 187),

  ('30000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   'The Translation',
   'Dr. Yuen arrived at 5 AM, still wearing pajama pants under his coat. The linguistics team from SETI joined via video call within the hour. By sunrise, eight of the world''s best mathematical linguists were staring at the same waveform.

"It''s base-12," said Dr. Yuen, tracing the pattern on the screen. "Base-12 mathematics. Whoever sent this — they had twelve fingers, or twelve moons, or twelve of something fundamental to them."

"Can we decode it?" Kira asked.

"Already started." He pointed to a secondary monitor where symbols were resolving into patterns. "Give me six hours."

He gave them three. The message, when it finally rendered into something resembling human language, was seven words:

DO NOT LOOK FOR US. WE ARE COMING.

Nobody spoke for a very long time.',
   2, true, 760, 195),

  ('30000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'The Decision',
   'The President''s briefing lasted forty minutes. Kira sat at the far end of the table, the only scientist in a room full of generals and intelligence directors. She felt like a tourist who''d accidentally wandered into the wrong embassy.

"We have two options," the National Security Advisor said, clicking to a slide that showed two red arrows on a star map. "We go dark — shut down all outward-facing signals, pretend we never received it. Or we respond."

"If we go dark," Kira said, "and they already know where we are — we''ve accomplished nothing except looking guilty."

"And if we respond," said the general to her right, "we confirm our location and potentially accelerate whatever timeline they''re already on."

The room fell silent. Every face turned to the President.

Kira looked out the window at the Washington skyline. Somewhere above the monuments and the smog, 1,400 light-years of empty space separated them from whoever had sent those seven words.

She wondered if they were looking back.',
   3, true, 612, 201);

-- Dex's fork (diverges from chapter 3)
insert into public.chapters (id, story_id, branch_id, parent_chapter_id, author_id, title, content, chapter_number, is_canon, read_count, word_count) values
  ('30000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000002',
   '30000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000002',
   'The Other Signal (Dex''s Fork)',
   'The translation team had gotten it wrong. Kira realized this at 2 AM on the third day, staring at the raw waveform data. The base-12 pattern wasn''t a warning sequence — it was a response protocol.

They had already been talking to us.

She scrolled back through forty years of SETI archive data, cross-referencing the waveform signature. There it was: 1987, 2003, 2019. Every sixteen years, the same sender. And buried in the Farpoint Observatory logs from 2003, someone had marked one file as "corrupted and discarded."

It was a reply. A human reply. Someone had responded in 2003, and nobody had been told.

Kira''s phone buzzed. Unknown number.

"Dr. Nolan," said the voice on the other end. It was calm, professional. "Please don''t share what you just found. We''ve been managing this conversation for a very long time. We need to finish it ourselves."

She looked at the call log. The number traced to a government exchange.

A department that, according to every public record, did not exist.',
   3, false, 420, 218);

-- Luna's fork (diverges from chapter 3, darker)
insert into public.chapters (id, story_id, branch_id, parent_chapter_id, author_id, title, content, chapter_number, is_canon, read_count, word_count) values
  ('30000000-0000-0000-0000-000000000005',
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000003',
   '30000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000003',
   'What Comes Before (Luna''s Fork)',
   'The message was incomplete.

Kira understood this the moment she saw the spectral analysis. The signal wasn''t seven words — it was the end of a much longer transmission. They had caught the tail end of something that had been broadcasting for decades. Maybe centuries. The seven words were not an opening statement.

They were a conclusion.

She started working backwards. If the message ended with DO NOT LOOK FOR US. WE ARE COMING, what was the beginning?

It took her eleven days, three universities, and one very illegal access to a classified satellite array to reconstruct it. When she finally rendered the full transmission, she sat very still in her chair for a long time.

The message began: We were here before you. We made you. We are sorry for what you have become.

Outside the observatory window, the stars looked exactly the same as they always had.

Kira turned off all the lights and sat in the dark.',
   3, false, 222, 198);

-- Update branch fork_from_chapter_id references
update public.branches set fork_from_chapter_id = '30000000-0000-0000-0000-000000000002' where id = '20000000-0000-0000-0000-000000000002';
update public.branches set fork_from_chapter_id = '30000000-0000-0000-0000-000000000002' where id = '20000000-0000-0000-0000-000000000003';

-- ================================================================
-- STORY 2: "The Garden of Glass" (Fantasy)
-- ================================================================
insert into public.stories (id, author_id, title, description, genre, tags, is_published, total_reads, total_forks) values
  ('10000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000002',
   'The Garden of Glass',
   'In a kingdom where memories can be harvested and sold, orphan thief Sable steals the wrong memory — and suddenly knows the secret that the crown has been burying for a hundred years.',
   'Fantasy',
   array['magic', 'heist', 'royalty', 'mystery'],
   true, 2341, 2);

insert into public.branches (id, story_id, author_id, name, description, is_canon, total_reads) values
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'canon', 'The original story by Dex Morlan', true, 1800),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'aria-sable-revenge', 'What if Sable uses the secret as leverage instead of exposing it?', false, 541);

insert into public.chapters (id, story_id, branch_id, parent_chapter_id, author_id, title, content, chapter_number, is_canon, read_count, word_count) values
  ('30000000-0000-0000-0000-000000000006',
   '10000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000004',
   null,
   '00000000-0000-0000-0000-000000000002',
   'The Harvest Market',
   'Memory had a smell. Sable had learned this early — the faint copper tang that clung to the glass vials in the Harvest Market, each one stoppered with wax the colour of old wounds. The vendors called them "echoes." The buyers called them "experiences." The law called them property.

Sable called them inventory.

She moved through the stalls with practiced ease, fingers light as falling leaves. An elderly merchant dozed behind a display of childhood memories — summer afternoons, the smell of rain on stone, a grandmother''s hands kneading bread. These sold cheap. Common experiences, easily replicated.

What sold expensive were the rare ones. Falling in love for the first time. The precise moment of a great discovery. The last conversation with someone who was gone.

She was reaching for a vial labeled "First flight — genuine, pre-verified" when her fingers closed around something cold and entirely wrong. The vial was black glass. No label. A tiny crown etched into the wax seal.

She should have put it back. She knew she should have put it back.

She pocketed it instead.',
   1, true, 1100, 223),

  ('30000000-0000-0000-0000-000000000007',
   '10000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000004',
   '30000000-0000-0000-0000-000000000006',
   '00000000-0000-0000-0000-000000000002',
   'What the Crown Buried',
   'The memory hit her like cold water.

She was in a throne room — not her body, someone else''s. A woman in ceremonial armor. The king was younger, his face unguarded with panic. And there was a child on the floor, no older than four, with silver hair and eyes like fractured mirrors.

"She cannot be allowed to remember," the king was saying. "She cannot be allowed to remember who she is."

"Your Majesty." The woman whose memory this was — Sable could feel the horror rising in her chest like floodwater. "She is your daughter. She is the heir."

"She is a weapon," the king said quietly. "And weapons do not have dynasties."

The memory ended.

Sable sat in her attic room for a long time, turning the black vial over in her hands. Then she looked in the cracked mirror on her wall.

Silver hair. Eyes like fractured mirrors.

She''d always assumed she was just another orphan.',
   2, true, 980, 211);

insert into public.chapters (id, story_id, branch_id, parent_chapter_id, author_id, title, content, chapter_number, is_canon, read_count, word_count) values
  ('30000000-0000-0000-0000-000000000008',
   '10000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000005',
   '30000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0000-000000000001',
   'The Price of a Secret (Aria''s Fork)',
   'Sable didn''t go to the rebellion. She didn''t go to the press. She didn''t go anywhere near the palace guard or the revolutionary pamphlets that had started appearing on the city''s lampposts.

She went to the Memory Exchange.

The broker was a small man with ink-stained fingers who dealt exclusively in information that other people wanted to disappear. She laid the black vial on his desk.

"I know what this is," she said. "I want to know what it''s worth."

He didn''t touch it. He didn''t even look at it. He looked at her — really looked at her — and she watched the colour drain from his face with a satisfaction she hadn''t expected.

"Where did you get that?"

"Harvest Market. Stall seven. But that''s not your question." She leaned forward. "Your question is: who else knows I have it?"

"And?"

She smiled. It was not a kind smile. She had not had a kind life.

"No one. Yet."',
   3, false, 541, 192);

update public.branches set fork_from_chapter_id = '30000000-0000-0000-0000-000000000007' where id = '20000000-0000-0000-0000-000000000005';
