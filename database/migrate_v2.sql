USE businessmind_db;

-- Step 1: Modify password_hash to allow NULL (for Google OAuth users)
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- Step 2: Add new columns one by one (ignore errors if already exist)
ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL AFTER id;
ALTER TABLE users ADD COLUMN auth_provider ENUM('local','google') NOT NULL DEFAULT 'local' AFTER organization_id;
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL AFTER auth_provider;
ALTER TABLE users ADD COLUMN avatar_url TEXT NULL AFTER google_id;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER avatar_url;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL AFTER email_verified;
ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL AFTER email_verification_token;
ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP NULL AFTER password_reset_token;
ALTER TABLE users ADD COLUMN refresh_tokens JSON AFTER password_reset_expires;
ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0 AFTER refresh_tokens;
ALTER TABLE users ADD COLUMN lockout_until TIMESTAMP NULL AFTER failed_login_attempts;
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE AFTER lockout_until;
ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255) NULL AFTER mfa_enabled;
ALTER TABLE users ADD COLUMN login_history JSON AFTER mfa_secret;
ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER login_history;

-- Step 3: Backfill usernames for existing rows
UPDATE users SET username = CONCAT(LOWER(REPLACE(SUBSTRING(name, 1, 10), ' ', '_')), '_', SUBSTRING(id, 1, 4))
WHERE username IS NULL OR username = '';

-- Step 4: Make username NOT NULL and UNIQUE
ALTER TABLE users MODIFY COLUMN username VARCHAR(50) NOT NULL;
ALTER TABLE users ADD UNIQUE KEY uq_username (username);
