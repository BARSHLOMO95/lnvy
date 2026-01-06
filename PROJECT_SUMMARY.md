# Invy - Invoice Management System

## 📊 Project Overview

**Invy** is a modern SaaS invoice management system built for Israeli businesses. The system automatically collects invoices from Gmail, extracts data using OCR, and manages VAT calculations based on Israeli tax law.

---

## 🏗️ Current Architecture

### Tech Stack

**Frontend:**
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** + **shadcn/ui** (UI components)
- **React Hook Form** + **Zod** (form validation)
- **Supabase Client** (authentication & database)

**Backend & Database:**
- **Supabase** (PostgreSQL + Authentication + Storage)
  - Project: `Invy` (lqbkdrwgxvoxrtlexokh)
  - URL: https://lqbkdrwgxvoxrtlexokh.supabase.co
- **Row Level Security (RLS)** enabled for multi-tenancy
- **Database Triggers** for automatic VAT calculation

**Hosting:**
- Currently: Lovable (tally-glow)
- Recommended: Vercel (for production SaaS)

---

## 🗄️ Database Schema

### `invoices` Table

```sql
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Invoice Data
  intake_date TIMESTAMPTZ DEFAULT now(),
  document_date DATE,
  status TEXT, -- 'חדש', 'בתהליך', 'טופל'
  supplier_name TEXT,
  document_number TEXT,
  document_type TEXT,
  category TEXT,

  -- Financial Data (calculated by trigger)
  total_amount DECIMAL(12,2),
  amount_before_vat DECIMAL(12,2),
  vat_amount DECIMAL(12,2),

  -- Business Classification
  business_type TEXT, -- 'עוסק מורשה', 'עוסק פטור', 'חברה בע"מ', 'ספק חו"ל'

  -- Metadata
  entry_method TEXT, -- 'ידני', 'דיגיטלי'
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### VAT Trigger Logic

**Automatic VAT calculation based on `business_type`:**

| Business Type | VAT Calculation |
|--------------|-----------------|
| `עוסק מורשה` (Authorized) | 18% VAT (total / 1.18) |
| `חברה בע"מ` (Ltd Company) | 18% VAT (total / 1.18) |
| `עוסק פטור` (VAT Exempt) | **0% VAT** (vat_amount = 0) |
| `ספק חו"ל` (Foreign Supplier) | **0% VAT** (vat_amount = 0) |

**Trigger function:** `calculate_vat_with_business_type()`
- Runs on INSERT and UPDATE
- Normalizes business_type variants
- Automatically calculates vat_amount and amount_before_vat

---

## 🚀 Recent Changes (VAT Migration)

### What Was Changed:

1. **Database Trigger**: Created `calculate_vat_with_business_type()` function
   - Handles business_type normalization
   - Calculates VAT based on tax rules
   - Triggers on INSERT/UPDATE when total_amount, business_type, or document_type changes

2. **Frontend**: Removed all VAT calculations
   - `useInvoices.ts`: Removed `calculateVat()` function
   - `AddInvoiceModal.tsx`: Removed VAT useEffect
   - `EditInvoiceModal.tsx`: Removed VAT useEffect
   - `ImportExcelModal.tsx`: Removed VAT calculation logic

3. **Cloud Function**: Updated `import-invoices`
   - Removed manual VAT calculation
   - Now relies on database trigger

4. **Migration to External Supabase**:
   - Moved from Lovable's managed Supabase to external project
   - Enables full SQL Editor access
   - Better control for SaaS development

---

## 📂 Project Structure

```
tally-glow/
├── src/
│   ├── components/
│   │   ├── invoice/
│   │   │   ├── AddInvoiceModal.tsx
│   │   │   ├── EditInvoiceModal.tsx
│   │   │   ├── ImportExcelModal.tsx
│   │   │   └── InvoiceList.tsx
│   │   └── ui/ (shadcn components)
│   ├── hooks/
│   │   └── useInvoices.ts
│   ├── types/
│   │   └── invoice.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   └── App.tsx
│
├── supabase/
│   ├── migrations/
│   │   ├── 20260105075731_*.sql (initial schema)
│   │   ├── 20260106065817_*.sql (basic VAT trigger)
│   │   └── 20260106120000_move_vat_logic_to_cloud_code.sql (improved VAT)
│   ├── functions/
│   │   └── import-invoices/
│   │       └── index.ts
│   └── config.toml
│
├── public/
│   └── test-vat-migration.html (test tool)
│
├── .env (environment variables)
├── package.json
└── vite.config.ts
```

---

