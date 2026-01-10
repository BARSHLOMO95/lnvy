# 📧 Gmail Integration Setup Guide

## Overview

This guide will help you set up Gmail integration for Invy SaaS, including:
- OAuth authentication for users
- Automatic email scanning
- AI-powered document classification with OpenAI
- Automatic invoice extraction

---

## 🏗️ What We Built

### 1. Database Schema
- ✅ `gmail_tokens` - Stores OAuth tokens per user
- ✅ `processed_emails` - Tracks processed emails to avoid duplicates
- ✅ `profiles` updates - Added Gmail connection status and document limits

### 2. Supabase Edge Functions
- ✅ `gmail-oauth-callback` - Handles OAuth flow
- ✅ `gmail-sync` - Scans emails and extracts attachments
- ✅ `classify-document` - Uses OpenAI GPT-4 Vision to classify documents

### 3. Document Classification AI
- ✅ Identifies valid invoices (חשבונית מס, קבלה)
- ✅ Rejects non-invoice documents (אישור הזמנה, חשבון עסקה, etc.)
- ✅ Extracts: supplier, amount, date, VAT, business type

---

## 🔧 Setup Steps

### Step 1: Apply Database Migrations

Run these migrations in Supabase SQL Editor:

```bash
# In Supabase Dashboard → SQL Editor → New query
```

Paste and run:
1. `/supabase/migrations/20260106140000_add_gmail_integration.sql`
2. `/supabase/migrations/20260106141000_add_document_counter.sql`

---

### Step 2: Configure Supabase Secrets

Go to: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**

Add these secrets:

```bash
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://YOUR-PROJECT-ID.supabase.co/functions/v1/gmail-oauth-callback
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
APP_URL=https://YOUR-VERCEL-URL.vercel.app
```

**Replace:**
- `YOUR-PROJECT-ID` → Your Supabase project ID (e.g., `lqbkdrwgxvoxrtlexokh`)
- `YOUR-VERCEL-URL` → Your Vercel URL (e.g., `invy-app.vercel.app`)

---

### Step 3: Deploy Edge Functions

Install Supabase CLI:
```bash
npm install -g supabase
```

Login and link project:
```bash
supabase login
supabase link --project-ref YOUR-PROJECT-ID
```

Deploy functions:
```bash
supabase functions deploy gmail-oauth-callback
supabase functions deploy gmail-sync
supabase functions deploy classify-document
```

---

### Step 4: Update Google OAuth Redirect URI

Go to: **Google Cloud Console → APIs & Credentials → OAuth 2.0 Client IDs**

Edit your client and add redirect URI:
```
https://YOUR-PROJECT-ID.supabase.co/functions/v1/gmail-oauth-callback
```

---

### Step 5: Frontend Environment Variables

Create `.env` file (copy from `.env.example`):

```bash
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

---

## 🧪 Testing

### Test OAuth Flow:
1. User clicks "Connect Gmail"
2. Redirects to Google OAuth
3. User authorizes
4. Redirects back to `/dashboard?gmail=connected`
5. Token stored in `gmail_tokens` table

### Test Email Sync:
```bash
curl -X POST https://YOUR-PROJECT-ID.supabase.co/functions/v1/gmail-sync \
  -H "Authorization: Bearer YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"USER-UUID","initial_sync":true}'
```

### Test Document Classification:
```bash
curl -X POST https://YOUR-PROJECT-ID.supabase.co/functions/v1/classify-document \
  -H "Authorization: Bearer YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"USER-UUID",
    "file_data":"BASE64-ENCODED-IMAGE",
    "file_type":"image/jpeg",
    "filename":"invoice.jpg"
  }'
```

---

## 📊 Document Limits

**Free Plan:** 5 documents/month
**Pro Plan:** 50 documents/month (₪50)

Limits are tracked in `profiles.document_count` and enforced in the classifier function.

---

## 🔄 How It Works

```
User connects Gmail
     ↓
OAuth flow completes
     ↓
Initial sync starts (1 year back)
     ↓
For each email with attachment:
     ↓
Download PDF/Image
     ↓
Send to OpenAI GPT-4 Vision
     ↓
Classify: Invoice? Yes/No
     ↓
If Yes: Extract data & insert to invoices table
If No: Log as rejected
     ↓
Continue scanning new emails automatically
```

---

## 🚀 Next Steps

1. Build frontend components:
   - Gmail connection button
   - Settings page with sync status
   - Document limit display

2. Add webhook for real-time email notifications
3. Implement WhatsApp integration
4. Add payment system (Stripe)

---

## 🆘 Troubleshooting

### "Gmail not connected" error
- Check `gmail_tokens` table has entry for user
- Verify token hasn't expired

### "Document limit reached"
- Check `profiles.document_count` vs `document_limit`
- User needs to upgrade plan

### OpenAI errors
- Verify API key is correct
- Check OpenAI account has credits
- Ensure GPT-4 Vision access is enabled

### OAuth redirect fails
- Verify redirect URI matches in both Google Console and Supabase secrets
- Check CORS settings

---

## 📝 Notes

- Tokens are stored in plaintext (consider encryption for production)
- Gmail API has rate limits (10,000 requests/day for free tier)
- OpenAI GPT-4 Vision costs ~$0.01 per image
- Consider implementing queue system for high-volume processing

---

**Need help? Check the Supabase logs and OpenAI usage dashboard.**
