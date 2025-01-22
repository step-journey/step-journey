-- name: ListUsers :many
SELECT id, username, created_at FROM users ORDER BY id;

-- name: CreateUser :one
INSERT INTO users (username)
VALUES ($1)
    RETURNING id, username, created_at;
