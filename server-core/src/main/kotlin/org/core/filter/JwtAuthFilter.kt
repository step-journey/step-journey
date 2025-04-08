package org.core.filter

import jakarta.servlet.FilterChain
import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.core.auth.domain.SecurityUser
import org.core.auth.service.RefreshTokenService
import org.core.auth.util.JwtUtils
import org.core.auth.util.JwtUtils.Companion.ACCESS_TOKEN_COOKIE_NAME
import org.core.auth.util.JwtUtils.Companion.REFRESH_TOKEN_COOKIE_NAME
import org.core.user.domain.User
import org.core.user.service.UserService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpHeaders
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

// todo 토큰이 아예 없이 요청을 한 경우 서버 로그가 안찍히는 문제 있음
/**
 * JWT 토큰 기반 인증을 처리하는 필터
 * - 쿠키에서 액세스 토큰 추출 및 검증
 * - 액세스 토큰이 유효하면 SecurityContext 에 인증 정보 설정
 * - 액세스 토큰 만료 시 리프레시 토큰으로 새 액세스 토큰 발급
 *
 * 인증 실패 시 처리:
 * - 인증에 실패하면 SecurityContext 에 인증 정보가 설정되지 않음 → Spring Security 는 해당 요청을 인증되지 않은 상태로 처리
 * - SecurityConfig 설정에 따라:
 *   1) 공개 경로는 인증 없이 접근 가능 (/actuator/health 등)
 *   2) 보호된 경로는 401 Unauthorized 응답 반환 (Spring Security 의 AuthenticationEntryPoint 에 의해 처리)
 * - 인증 실패해도 이 필터에서 요청을 차단하지 않고 다음 필터로 전달하여 Spring Security 가 접근 제어 결정
*/
class JwtAuthFilter(
	private val jwtUtils: JwtUtils,
	private val userService: UserService,
	private val refreshTokenService: RefreshTokenService,
) : OncePerRequestFilter() {

	private val log = LoggerFactory.getLogger(JwtAuthFilter::class.java)

	override fun doFilterInternal(
		request: HttpServletRequest,
		response: HttpServletResponse,
		filterChain: FilterChain
	) {
		// 인증 시도
		authenticateRequest(request, response)

		// 인증 성공 여부와 상관없이 다음 필터 실행
		filterChain.doFilter(request, response)
	}

	private fun authenticateRequest(request: HttpServletRequest, response: HttpServletResponse) {
		// 먼저 액세스 토큰으로 인증 시도
		val accessTokenCookie = getCookie(request, ACCESS_TOKEN_COOKIE_NAME)
		if (accessTokenCookie != null && authenticateWithAccessToken(accessTokenCookie.value)) {
			return // 액세스 토큰 인증 성공
		}

		// 액세스 토큰이 없거나 유효하지 않은 경우 리프레시 토큰 시도
		val refreshTokenCookie = getCookie(request, REFRESH_TOKEN_COOKIE_NAME)
		if (refreshTokenCookie != null && authenticateWithRefreshToken(refreshTokenCookie.value, response)) {
			return // 리프레시 토큰 인증 성공
		}
	}

	private fun authenticateWithAccessToken(token: String): Boolean {
		return try {
			val claims = jwtUtils.validateToken(token)
			val userId = jwtUtils.getUserIdFromToken(claims)
			val user = userService.findById(userId)
			setAuthenticationInContext(user, userId)
			true
		} catch (e: Exception) {
			log.error("액세스 토큰 인증 실패: ${e.message}")
			false
		}
	}

	private fun authenticateWithRefreshToken(token: String, response: HttpServletResponse): Boolean {
		return try {
			// 토큰 유효성 검증
			val claims = jwtUtils.validateToken(token)

			// 리프레시 토큰이 DB에 존재하는지 검증
			refreshTokenService.findByToken(token)

			// 클레임에서 사용자 ID 추출
			val userId = jwtUtils.getUserIdFromToken(claims)

			// ID로 사용자 정보 직접 조회
			val user = userService.findById(userId)

			// 새 액세스 토큰 발급
			val newAccessToken = jwtUtils.generateAccessToken(user.id!!, user.email, user.role)

			// 인증 설정
			setAuthenticationInContext(user, userId)

			// 새 액세스 토큰을 응답 쿠키에 추가
			val accessTokenCookie = jwtUtils.createAccessTokenCookie(newAccessToken)
			response.addHeader(HttpHeaders.SET_COOKIE, accessTokenCookie)

			log.info("리프레시 토큰으로 액세스 토큰 재발급 및 인증 성공")
			true
		} catch (e: Exception) {
			log.error("리프레시 토큰 인증 실패: ${e.message}")
			false
		}
	}

	/**
	 * SecurityContext 에 사용자 인증 정보 설정
	 */
	private fun setAuthenticationInContext(user: User, userId: UUID) {
		val authorities = listOf(SimpleGrantedAuthority(user.role.asAuthority()))

		val authentication = UsernamePasswordAuthenticationToken(
			SecurityUser(userId, user.email, user.role),
			null,
			authorities
		)

		SecurityContextHolder.getContext().authentication = authentication
	}

	/**
	 * 요청에서 쿠키를 찾아 반환
	 */
	private fun getCookie(request: HttpServletRequest, name: String): Cookie? {
		val cookies = request.cookies ?: return null
		return cookies.find { it.name == name }
	}

}
