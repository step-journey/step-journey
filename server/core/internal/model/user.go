package model

import "time"

type User struct {
	ID            int       `json:"id"`
	OauthProvider string    `json:"oauth_provider"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	Nickname      string    `json:"nickname"`
	ProfileImage  string    `json:"profile_image"`
	Role          string    `json:"role"`
	VisitsCount   int64     `json:"visits_count"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
