-- SmartPay Reminder starter schema.
-- Run this in Supabase SQL Editor. RLS is enabled; this initial policy allows authenticated
-- users to access rows. For a multi-user/business deployment, add owner_id and owner-scoped policies.
create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  phone_number text not null,
  preferred_language text not null default 'en' check (preferred_language in ('en','hi')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0 and amount_paid <= amount),
  bill_date date not null default current_date,
  due_date date not null default (current_date + 2),
  status text not null default 'unpaid' check (status in ('unpaid','partially_paid','paid')),
  description text,
  created_at timestamptz not null default now(),
  constraint payment_status_matches_amount check (
    (status = 'paid' and amount_paid = amount)
    or (status = 'unpaid' and amount_paid = 0)
    or (status = 'partially_paid' and amount_paid > 0 and amount_paid < amount)
  )
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  channel text not null default 'dashboard',
  status text not null default 'pending' check (status in ('pending','sent','failed','cancelled')),
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_notes (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  note text not null check (length(trim(note)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists payments_due_date_idx on public.payments(due_date);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_client_id_idx on public.payments(client_id);
create index if not exists reminders_payment_id_idx on public.reminders(payment_id);

alter table public.clients enable row level security;
alter table public.payments enable row level security;
alter table public.reminders enable row level security;
alter table public.payment_notes enable row level security;

-- Starter policies: authenticated users only. Add tenant/owner isolation before opening
-- this project to multiple business accounts.
drop policy if exists "Authenticated users can manage clients" on public.clients;
create policy "Authenticated users can manage clients" on public.clients
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can manage payments" on public.payments;
create policy "Authenticated users can manage payments" on public.payments
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can manage reminders" on public.reminders;
create policy "Authenticated users can manage reminders" on public.reminders
  for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can manage payment notes" on public.payment_notes;
create policy "Authenticated users can manage payment notes" on public.payment_notes
  for all to authenticated using (true) with check (true);
