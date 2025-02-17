package middleware

import (
	"net/http"
)

// NewCORSMiddleware 는 CORS 설정을 위한 미들웨어를 반환합니다.
func NewCORSMiddleware() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// 요청에 대한 응답 헤더로 CORS 정책 설정
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			// Preflight (OPTIONS) 요청이면 바로 리턴
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}

			// 다음 핸들러 호출
			next.ServeHTTP(w, r)
		})
	}
}
