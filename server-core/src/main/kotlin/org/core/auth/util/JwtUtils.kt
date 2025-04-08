package org.core.auth.util

import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import io.jsonwebtoken.security.SignatureException
import jakarta.servlet.http.HttpServletResponse
import org.core.config.AppProperties
import org.core.exception.ErrorType.*
import org.core.exception.general.AuthenticationException
import org.core.user.domain.UserRole
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.time.LocalDateTime
import java.util.*

/**
 * JWT 토큰 생성 및 검증 위한 유틸리티 클래스
 */
@Component
class JwtUtils(
	@Value("\${app.jwt-secret-key}") // todo AWS Secrets Manager 에서 가져오도록 개선
	private val secretKeyString: String,

	@Value("\${app.access-token-expiration-seconds}")
	private val accessTokenExpirationSeconds: Int,

	@Value("\${app.refresh-token-expiration-seconds}")
	private val refreshTokenExpirationSeconds: Int,

	private val appProperties: AppProperties
) {
	private val log = LoggerFactory.getLogger(JwtUtils::class.java)
	private val secretKey = Keys.hmacShaKeyFor(secretKeyString.toByteArray(StandardCharsets.UTF_8))

	companion object {
		const val ACCESS_TOKEN_COOKIE_NAME = "access_token"
		const val REFRESH_TOKEN_COOKIE_NAME = "refresh_token"
	}

	enum class TokenType {
		ACCESS, REFRESH
	}

	/**
	 * 액세스 토큰 생성
	 */
	fun generateAccessToken(userId: UUID, email: String, role: UserRole): String {
		return generateToken(TokenType.ACCESS, userId, email, role)
	}

	/**
	 * 리프레시 토큰 생성
	 */
	fun generateRefreshToken(userId: UUID): String {
		return generateToken(TokenType.REFRESH, userId, null, null)
	}

	/**
	 * 토큰 유효성 검증 및 클레임 반환
	 */
	fun validateToken(token: String): Claims {
		return try {
			Jwts.parser()
				.verifyWith(secretKey)
				.build()
				.parseSignedClaims(token)
				.payload
		} catch (e: SignatureException) {
			throw AuthenticationException(INVALID_JWT_SIGNATURE, token, e)
		} catch (e: ExpiredJwtException) {
			throw AuthenticationException(EXPIRED_TOKEN, token, e)
		} catch (e: Exception) {
			throw AuthenticationException(FAIL_PARSE_TOKEN, token, e)
		}
	}

	/**
	 * 클레임에서 사용자 ID 추출
	 */
	fun getUserIdFromToken(claims: Claims): UUID {
		return try {
			UUID.fromString(claims.subject)
		} catch (e: IllegalArgumentException) {
			throw AuthenticationException(INVALID_REQUEST, claims.subject, e)
		}
	}

	/**
	 * 리프레시 토큰 만료 시간 계산
	 */
	fun getRefreshTokenExpiration(): LocalDateTime {
		return LocalDateTime.now().plusSeconds(refreshTokenExpirationSeconds.toLong())
	}

	/**
	 * 토큰 유형별 생성 로직
	 */
	private fun generateToken(tokenType: TokenType, userId: UUID, email: String?, role: UserRole?): String {
		val now = Instant.now()
		val expirationTime = when (tokenType) {
			TokenType.ACCESS -> now.plusSeconds(accessTokenExpirationSeconds.toLong())
			TokenType.REFRESH -> now.plusSeconds(refreshTokenExpirationSeconds.toLong())
		}

		val builder = Jwts.builder()
			.subject(userId.toString())
			.issuedAt(Date.from(now))
			.expiration(Date.from(expirationTime))
			.signWith(secretKey)

		// 토큰 유형별 추가 클레임
		when (tokenType) {
			TokenType.ACCESS -> {
				builder
					.claim("email", email)
					.claim("role", role?.name)
			}
			TokenType.REFRESH -> {
				builder.claim("scope", "refresh")
			}
		}

		return builder.compact()
	}

	/**
	 * 인증 토큰 쿠키 설정
	 */
	fun setTokenCookies(response: HttpServletResponse, accessToken: String, refreshToken: String) {
		val accessTokenCookie = createAccessTokenCookie(accessToken)
		val refreshTokenCookie = createRefreshTokenCookie(refreshToken)

		response.addHeader(HttpHeaders.SET_COOKIE, accessTokenCookie)
		response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie)
	}

	/**
	 * 인증 토큰 쿠키 무효화
	 */
	fun invalidateTokenCookies(response: HttpServletResponse) {
		// 빈 값과 만료 시간 0으로 쿠키 생성
		val invalidAccessTokenCookie = createTokenCookie(
			name = ACCESS_TOKEN_COOKIE_NAME,
			value = "",
			maxAge = 0
		)

		val invalidRefreshTokenCookie = createTokenCookie(
			name = REFRESH_TOKEN_COOKIE_NAME,
			value = "",
			maxAge = 0
		)

		response.addHeader(HttpHeaders.SET_COOKIE, invalidAccessTokenCookie)
		response.addHeader(HttpHeaders.SET_COOKIE, invalidRefreshTokenCookie)
	}

	/**
	 * 액세스 토큰 쿠키 생성
	 */
	fun createAccessTokenCookie(token: String): String {
		return createTokenCookie(
			name = ACCESS_TOKEN_COOKIE_NAME,
			value = token,
			maxAge = appProperties.accessTokenExpirationSeconds
		)
	}

	/**
	 * 리프레시 토큰 쿠키 생성
	 */
	fun createRefreshTokenCookie(token: String): String {
		return createTokenCookie(
			name = REFRESH_TOKEN_COOKIE_NAME,
			value = token,
			maxAge = appProperties.refreshTokenExpirationSeconds
		)
	}

	/**
	 * 토큰 쿠키 생성
	 */
	private fun createTokenCookie(name: String, value: String, maxAge: Int): String {
		return ResponseCookie.from(name, value)
			.path("/")
			.domain(appProperties.cookieDomain)
			.httpOnly(true)
			.secure(appProperties.cookieDomain != "localhost")
			.sameSite("Lax")
			.maxAge(maxAge.toLong())
			.build()
			.toString()
	}

}
