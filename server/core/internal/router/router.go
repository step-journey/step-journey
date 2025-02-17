package router

import (
	"net/http"
	"server/internal/handler"
	"server/internal/middleware"
	"strings"
)

type Config struct {
	AuthHandler    *handler.AuthHandler
	HealthHandler  *handler.HealthHandler
	UserHandler    *handler.UserHandler
	AuthMiddleware *middleware.AuthMiddleware
}

type Router struct {
	mux     *http.ServeMux
	routes  map[string]*route
	options *routerOptions
}

type route struct {
	pattern string
	methods map[string]http.HandlerFunc
}

type routerOptions struct {
	notFoundHandler         http.HandlerFunc
	methodNotAllowedHandler http.HandlerFunc
}

func NewRouter(cfg Config) *Router {
	r := &Router{
		mux:     http.NewServeMux(),
		routes:  make(map[string]*route),
		options: defaultOptions(),
	}

	r.setupRoutes(cfg)
	r.registerRoutesToMux()
	return r
}

func (r *Router) setupRoutes(cfg Config) {
	// Health Check
	r.GET("/health", cfg.HealthHandler.ServeHTTP)

	// Users Routes (with Auth)
	r.GET("/users", withMiddleware(cfg.AuthMiddleware, cfg.UserHandler.ListUsers))
	r.POST("/users", withMiddleware(cfg.AuthMiddleware, cfg.UserHandler.CreateUser))
	r.GET("/users/me", withMiddleware(cfg.AuthMiddleware, cfg.UserHandler.HandleMe))
}

func (r *Router) Group(prefix string) *RouteGroup {
	return &RouteGroup{
		router: r,
		prefix: prefix,
	}
}

type RouteGroup struct {
	router *Router
	prefix string
}

func (g *RouteGroup) GET(pattern string, handler http.HandlerFunc) {
	g.router.handle(http.MethodGet, g.prefix+pattern, handler)
}

func (g *RouteGroup) POST(pattern string, handler http.HandlerFunc) {
	g.router.handle(http.MethodPost, g.prefix+pattern, handler)
}

func (r *Router) GET(pattern string, handler http.HandlerFunc) {
	r.handle(http.MethodGet, pattern, handler)
}

func (r *Router) POST(pattern string, handler http.HandlerFunc) {
	r.handle(http.MethodPost, pattern, handler)
}

func (r *Router) handle(method, pattern string, handler http.HandlerFunc) {
	if r.routes[pattern] == nil {
		r.routes[pattern] = &route{
			pattern: pattern,
			methods: make(map[string]http.HandlerFunc),
		}
	}
	r.routes[pattern].methods[method] = handler
}

func (r *Router) registerRoutesToMux() {
	for pattern, route := range r.routes {
		r.mux.Handle(pattern, r.createHandler(route))
	}
}

func (r *Router) createHandler(route *route) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if h, ok := route.methods[req.Method]; ok {
			h(w, req)
			return
		}
		if len(route.methods) == 0 {
			r.options.notFoundHandler(w, req)
			return
		}
		allowed := make([]string, 0, len(route.methods))
		for method := range route.methods {
			allowed = append(allowed, method)
		}
		w.Header().Set("Allow", strings.Join(allowed, ", "))
		r.options.methodNotAllowedHandler(w, req)
	})
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.mux.ServeHTTP(w, req)
}

// Helper functions
func defaultOptions() *routerOptions {
	return &routerOptions{
		notFoundHandler: http.NotFound,
		methodNotAllowedHandler: func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		},
	}
}

func withMiddleware(m *middleware.AuthMiddleware, h http.HandlerFunc) http.HandlerFunc {
	return m.Handle(h).ServeHTTP
}
