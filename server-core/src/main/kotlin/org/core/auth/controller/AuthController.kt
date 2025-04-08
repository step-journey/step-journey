package org.core.auth.controller

import jakarta.servlet.http.HttpServletResponse
import org.core.auth.dto.TokenResponse
import org.core.auth.service.AuthService
import org.core.auth.util.JwtUtils
import org.core.common.CustomResponse
import org.core.config.AppProperties
import org.springframework.web.bind.annotation.*

@RestController
class AuthController(
	private val authService: AuthService,
	private val appProperties: AppProperties,
	private val jwtUtils: JwtUtils,
) {
	@GetMapping("/api/v1/auth/google/redirect")
	fun redirectToGoogleOAuth(response: HttpServletResponse): CustomResponse<Unit> {
		val oAuthUrl = authService.getGoogleOAuthUrl()
		response.sendRedirect(oAuthUrl)
		return CustomResponse.ok()
	}

	@GetMapping("/api/v1/auth/naver/redirect")
	fun redirectToNaverOAuth(response: HttpServletResponse): CustomResponse<Unit> {
		val oAuthUrl = authService.getNaverOAuthUrl()
		response.sendRedirect(oAuthUrl)
		return CustomResponse.ok()
	}

	@GetMapping("/api/v1/auth/kakao/redirect")
	fun redirectToKakaoOAuth(response: HttpServletResponse): CustomResponse<Unit> {
		val oAuthUrl = authService.getKakaoOAuthUrl()
		response.sendRedirect(oAuthUrl)
		return CustomResponse.ok()
	}

	@GetMapping("/api/v1/auth/google/callback")
	fun handleGoogleCallback(
		@RequestParam code: String,
		response: HttpServletResponse
	): CustomResponse<Unit> {
		val tokens = authService.processGoogleCallback(code)
		setTokenCookiesAndRedirect(response, tokens)

		return CustomResponse.ok()
	}

	@GetMapping("/api/v1/auth/naver/callback")
	fun handleNaverCallback(
		@RequestParam code: String,
		@RequestParam state: String,
		response: HttpServletResponse
	): CustomResponse<Unit> {
		val tokens = authService.processNaverCallback(code, state)
		setTokenCookiesAndRedirect(response, tokens)

		return CustomResponse.ok()
	}

	@GetMapping("/api/v1/auth/kakao/callback")
	fun handleKakaoCallback(
		@RequestParam code: String?,
		response: HttpServletResponse
	): CustomResponse<Unit> {
		val tokens = authService.processKakaoCallback(code!!)
		setTokenCookiesAndRedirect(response, tokens)

		return CustomResponse.ok()
	}

	@PostMapping("/api/v1/auth/logout")
	fun handleLogout(response: HttpServletResponse): CustomResponse<Unit> {
		jwtUtils.invalidateTokenCookies(response)
		return CustomResponse.ok()
	}

	private fun setTokenCookiesAndRedirect(
		response: HttpServletResponse,
		tokens: TokenResponse.Token
	) {
		jwtUtils.setTokenCookies(response, tokens.accessToken, tokens.refreshToken)

		// 인증 콜백 엔드포인트로 리디렉션
		val redirectUrl = "${appProperties.clientBaseUrl}/auth/callback"
		response.sendRedirect(redirectUrl)
	}

}
