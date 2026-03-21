-- ============================================================
-- MOMMEE BEE — Decisions + Tasks
-- Run this in Supabase SQL Editor
-- ============================================================

create table if not exists decisions (
  id          bigserial primary key,
  text        text not null,
  priority    text not null default 'Media',
  status      text not null default 'Pendiente',
  date        date default current_date,
  tasks       jsonb not null default '[]',
  created_at  timestamptz default now()
);

alter table decisions enable row level security;
create policy "Allow all" on decisions for all using (true) with check (true);
