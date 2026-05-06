# StoryForge — Supabase + Vercel Setup Guide

## Step 1: Set Up Supabase

### 1a. Create a new Supabase project
1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose your organization, give it a name: `storyforge`
3. Set a strong database password (save it!) → **Create Project**
4. Wait ~2 minutes for provisioning

### 1b. Run the schema
1. In Supabase dashboard → **SQL Editor** → **New query**
2. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql)
3. Click **Run** — you should see "Success. No rows returned"

### 1c. Run the seed data
1. **SQL Editor** → **New query**
2. Paste the entire contents of [`supabase/seed.sql`](./supabase/seed.sql)
3. Click **Run** — this inserts the 2 demo stories with fork branches

### 1d. Get your API keys
1. Supabase dashboard → **Project Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxxxxxxxx.supabase.co`)
   - **anon public key** (long JWT string)

### 1e. Update your local .env
Open `.env.local` and replace the placeholders:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 1f. Enable Email Auth
1. Supabase → **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. For development, go to **Authentication** → **Settings** → disable "Confirm email" so you can test without email confirmation

---

## Step 2: Push to GitHub

```bash
# From your project directory
git init
git add .
git commit -m "feat: StoryForge MVP — initial commit"

# Create a new repo on github.com called 'storyforge'
# Then:
git remote add origin https://github.com/YOUR_USERNAME/storyforge.git
git branch -M main
git push -u origin main
```

> **Note**: `.env.local` is gitignored by default — your keys are safe.

---

## Step 3: Deploy to Vercel

### 3a. Connect your GitHub repo
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your `storyforge` GitHub repo
3. Framework preset: **Next.js** (auto-detected)
4. Click **Deploy** (it will fail — that's expected, we need to add env vars first)

### 3b. Add environment variables
1. Vercel project → **Settings** → **Environment Variables**
2. Add both variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = your supabase URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your anon key
   ```
3. Make sure both are set for **Production**, **Preview**, and **Development**

### 3c. Redeploy
1. Vercel → **Deployments** → click the failed deployment → **Redeploy**
2. Or push any commit to `main` — Vercel auto-deploys

### 3d. Your live URL
Once deployed, Vercel gives you a URL like: `https://storyforge-yourusername.vercel.app`

---

## Step 4: Wire Up Supabase Auth Redirect URLs

1. Supabase → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Site URL**: `https://storyforge-yourusername.vercel.app`
3. Add to **Redirect URLs**:
   ```
   https://storyforge-yourusername.vercel.app/**
   http://localhost:3000/**
   ```

---

## Verify Everything Works

After setup, test these URLs in order:

| URL | What to check |
|-----|--------------|
| `/` | Landing page loads with demo story in terminal explainer |
| `/explore` | Shows "The Last Signal" and "The Garden of Glass" cards |
| `/story/10000000-0000-0000-0000-000000000001` | Story page with chapters + fork branches |
| `/story/10000000-0000-0000-0000-000000000001/tree` | D3 branch tree renders with 3 colored branches |
| `/story/10000000-0000-0000-0000-000000000001/branch/20000000-0000-0000-0000-000000000001/chapter/1` | Chapter reader with "The Signal" |
| `/write?fork=true&storyId=10000000-0000-0000-0000-000000000001&chapterNum=3` | Fork editor opens |
| `/auth?mode=signup` | Sign up form |
| `/profile/aria_voss` | Author profile |

---

## Common Issues

**"relation does not exist"** → schema.sql didn't run fully. Re-run from the top.

**Stories not showing on explore** → seed.sql didn't run, or `is_published=true` wasn't set. Check the stories table in Supabase Table Editor.

**D3 tree is blank** → chapters table is empty. Verify seed ran successfully.

**Auth not working** → check Supabase redirect URLs are configured (Step 4).
