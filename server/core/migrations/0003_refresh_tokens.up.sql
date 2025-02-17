CREATE TABLE IF NOT EXISTS refresh_tokens (
                                              id           SERIAL PRIMARY KEY,
                                              user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token        VARCHAR(512) NOT NULL UNIQUE,
    expired_at   TIMESTAMP NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
    );