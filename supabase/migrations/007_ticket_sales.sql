-- ============================================================
-- MOMMEE BEE — Ticket Sales (Ventas de Entradas) Table
-- Paste this in Supabase SQL Editor and Run
-- ============================================================

create table if not exists ticket_sales (
  id uuid primary key default gen_random_uuid(),
  buyer text not null,
  quantity integer not null default 1,
  price_usd numeric(10,2) not null default 0,
  date date not null default current_date,
  created_at timestamptz default now()
);

alter table ticket_sales enable row level security;
create policy "Allow all" on ticket_sales for all using (true) with check (true);
