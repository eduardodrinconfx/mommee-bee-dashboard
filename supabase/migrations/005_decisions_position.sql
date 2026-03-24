-- Add position column to decisions for drag & drop ordering
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Assign initial positions based on current order (newest first = position 0)
WITH ranked AS (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1) AS pos
  FROM decisions
)
UPDATE decisions SET position = ranked.pos FROM ranked WHERE decisions.id = ranked.id;