## 🔐 Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_PROJECT_ID="lqbkdrwgxvoxrtlexokh"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxYmtkcndneHZveHJ0bGV4b2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2OTY1MDksImV4cCI6MjA4MzI3MjUwOX0.l2YG6fiVHGhw9E9t1B6TQwKllM12aQsScHqrONoO8TY"
VITE_SUPABASE_URL="https://lqbkdrwgxvoxrtlexokh.supabase.co"
```

⚠️ **Security Note:** These are PUBLIC keys (safe to commit for demo). For production, use service role keys in backend only.

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ (recommend using nvm)
- npm or yarn
- Supabase account

### Quick Start

```bash
# 1. Clone repository
git clone <YOUR_NEW_REPO_URL>
cd invy

# 2. Install dependencies
npm install

# 3. Create .env file (see Environment Variables above)
cp .env.example .env

# 4. Run database migrations
# Go to: https://supabase.com/dashboard/project/lqbkdrwgxvoxrtlexokh/sql
# Run: supabase/migrations/FULL_MIGRATION.sql

# 5. Start development server
npm run dev

# 6. Open browser
# http://localhost:8080
```

---

## 🧪 Testing VAT Trigger

After running migrations, test in Supabase SQL Editor:

```sql
-- Create test user first (in Supabase Auth UI or via signup)
-- Then test VAT calculation:

INSERT INTO public.invoices (
  user_id,
  supplier_name,
  business_type,
  total_amount,
  document_date
) VALUES (
  '<YOUR_USER_ID>',
  'Test Foreign Supplier',
  'ספק חו"ל',
  100,
  CURRENT_DATE
) RETURNING id, business_type, total_amount, vat_amount, amount_before_vat;

-- Expected result:
-- vat_amount = 0
-- amount_before_vat = 100
```

---

## 🎯 Next Steps (SaaS Roadmap)

### Phase 1: Multi-Tenancy (Week 1-2)
- [ ] Add `organizations` table
- [ ] Update `invoices` with `organization_id`
- [ ] Implement RLS for organization isolation
- [ ] Add team/user management

### Phase 2: Gmail Integration (Week 3)
- [ ] Google OAuth setup
- [ ] Gmail API integration
- [ ] Email scanner (Edge Function + Cron)
- [ ] OCR integration (OCR.space or Google Vision)

### Phase 3: Billing & Subscriptions (Week 4)
- [ ] Stripe integration
- [ ] Pricing plans (Free, Pro, Enterprise)
- [ ] Subscription management
- [ ] Usage limits

### Phase 4: Advanced Features (Week 5+)
- [ ] Export to Excel/PDF
- [ ] Advanced analytics dashboard
- [ ] API access (for Pro users)
- [ ] Webhooks for integrations
- [ ] Mobile app (React Native)

---

## 📊 Current Status

✅ **Completed:**
- Core invoice management (CRUD)
- VAT calculation (database triggers)
- External Supabase setup
- Row Level Security (RLS)
- Excel import/export
- Basic filtering & search
- Responsive UI

⏳ **In Progress:**
- Migration to new infrastructure
- SaaS preparation

🔜 **Upcoming:**
- Multi-tenancy
- Gmail integration
- Billing system

---

## 👥 Contributors

- **Bar Shlomo** (GitHub: @BARSHLOMO95)
- **Claude AI** (Development Assistant)

---

## 📄 License

Proprietary - All rights reserved

---

## 🔗 Important Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/lqbkdrwgxvoxrtlexokh
- **GitHub Repo**: https://github.com/BARSHLOMO95/tally-glow
- **Production** (TBD): Deploy to Vercel

---

## 💡 Development Notes

### Key Decisions Made:

1. **Why Supabase?**
   - Built-in auth & RLS
   - PostgreSQL (reliable, scalable)
   - Real-time subscriptions
   - Edge Functions for serverless

2. **Why Database Triggers for VAT?**
   - Single source of truth
   - Consistent across all entry points
   - Automatic, no manual calculation
   - Handles business logic correctly

3. **Why External Supabase?**
   - Full SQL Editor access
   - Better control for migrations
   - Easier SaaS development
   - Production-ready setup

---

## 🆘 Troubleshooting

### VAT not calculating correctly
- Check `calculate_vat_with_business_type()` function exists
- Verify triggers are active: `SELECT * FROM pg_trigger WHERE tgname LIKE '%vat%';`
- Test with SQL query (see Testing section)

### Can't connect to database
- Verify `.env` variables are correct
- Check Supabase project is running
- Ensure API keys are valid

### RLS errors ("permission denied")
- Make sure user is authenticated
- Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'invoices';`
- Verify user_id matches auth.uid()

---

**Last Updated:** 2026-01-06
**Version:** 1.0.0-beta
