# Navkar Auction — Setup Guide

Live electronics auction site with Google Sheet-based whitelist login, real-time bidding, and Hindi/English language support.

**Stack:** Next.js 14 · Supabase (Postgres + Realtime) · Tailwind CSS · TypeScript  
**Hosting:** Vercel (free) + Supabase Cloud (free)  
**Login:** Google Sheets whitelist — no SMS/OTP costs  
**Est. launch cost:** ₹0 (free hosting) or ~₹800 if you want a custom domain

---

## 1. Supabase setup (10 min)

1. Go to [supabase.com](https://supabase.com) → New project → note your **Project URL** and **API keys**.
2. Open **SQL Editor** → paste entire contents of `supabase/schema.sql` → Run.
3. Go to **Database → Replication** → enable the `items` table for Realtime (so bid updates push live to all clients).

---

## 2. Google Sheet whitelist setup

1. Create a Google Sheet with Column A = **Email** and Column B = **Phone Number**.
2. Add authorized bidders' contact info as you collect them.
3. Share the sheet as "Anyone with the link can view".
4. Use the CSV export URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv`

> **How it works:** When a user logs in, the server fetches the sheet, checks all cells across all columns, and allows login only if their email/phone is found. The `+91` prefix is stripped automatically.

---

## 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SESSION_SECRET=<output of: openssl rand -base64 32>
GOOGLE_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv
ADMIN_PHONE=+919602368928
ADMIN_EMAIL=your_admin_email@example.com
```

---

## 4. Local development

```bash
cd auction-site
pnpm install
pnpm dev
# Open http://localhost:3000
```

---

## 5. Deploy to Vercel (free)

1. Push to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) → import your repo.
3. Add all env vars from `.env.local` in **Environment Variables** settings.
4. Deploy — Vercel auto-detects Next.js. Region is set to `bom1` (Mumbai) in `vercel.json`.

---

## 6. Importing items

**Option A — Admin UI (one at a time):**
1. Login as admin → `/admin` → "Add Item" form.

**Option B — Excel bulk import:**
1. Prepare an Excel file with columns: `name`, `starting_price`, `description`, `category`, `min_increment`, `image_url`
2. Login as admin → `/admin` → "Import Excel" button → upload file → review → Import.

---

## 7. Running the auction

1. **Import items** (see above).
2. Go to `/admin` → **Settings** tab → set **Auction End Date/Time**.
3. Click **"Go Live"** — buyers can now place bids.
4. Share the site URL / QR code with shop owners.
5. At end time, server automatically rejects new bids.
6. Click **"Close Auction (Final)"** to lock all items.
7. Go to **Winners** tab → Export CSV → contact winners.

---

## 8. Privacy guarantee

Buyer identity (name + phone/email) is protected:

- `bids` table: buyers see only the `public_bids` view (amount + anonymous handle).
- Full contact info is only visible in the Admin dashboard.
- Even if a buyer inspects network traffic, they will only see anonymized data.

---

## 9. File structure

```
auction-site/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Catalog homepage
│   │   ├── items/[id]/page.tsx   # Item detail + bid
│   │   ├── login/page.tsx        # Whitelist login
│   │   ├── my-bids/page.tsx      # Buyer's bid history
│   │   ├── admin/page.tsx        # Admin dashboard
│   │   ├── admin/import/page.tsx # Excel import
│   │   └── api/                  # All API route handlers
│   ├── lib/
│   │   ├── supabase.ts           # DB clients (browser + service)
│   │   ├── auth.ts               # JWT session helpers
│   │   ├── session-secret.ts     # Session secret management
│   │   └── i18n.tsx              # English/Hindi translations
│   ├── components/               # Shared React components
│   └── types/index.ts            # TypeScript types
└── supabase/schema.sql           # Full DB schema + RLS + functions
```

---

## 10. Cost estimate

| Service | Cost |
|---|---|
| Vercel (hobby) | ₹0 |
| Supabase (free tier) | ₹0 |
| Domain (.in or .com) | ~₹800/year (optional) |
| **Total to launch** | **₹0** |
