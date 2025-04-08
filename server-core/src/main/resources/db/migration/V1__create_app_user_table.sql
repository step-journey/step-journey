CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS app_user (
    id UUID PRIMARY KEY,
    oauth_provider VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    nickname VARCHAR(255),
    profile_image VARCHAR(255),
    role VARCHAR(50) DEFAULT 'USER',
    login_count BIGINT DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
    );
