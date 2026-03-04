-- ============================================================
-- MOMMEE BEE — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- PRODUCTS
create table if not exists products (
  id            bigserial primary key,
  code          text not null unique,
  supplier_code text,
  name          text not null,
  category      text,
  unit          text default 'Piece',
  cost          numeric(10,2) default 0,
  price_detal   numeric(10,2) default 0,
  price_mayor   numeric(10,2) default 0,
  stock         integer default 0,
  min_stock     integer default 0,
  min_mayor     integer default 1,
  supplier      text,
  origin        text,
  status        text default 'Active',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- CLIENTS
create table if not exists clients (
  id           bigserial primary key,
  name         text not null,
  phone        text,
  email        text,
  vz_state     text,
  tipo         text default 'Retail',
  status       text default 'Active',
  credit_limit numeric(10,2) default 0,
  credit_days  integer default 0,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- SALES
create table if not exists sales (
  id             bigserial primary key,
  date           date default current_date,
  client_id      bigint references clients(id),
  customer_name  text,
  platform       text not null,
  payment_method text not null,
  payment_status text default 'Paid',
  sale_type      text default 'Retail',
  vz_state       text,
  notes          text,
  total_usd      numeric(10,2) default 0,
  created_at     timestamptz default now()
);

-- SALE_ITEMS
create table if not exists sale_items (
  id           bigserial primary key,
  sale_id      bigint not null references sales(id) on delete cascade,
  product_id   bigint references products(id),
  product_code text not null,
  product_name text not null,
  quantity     integer default 1,
  unit_price   numeric(10,2) not null,
  subtotal     numeric(10,2) generated always as (quantity * unit_price) stored
);

-- IMPORTS
create table if not exists imports (
  id             bigserial primary key,
  date           date default current_date,
  supplier       text,
  invoice_number text,
  origin         text,
  freight_cost   numeric(10,2) default 0,
  taxes          numeric(10,2) default 0,
  total_cost     numeric(10,2) default 0,
  status         text default 'Ordered',
  notes          text,
  created_at     timestamptz default now()
);

-- IMPORT_ITEMS
create table if not exists import_items (
  id           bigserial primary key,
  import_id    bigint not null references imports(id) on delete cascade,
  product_id   bigint references products(id),
  product_code text not null,
  product_name text not null,
  quantity     integer default 1,
  unit_cost    numeric(10,2) not null,
  unit_price   numeric(10,2) default 0,
  shipping_fee numeric(10,2) default 0,
  subtotal     numeric(10,2) generated always as (quantity * unit_cost) stored
);

-- EXPENSES
create table if not exists expenses (
  id          bigserial primary key,
  date        date default current_date,
  category    text not null,
  description text,
  amount_usd  numeric(10,2) not null,
  created_at  timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (open for development)
-- ============================================================
alter table products     enable row level security;
alter table clients      enable row level security;
alter table sales        enable row level security;
alter table sale_items   enable row level security;
alter table imports      enable row level security;
alter table import_items enable row level security;
alter table expenses     enable row level security;

create policy "Allow all" on products     for all using (true) with check (true);
create policy "Allow all" on clients      for all using (true) with check (true);
create policy "Allow all" on sales        for all using (true) with check (true);
create policy "Allow all" on sale_items   for all using (true) with check (true);
create policy "Allow all" on imports      for all using (true) with check (true);
create policy "Allow all" on import_items for all using (true) with check (true);
create policy "Allow all" on expenses     for all using (true) with check (true);

-- ============================================================
-- SEED DATA — Sample Products for Mommee Bee
-- ============================================================
insert into products (code, name, category, unit, cost, price_detal, price_mayor, stock, min_stock, min_mayor, supplier, origin, status) values
  ('MB-001', 'Organic Cotton Onesie', 'Clothing', 'Piece', 5.00, 18.00, 14.00, 50, 10, 6, 'Local Artisan', 'Local', 'Active'),
  ('MB-002', 'Floral Romper Set', 'Clothing', 'Piece', 9.00, 28.00, 22.00, 35, 8, 6, 'China Direct', 'China', 'Active'),
  ('MB-003', 'Sleep Sack 0-6m', 'Clothing', 'Piece', 8.00, 25.00, 20.00, 40, 10, 6, 'China Direct', 'China', 'Active'),
  ('MB-004', 'Knit Headband Set 3pc', 'Accessories', 'Set', 4.00, 15.00, 12.00, 60, 15, 10, 'Local Artisan', 'Local', 'Active'),
  ('MB-005', 'Bamboo Bib Set 5pc', 'Accessories', 'Set', 6.00, 20.00, 16.00, 45, 10, 6, 'China Direct', 'China', 'Active'),
  ('MB-006', 'Silicone Teether Set', 'Accessories', 'Set', 5.00, 16.00, 13.00, 30, 8, 6, 'China Direct', 'China', 'Active'),
  ('MB-007', 'Muslin Swaddle Blanket', 'Nursery', 'Piece', 8.00, 25.00, 20.00, 25, 8, 6, 'US Supplier', 'USA', 'Active'),
  ('MB-008', 'Crib Mobile Boho', 'Nursery', 'Piece', 15.00, 45.00, 38.00, 12, 4, 2, 'Local Artisan', 'Local', 'Active'),
  ('MB-009', 'Baby Wash & Lotion Kit', 'Care', 'Kit', 10.00, 32.00, 26.00, 20, 6, 4, 'US Supplier', 'USA', 'Active'),
  ('MB-010', 'Organic Diaper Balm', 'Care', 'Unit', 6.00, 18.00, 14.00, 35, 10, 6, 'Local Artisan', 'Local', 'Active'),
  ('MB-011', 'New Baby Gift Set Deluxe', 'Gift Sets', 'Set', 28.00, 79.00, 65.00, 15, 4, 2, 'Local Artisan', 'Local', 'Active'),
  ('MB-012', 'Mini Gift Box (3 items)', 'Gift Sets', 'Set', 16.00, 48.00, 40.00, 20, 5, 3, 'Local Artisan', 'Local', 'Active')
on conflict (code) do nothing;
