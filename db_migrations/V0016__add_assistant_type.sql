-- Add assistant type field
ALTER TABLE assistants ADD COLUMN type VARCHAR(20) DEFAULT 'simple' NOT NULL;

-- Update existing assistants to be 'simple' type
UPDATE assistants SET type = 'simple' WHERE type IS NULL OR type = '';

-- Add comment for clarity
COMMENT ON COLUMN assistants.type IS 'Type of assistant: simple (standard settings) or external (third-party assistant with assistant_code)';