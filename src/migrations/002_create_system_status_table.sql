-- Migration: Create system_status table
-- Requirements: 5.2

CREATE TABLE IF NOT EXISTS system_status (
    id INT PRIMARY KEY DEFAULT 1,
    last_refreshed_at TIMESTAMP,
    total_countries INT DEFAULT 0,
    CHECK (id = 1)
);

-- Insert initial record
INSERT IGNORE INTO system_status (id, total_countries) VALUES (1, 0);