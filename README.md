# SmartPay Reminder — starter website

A Next.js + Supabase starter for tracking clients and unpaid bills. The UI is responsive and designed to be usable on mobile browsers now, with a backend that can later serve a native app.

## Included in this starter

- Landing page and dashboard UI
- Supabase client setup
- Database schema for clients, payments, reminders, and payment notes
- Dashboard totals and unpaid-payment list (after Supabase setup)
- INR formatting and overdue detection
- Default due date: bill date + 2 days
- WhatsApp is intentionally **not integrated yet**

## Requirements

- Node.js 20.9 or newer
- npm
- A Supabase project
- VS Code (recommended)

## 1. Install dependencies

Open this folder in VS Code. In Terminal:

```bash
npm install
```

## 2. Create a Supabase project

1. Create a project at https://supabase.com.
2. Open **Project Settings → API** (or API Keys, depending on the current dashboard).
3. Copy the Project URL and publishable/anon key.
4. In the project, open **SQL Editor**.
5. Open `supabase/schema.sql`, copy all SQL, paste it into SQL Editor, and run it.

## 3. Configure environment variables

Copy `.env.example` to `.env.local`, then replace the placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Never put a Supabase service-role key in a `NEXT_PUBLIC_` variable or browser code.

## 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

## Important current limitations

This is the first project scaffold, not the complete production application. The dashboard can read data after Supabase is configured, but the client and payment CRUD pages, authentication UI, reminder scheduler, external notifications, and production-grade tenant isolation still need to be implemented.

Do not use real sensitive business records until authentication and owner-scoped Row Level Security policies are implemented. The schema's initial RLS policies restrict access to authenticated users, but all authenticated users currently share access; this is a development starter policy, not suitable for a multi-business public deployment.

## Next milestones

1. Add login/signup and owner-scoped RLS.
2. Build client creation/editing/search.
3. Build payment creation and paid/unpaid/partial-payment updates.
4. Add dashboard notification center and reminder history.
5. Add a secure daily scheduler.
6. Add WhatsApp delivery after you decide to configure it.
7. Deploy to Vercel.
