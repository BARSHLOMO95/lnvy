# 📊 Invy - Smart Invoice Management

> Automatic invoice collection from Gmail with intelligent VAT calculation

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

---

## ✨ Features

- 📧 **Gmail Integration** - Automatic invoice collection from email
- 🧮 **Smart VAT Calculation** - Israeli tax law compliant (0% for foreign suppliers)
- 📊 **Dashboard & Analytics** - Track expenses, suppliers, and VAT totals
- 📤 **Excel Import/Export** - Bulk operations with spreadsheets
- 🔐 **Multi-tenant SaaS** - Secure, isolated data per organization
- 🌐 **Hebrew First** - Built for Israeli businesses
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/BARSHLOMO95/invy.git
cd invy

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 📖 Documentation

- **[Setup Guide](SETUP.md)** - Complete setup instructions
- **[Project Summary](PROJECT_SUMMARY.md)** - Architecture & technical details
- **[Supabase Dashboard](https://supabase.com/dashboard/project/lqbkdrwgxvoxrtlexokh)** - Database management

---

## 🏗️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Database Triggers (automatic VAT calculation)
- Edge Functions (serverless)

**Deployment:**
- Vercel (recommended)
- Supabase Cloud

---

## 🧮 VAT Calculation Logic

Invy automatically calculates VAT based on supplier type:

| Supplier Type | VAT Rate | Calculation |
|---------------|----------|-------------|
| עוסק מורשה (Authorized) | 18% | Included in total |
| חברה בע"מ (Ltd Company) | 18% | Included in total |
| עוסק פטור (VAT Exempt) | **0%** | No VAT |
| ספק חו"ל (Foreign) | **0%** | No VAT |

**Example:**
- Total: ₪100 with "ספק חו\"ל" → VAT: ₪0, Before VAT: ₪100
- Total: ₪100 with "עוסק מורשה" → VAT: ₪15.25, Before VAT: ₪84.75

---

## 📊 Database Schema

```sql
invoices
├── id (UUID)
├── user_id (FK → auth.users)
├── organization_id (FK → organizations) [Coming soon]
├── supplier_name
├── document_number
├── document_date
├── total_amount
├── vat_amount (calculated automatically)
├── amount_before_vat (calculated automatically)
├── business_type (triggers VAT calculation)
└── ...
```

**Automatic triggers:**
- `calculate_vat_on_insert` - Runs on new invoice
- `calculate_vat_on_update` - Runs when total/business_type changes

---

## 🔐 Environment Variables

Required `.env` variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

Get these from: [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/_/settings/api)

---

## 🎯 Roadmap

### ✅ Completed
- [x] Core invoice CRUD operations
- [x] Automatic VAT calculation
- [x] Excel import/export
- [x] Filtering & search
- [x] Row Level Security (RLS)
- [x] External Supabase setup

### 🔄 In Progress
- [ ] Multi-tenancy (Organizations)
- [ ] Google OAuth + Gmail API
- [ ] Email scanner (Edge Function)

### 🔮 Planned
- [ ] OCR for invoice extraction
- [ ] Stripe billing integration
- [ ] Mobile app (React Native)
- [ ] API for integrations
- [ ] Advanced analytics

---

## 🤝 Contributing

This is a private project. For access requests, contact:

- **Email:** barshlomo95@gmail.com
- **GitHub:** [@BARSHLOMO95](https://github.com/BARSHLOMO95)

---

## 📄 License

Proprietary - All rights reserved

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) - Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vite](https://vitejs.dev/) - Build tool
- [Vercel](https://vercel.com/) - Deployment platform

---

Made with ❤️ in Israel 🇮🇱
