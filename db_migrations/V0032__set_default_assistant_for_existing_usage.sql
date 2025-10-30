-- For existing records without assistant_id, we'll leave them as NULL
-- This represents usage before we started tracking assistant_id
-- Future records will have proper assistant_id from the application

-- Optionally, you could assign to a default assistant:
-- UPDATE usage_stats 
-- SET assistant_id = 'asst_001' 
-- WHERE assistant_id IS NULL;

-- For now, we'll just add a comment to clarify
COMMENT ON COLUMN usage_stats.assistant_id IS 'ID of the assistant that generated this usage. NULL for legacy data before tracking was implemented.';