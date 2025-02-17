CREATE TABLE IF NOT EXISTS users (
                                     id               SERIAL PRIMARY KEY,
                                     oauth_provider   VARCHAR(50) NOT NULL,   -- google / kakao / naver / etc
    email            VARCHAR(255) NOT NULL UNIQUE,
    name             VARCHAR(255),
    nickname         VARCHAR(255),
    profile_image    TEXT,
    role             VARCHAR(50) DEFAULT 'USER',
    visits_count     BIGINT      DEFAULT 1,
    created_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP   NOT NULL DEFAULT NOW()
    );
