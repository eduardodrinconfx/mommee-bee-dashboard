-- Add fee and shipping columns to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS fee numeric(10,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shipping numeric(10,2) DEFAULT 0;
