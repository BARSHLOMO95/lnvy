# 🚀 Invy - Setup Guide for New GitHub Project

## 📋 Pre-Setup Checklist

Before creating your new GitHub project, make sure you have:

- [x] Supabase project "Invy" created (lqbkdrwgxvoxrtlexokh)
- [x] Database migrations run successfully
- [x] VAT trigger tested and working
- [ ] New GitHub repository created
- [ ] Deployment platform chosen (Vercel recommended)

---

## 🆕 Creating New GitHub Repository

### Step 1: Create Repository on GitHub

1. Go to https://github.com/new
2. **Repository name**: `invy` (or `tally-glow-v2`)
3. **Description**: "SaaS Invoice Management System - Automatic Gmail integration & VAT calculation"
4. **Visibility**: Private (for now)
5. **Initialize**: ❌ Don't add README, .gitignore, or license (we have them)
6. Click **"Create repository"**

---

## 📦 Step 2: Push Existing Code to New Repo

### Option A: Start Fresh (Recommended)

```bash
# Navigate to project
cd /home/user/tally-glow

# Remove old git history
rm -rf .git

# Initialize new repository
git init
git add .
git commit -m "Initial commit: Invy SaaS Invoice Management System

Features:
- React + TypeScript + Vite
- Supabase (PostgreSQL + Auth)
- Automatic VAT calculation (database triggers)
- Excel import/export
- Row Level Security (RLS)
- shadcn/ui components

Database: External Supabase (Invy)
Status: Production-ready core, SaaS features in progress
"

# Add new remote (replace with your new repo URL)
git remote add origin https://github.com/BARSHLOMO95/invy.git

# Push to new repository
git branch -M main
git push -u origin main
```

### Option B: Keep Git History

```bash
cd /home/user/tally-glow

# Add new remote
git remote add new-origin https://github.com/BARSHLOMO95/invy.git

# Push to new remote
git push new-origin claude/move-vat-to-cloud-code-TMN1E:main

# Optional: remove old remote
git remote remove origin
git remote rename new-origin origin
```

---

## 🔐 Step 3: Setup Environment Variables

### For Local Development

Already done! `.env` file exists with:

```env
VITE_SUPABASE_PROJECT_ID="lqbkdrwgxvoxrtlexokh"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://lqbkdrwgxvoxrtlexokh.supabase.co"
```

⚠️ **Note:** `.env` is in `.gitignore` (not committed to repo)

### For Vercel (Production)

When deploying to Vercel:

1. Go to: https://vercel.com/new
2. Import your GitHub repo (`invy`)
3. Add Environment Variables:
   - `VITE_SUPABASE_PROJECT_ID` = `lqbkdrwgxvoxrtlexokh`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxYmtkcndneHZveHJ0bGV4b2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTY1MDksImV4cCI6MjA4MzI3MjUwOX0.l2YG6fiVHGhw9E9t1B6TQwKllM12aQsScHqrONoO8TY`
   - `VITE_SUPABASE_URL` = `https://lqbkdrwgxvoxrtlexokh.supabase.co`

4. Click **Deploy**

---

## 🗄️ Step 4: Verify Database Setup

### Check Migrations in Supabase

1. Go to: https://supabase.com/dashboard/project/lqbkdrwgxvoxrtlexokh
2. Navigate to **SQL Editor**
3. Run verification query:

```sql
-- Check if invoices table exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'invoices'
ORDER BY ordinal_position;

-- Check if VAT trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'invoices'
AND trigger_name LIKE '%vat%';

-- Check if function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%vat%'
AND routine_schema = 'public';
```

**Expected output:**
- ✅ Table `invoices` with all columns
- ✅ Trigger `calculate_vat_on_insert`
- ✅ Trigger `calculate_vat_on_update`
- ✅ Function `calculate_vat_with_business_type`

### If Missing - Run Full Migration

If any are missing, run the full migration:

```bash
# In Supabase SQL Editor, paste and run:
# File: supabase/migrations/FULL_MIGRATION.sql
# (Created earlier - contains all 8 migrations combined)
```

---

## 🧪 Step 5: Test Everything Works

### 1. Test Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser: http://localhost:8080

# Test flow:
# 1. Sign up with new email
# 2. Add invoice with business_type = "ספק חו\"ל"
# 3. Check vat_amount = 0 in Supabase Table Editor
```

### 2. Test in Production (after Vercel deploy)

```bash
# Visit your Vercel URL (e.g., invy.vercel.app)
# Repeat same test flow
```

---

## 📊 Step 6: GitHub Repository Settings

### Recommended Settings:

1. **Branch Protection** (Settings → Branches):
   - Protect `main` branch
   - Require pull request reviews
   - Require status checks to pass

2. **Repository Topics** (Add tags for discoverability):
   - `react`
   - `typescript`
   - `supabase`
   - `invoice-management`
   - `saas`
   - `vite`

3. **About Section**:
   - Description: "SaaS Invoice Management System with automatic Gmail integration"
   - Website: Your Vercel URL
   - Topics: (as above)

---

## 🔗 Step 7: Update README.md

The repository includes `PROJECT_SUMMARY.md` with full documentation.

Create user-facing `README.md`:

```bash
# Rename PROJECT_SUMMARY.md to README.md
mv PROJECT_SUMMARY.md README.md

# Or keep both - PROJECT_SUMMARY for developers, README for users
```

---

## 🎯 Next Steps After Setup

### Immediate (Week 1):

- [ ] Deploy to Vercel
- [ ] Test production deployment
- [ ] Setup custom domain (optional)
- [ ] Create issues for SaaS features

### Short-term (Week 2-4):

- [ ] Implement multi-tenancy (organizations)
- [ ] Add Google OAuth for Gmail
- [ ] Build email scanner (Edge Function)
- [ ] Integrate Stripe for billing

### Long-term (Month 2+):

- [ ] Mobile app (React Native)
- [ ] API for integrations
- [ ] Advanced analytics
- [ ] White-label option

---

## 🆘 Troubleshooting

### Issue: Can't push to new repo

```bash
# Generate SSH key if needed
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub: Settings → SSH and GPG keys

# Or use HTTPS with Personal Access Token
git remote set-url origin https://github.com/BARSHLOMO95/invy.git
```

### Issue: Database connection fails

- Check `.env` file exists and has correct values
- Verify Supabase project is active
- Check network/firewall settings

### Issue: Migrations fail

- Drop all tables and run full migration again
- Check for syntax errors in SQL
- Verify you're running in correct Supabase project

---

## 📞 Need Help?

If you encounter issues:

1. Check `PROJECT_SUMMARY.md` troubleshooting section
2. Review Supabase logs: Dashboard → Logs
3. Check browser console for errors
4. Verify all environment variables are set

---

**Setup Complete! 🎉**

You now have:
- ✅ New GitHub repository
- ✅ Working database with VAT triggers
- ✅ Production-ready code
- ✅ Deployment ready (Vercel)

**Next:** Start building SaaS features! 🚀
