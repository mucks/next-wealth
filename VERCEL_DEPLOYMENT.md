# Deploying Next Wealth to Vercel

## Prerequisites

✅ You've already connected Supabase to Vercel (Great!)
✅ Your Supabase database is set up and working locally

## Environment Variables Needed

Since you've connected Supabase to Vercel, most environment variables are **automatically set**:

✅ **Auto-set by Supabase Integration:**
1. `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase public API key  
3. `POSTGRES_URL` - Database connection string
4. `POSTGRES_PRISMA_URL` - Database connection string with pgbouncer (preferred)

**You don't need to manually add these!** The integration handles it automatically.

## Step-by-Step Deployment

### 1. Commit Your Code

Make sure all changes are committed to git (including migration files):

```bash
git add .
git commit -m "Add wealth tracking feature"
git push origin main
```

**Important**: The `drizzle/` folder contains migration files that must be committed to git!

### 2. Deploy Your App

**Database migrations now run automatically!** When you deploy to Vercel:
- ✅ Migrations run automatically during the build process
- ✅ Tables are created/updated automatically
- ✅ No manual database setup needed!

#### Option A: Deploy via Git (Recommended)

1. **Push to GitHub/GitLab/Bitbucket:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click **Import Git Repository**
   - Select your repository
   - Vercel will auto-detect Next.js settings
   - Click **Deploy**

#### Option B: Deploy via CLI

```bash
# From your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? (No if first time, Yes if updating)
# - What's your project's name? next-wealth
# - In which directory is your code located? ./
# - Want to override settings? No

# Deploy to production
vercel --prod
```

### 4. Verify Deployment

After deployment completes:

1. ✅ Visit your Vercel URL (e.g., `https://next-wealth.vercel.app`)
2. ✅ Try signing in/up
3. ✅ Add a test asset
4. ✅ Check that prices auto-refresh
5. ✅ Test import/export functionality

### 5. Configure Supabase Redirect URLs

For authentication to work properly on Vercel:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Vercel URLs to **Site URL** and **Redirect URLs**:
   - Production: `https://next-wealth.vercel.app`
   - Preview: `https://next-wealth-*.vercel.app` (use wildcard for preview deployments)

Example configuration:
```
Site URL: https://next-wealth.vercel.app
Additional Redirect URLs:
  - https://next-wealth-*.vercel.app/**
  - http://localhost:3000/**
  - http://localhost:3001/**
```

## Troubleshooting

### "Invalid login credentials" or Auth Errors

**Problem**: Authentication not working on Vercel
**Solution**: 
1. Check that Supabase redirect URLs include your Vercel domain
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
3. Check Vercel deployment logs for errors

### "Connection refused" or Database Errors

**Problem**: Can't connect to database
**Solution**:
1. Verify `DATABASE_URL` is set in Vercel environment variables
2. Make sure you're using the **Transaction pooling** connection string
3. Check that the connection string includes `?pgbouncer=true`
4. Verify your database password is correct

### "Module not found" Errors

**Problem**: Missing dependencies on Vercel
**Solution**:
1. Make sure all dependencies are in `package.json` (not just devDependencies)
2. Run `pnpm install` locally to verify
3. Commit and push `package.json` and `pnpm-lock.yaml`

### Build Fails

**Problem**: Deployment build fails
**Solution**:
1. Test build locally first: `pnpm build`
2. Fix any TypeScript errors
3. Check Vercel build logs for specific errors
4. Ensure Node.js version matches (Vercel uses Node 18+ by default)

## Auto-Deployments

Once connected to Git:

- ✅ **Push to main branch** → Auto-deploys to production
- ✅ **Open pull request** → Auto-creates preview deployment
- ✅ **Push to PR** → Auto-updates preview deployment

## Environment-Specific Builds

You can have different environment variables for:
- **Production**: Live site used by real users
- **Preview**: Temporary deployments for testing (PRs, branches)
- **Development**: Local development with Vercel CLI

## Monitoring & Analytics

After deployment, check:
1. **Vercel Dashboard** → Your project → **Analytics**
   - View page loads, unique visitors, performance
2. **Vercel Dashboard** → Your project → **Logs**
   - Real-time function logs, errors, warnings
3. **Supabase Dashboard** → **Database**
   - Monitor database usage, queries, connections

## Custom Domain (Optional)

To use your own domain:

1. Go to Vercel Dashboard → Your project → **Settings** → **Domains**
2. Add your domain (e.g., `mywealth.com`)
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs to include your custom domain

## Performance Optimizations

Your app is already optimized for Vercel with:
- ✅ **Server-side rendering** (SSR)
- ✅ **API routes** for backend logic
- ✅ **Price caching** to reduce external API calls
- ✅ **Connection pooling** for database efficiency
- ✅ **Automatic code splitting** (Next.js)

## Security Checklist

Before going live:
- ✅ Environment variables are set (not hardcoded)
- ✅ Supabase Row Level Security (RLS) is enabled
- ✅ Authentication redirect URLs are configured
- ✅ Email confirmation is enabled (Production)
- ✅ Database uses connection pooling
- ✅ No sensitive data in Git repository

## Need Help?

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Check Logs**: Vercel Dashboard → Project → Logs/Functions

---

## Database Migrations

### How Automatic Migrations Work

When you deploy to Vercel:
1. **Build starts** → Dependencies installed
2. **Next.js builds** → Your app is compiled
3. **Postbuild hook runs** → `scripts/run-migration-vercel.ts` executes
4. **Migration script**:
   - Detects it's running on Vercel
   - Connects to your Supabase database
   - Applies all SQL files in `drizzle/` folder
   - Creates/updates tables with proper RLS policies

### Adding New Tables/Columns

When you need to add new database features:

```bash
# 1. Update your schema in lib/db/schema.ts
# (add new tables or columns)

# 2. Generate migration file
pnpm db:generate

# 3. Test locally (optional)
pnpm db:push

# 4. Commit and push
git add drizzle/
git commit -m "Add new feature"
git push

# 5. Vercel automatically runs migrations on deploy!
```

### Manual Migration (Optional)

You normally don't need this since migrations run automatically on Vercel. But if you want to test migrations locally against production:

```bash
# Pull production environment variables (for local testing only)
vercel env pull .env.production.local

# Run migrations against production database from your local machine
pnpm db:push:prod
```

**Note**: `.env.production.local` is in `.gitignore` and only used for local testing. Vercel uses its own environment variables automatically.

## Quick Commands Reference

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Pull environment variables locally
vercel env pull .env.local

# Generate database migrations
pnpm db:generate

# Apply migrations locally
pnpm db:push

# Apply migrations to production manually
pnpm db:push:prod
```

Happy deploying! 🚀

