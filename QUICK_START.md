# 🚀 Quick Start Guide - Drizzle Edition

## Overview

This project uses **Supabase + Drizzle ORM** for the best developer experience:
- ✅ **Supabase**: User authentication + Postgres database
- ✅ **Drizzle**: Type-safe queries + automatic table creation
- ✅ **Zero manual SQL** - Everything is automated!

---

## Setup (5 Minutes Total)

### Step 1: Create Supabase Project (3 minutes)

1. Go to https://app.supabase.com
2. Click "New project"
3. Fill in:
   - Name: "next-wealth"
   - Database password: **Save this somewhere safe!**
   - Region: Choose closest to you
4. Click "Create new project"
5. Wait ~2 minutes for setup

### Step 2: Get Your Credentials (2 minutes)

You need **3 values** from Supabase:

#### A. Project URL & Anon Key
- Settings (⚙️) → API
- Copy **Project URL**
- Copy **anon public** key

#### B. Database Connection String
- Settings (⚙️) → Database
- Scroll to **Connection string**
- Select **Transaction pooler** (NOT session pooler!)
- Copy the connection string
- Replace `[YOUR-PASSWORD]` with your database password

### Step 3: Configure .env.local

Open `.env.local` and fill in all 3 values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
DATABASE_URL=postgres://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Or visit http://localhost:3001/setup** for a copy-paste template!

### Step 4: Push Database Schema (30 seconds)

Run ONE command to create all tables automatically:

```bash
pnpm db:push
```

That's it! Drizzle reads your schema and creates:
- ✅ Assets table
- ✅ All columns
- ✅ Indexes
- ✅ Constraints

**No SQL to write. Ever.** 🎉

### Step 5: Start Using the App

```bash
pnpm dev
```

Then:
1. Open http://localhost:3001
2. Click "Sign In / Sign Up"
3. Create your account
4. Start tracking!

---

## What You Get

✅ **User Accounts** - Secure authentication via Supabase
✅ **Cloud Storage** - No more Safari clearing your data!
✅ **Multi-Device** - Same account works everywhere
✅ **Type-Safe** - Full TypeScript support
✅ **Auto Migrations** - Change schema, run `pnpm db:push`, done!

---

## Bonus Commands

### View Your Database
```bash
pnpm db:studio
```
Opens Drizzle Studio at http://local.drizzle.studio - a beautiful UI to view/edit data!

---

## Troubleshooting

**"Environment variable not found"**
- Make sure `.env.local` has all 3 variables filled in
- Restart dev server after editing .env.local

**"Connection refused" or "Connection timeout"**
- Check you're using **Transaction pooler** (port 6543), not Session pooler (port 5432)
- Verify your database password is correct in DATABASE_URL

**"Module not found" errors**
- Run `pnpm install` to ensure all packages are installed
- Clear cache: `rm -rf .next && pnpm dev`

**Schema changes not appearing?**
- Run `pnpm db:push` after changing `lib/db/schema.ts`

---

## The Drizzle Advantage

**Before (Manual SQL):**
```
❌ Write SQL → Copy → Paste in Supabase → Run → Hope it works
```

**After (Drizzle):**
```
✅ pnpm db:push
✅ Done!
```

**Future schema changes?**
1. Edit `lib/db/schema.ts`
2. Run `pnpm db:push`
3. Tables updated automatically!

No SQL knowledge required. Ever. 🚀
