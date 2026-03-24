-- Add day_of_month to recurring_expenses for per-expense scheduling
ALTER TABLE recurring_expenses ADD COLUMN IF NOT EXISTS day_of_month INTEGER DEFAULT 1;

-- Update Eduardo entry: rename and set to day 15
UPDATE recurring_expenses
SET description = 'Salario Eduardo', day_of_month = 15
WHERE category = 'Finanzas' AND description = 'Eduardo';
