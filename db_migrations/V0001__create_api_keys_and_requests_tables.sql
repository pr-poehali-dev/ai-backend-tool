CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT true,
    requests_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_requests (
    id SERIAL PRIMARY KEY,
    api_key_id INTEGER REFERENCES api_keys(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(active);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);
CREATE INDEX IF NOT EXISTS idx_api_requests_api_key_id ON api_requests(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON api_requests(created_at);

INSERT INTO api_keys (name, key_hash, key_prefix, created_at, active, requests_count) VALUES
('Production Key', 'hash_abc123', 'sk_live_...abc123', '2025-10-15', true, 45678),
('Development Key', 'hash_xyz789', 'sk_test_...xyz789', '2025-10-20', true, 12543),
('Testing Key', 'hash_def456', 'sk_test_...def456', '2025-10-25', false, 3421);