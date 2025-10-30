-- Add assistant_id column to usage_stats table
ALTER TABLE usage_stats ADD COLUMN IF NOT EXISTS assistant_id VARCHAR(255);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_usage_stats_assistant_id ON usage_stats(assistant_id);

-- Add comment
COMMENT ON COLUMN usage_stats.assistant_id IS 'ID of the assistant that generated this usage';