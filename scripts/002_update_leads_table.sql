-- Add calculator-specific fields to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS quality_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS location_tier VARCHAR(50),
ADD COLUMN IF NOT EXISTS has_stairs BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stair_count INTEGER,
ADD COLUMN IF NOT EXISTS needs_demo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS needs_subfloor_prep BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS move_furniture BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS haul_away_debris BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rush_job BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS timeline VARCHAR(50);

-- Add index for faster querying
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_project_type ON leads(project_type);
