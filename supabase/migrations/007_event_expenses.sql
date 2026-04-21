create table event_expenses (
  id bigint generated always as identity primary key,
  description text not null,
  total_amount numeric(10,2) not null default 0,
  paid_amount numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

alter table event_expenses enable row level security;
create policy "Allow all" on event_expenses for all using (true) with check (true);
