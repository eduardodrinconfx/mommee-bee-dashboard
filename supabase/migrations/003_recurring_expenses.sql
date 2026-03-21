-- ============================================================
-- MOMMEE BEE — Recurring (Fixed) Expenses
-- Run this in Supabase SQL Editor
-- ============================================================

create table if not exists recurring_expenses (
  id          bigserial primary key,
  frequency   text not null default 'Monthly',
  category    text not null,
  description text,
  amount_usd  numeric(10,2) not null,
  active      boolean default true,
  created_at  timestamptz default now()
);

alter table recurring_expenses enable row level security;
create policy "Allow all" on recurring_expenses for all using (true) with check (true);

insert into recurring_expenses (frequency, category, description, amount_usd) values
  ('Monthly', 'Platform Fees', 'Amazon',    39.99),
  ('Monthly', 'Platform Fees', 'Shopify',   39.99),
  ('Monthly', 'Subscriptions', 'Lightroom',  4.99),
  ('Monthly', 'Finanzas',      'Eduardo',  150.00),
  ('Monthly', 'Subscriptions', 'UnPromote', 29.99);
