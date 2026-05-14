-- ============================================================
-- MOMMEE BEE — Sponsors Table
-- Paste this in Supabase SQL Editor and Run
-- ============================================================

create table if not exists sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount_usd numeric(10,2) not null default 0,
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table sponsors enable row level security;
create policy "Allow all" on sponsors for all using (true) with check (true);
