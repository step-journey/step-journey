package org.core.auth.service

import org.core.auth.domain.OAuthProvider.*
import org.core.auth.domain.RefreshToken
import org.core.auth.dto.TokenResponse
import org.core.auth.repository.RefreshTokenRepository
import org.core.auth.util.JwtUtils
import org.core.exception.ErrorType.*
import org.core.exception.general.ExternalServiceException
import org.core.user.domain.User
import org.core.user.service.UserService
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.util.UriComponentsBuilder
import java.util.*

@Service
class AuthService(
	@Qualifier("defaultWebClient") private val defaultWebClient: WebClient,
	private val refreshTokenRepository: RefreshTokenRepository,
	private val jwtUtils: JwtUtils,
	private val userService: UserService
) {
	@Value("\${oauth.google-client-id}")
	private lateinit var googleClientId: String

	@Value("\${oauth.google-client-secret}")
	private lateinit var googleClientSecret: String

	@Value("\${oauth.google-redirect-uri}")
	private lateinit var googleRedirectUri: String

	@Value("\${oauth.google-scopes}")
	private lateinit var googleScopes: List<String>

	@Value("\${oauth.kakao-client-id}")
	private lateinit var kakaoClientId: String

	@Value("\${oauth.kakao-client-secret}")
	private lateinit var kakaoClientSecret: String

	@Value("\${oauth.kakao-redirect-uri}")
	private lateinit var kakaoRedirectUri: String

	@Value("\${oauth.kakao-scopes}")
	private lateinit var kakaoScopes: List<String>

	@Value("\${oauth.naver-client-id}")
	private lateinit var naverClientId: String

	@Value("\${oauth.naver-client-secret}")
	private lateinit var naverClientSecret: String

	@Value("\${oauth.naver-redirect-uri}")
	private lateinit var naverRedirectUri: String

	private val logger = LoggerFactory.getLogger(AuthService::class.java)

	companion object {
		private const val GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
		private const val GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
		private const val GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

		private const val NAVER_AUTH_URL = "https://nid.naver.com/oauth2.0/authorize"
		private const val NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token"
		private const val NAVER_USERINFO_URL = "https://openapi.naver.com/v1/nid/me"

		private const val KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize"
		private const val KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
		private const val KAKAO_USERINFO_URL = "https://kapi.kakao.com/v2/user/me"
	}

	fun getGoogleOAuthUrl(): String {
		return UriComponentsBuilder.fromUriString(GOOGLE_AUTH_URL)
			.queryParam("client_id", googleClientId)
			.queryParam("redirect_uri", googleRedirectUri)
			.queryParam("response_type", "code")
			.queryParam("scope", googleScopes.joinToString(" "))
			.queryParam("access_type", "offline")
			.queryParam("prompt", "select_account")
			.build()
			.toUriString()
	}

	fun getNaverOAuthUrl(): String {
		val state = UUID.randomUUID().toString()
		return UriComponentsBuilder.fromUriString(NAVER_AUTH_URL)
			.queryParam("response_type", "code")
			.queryParam("client_id", naverClientId)
			.queryParam("redirect_uri", naverRedirectUri)
			.queryParam("state", state)
			.build()
			.toUriString()
	}

	fun getKakaoOAuthUrl(): String {
		return UriComponentsBuilder.fromUriString(KAKAO_AUTH_URL)
			.queryParam("client_id", kakaoClientId)
			.queryParam("redirect_uri", kakaoRedirectUri)
			.queryParam("response_type", "code")
			.queryParam("scope", kakaoScopes.joinToString(" "))
			.build()
			.toUriString()
	}

	@Transactional
	fun processGoogleCallback(code: String): TokenResponse.Token {
		// 액세스 토큰 요청
		val tokenResponse = defaultWebClient.post()
			.uri(GOOGLE_TOKEN_URL)
			.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
			.bodyValue(
				"code=$code&" +
						"client_id=$googleClientId&" +
						"client_secret=$googleClientSecret&" +
						"redirect_uri=$googleRedirectUri&" +
						"grant_type=authorization_code"
			)
			.retrieve()
			.bodyToMono(TokenResponse.OAuthTokenResponse::class.java)
			.block() ?: throw ExternalServiceException(FAIL_OAUTH_TOKEN_REQUEST, code)

		// 유저 정보 조회
		val userInfoResponse = defaultWebClient.get()
			.uri(GOOGLE_USERINFO_URL)
			.header(HttpHeaders.AUTHORIZATION, "Bearer ${tokenResponse.access_token}")
			.retrieve()
			.bodyToMono(TokenResponse.GoogleUserInfoResponse::class.java)
			.block() ?: throw ExternalServiceException(FAIL_OAUTH_USER_INFO_REQUEST, tokenResponse.access_token)

		// 유저 조회 or 가입
		val user = userService.findByEmailOrCreate(GOOGLE, userInfoResponse.email)

		// 로그인 성공 처리
		val tokens = handleLoginSuccess(user)

		return tokens
	}

	@Transactional
	fun processNaverCallback(code: String, state: String): TokenResponse.Token {
		// 액세스 토큰 요청
		val tokenResponse = defaultWebClient.post()
			.uri(NAVER_TOKEN_URL)
			.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
			.bodyValue(
				"grant_type=authorization_code&" +
						"client_id=$naverClientId&" +
						"client_secret=$naverClientSecret&" +
						"code=$code&" +
						"state=$state"
			)
			.retrieve()
			.bodyToMono(TokenResponse.OAuthTokenResponse::class.java)
			.block() ?: throw ExternalServiceException(FAIL_OAUTH_TOKEN_REQUEST, code)

		// 유저 정보 조회
		val userInfoResponse = defaultWebClient.get()
			.uri(NAVER_USERINFO_URL)
			.header(HttpHeaders.AUTHORIZATION, "Bearer ${tokenResponse.access_token}")
			.retrieve()
			.bodyToMono(TokenResponse.NaverUserInfoResponse::class.java)
			.block() ?: throw ExternalServiceException(FAIL_OAUTH_USER_INFO_REQUEST, tokenResponse.access_token)

		// 유저 조회 or 가입
		val user = userService.findByEmailOrCreate(NAVER, userInfoResponse.response.email)

		// 로그인 성공 처리
		val tokens = handleLoginSuccess(user)

		// 토큰 반환
		return tokens
	}

	@Transactional
	fun processKakaoCallback(code: String): TokenResponse.Token {
		// 액세스 토큰 요청
		val tokenResponse = defaultWebClient.post()
			.uri(KAKAO_TOKEN_URL)
			.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
			.bodyValue(
				"grant_type=authorization_code&" +
						"client_id=$kakaoClientId&" +
						"client_secret=$kakaoClientSecret&" +
						"redirect_uri=$kakaoRedirectUri&" +
						"code=$code"
			)
			.retrieve()
			.bodyToMono(TokenResponse.OAuthTokenResponse::class.java)
			.block() ?: throw ExternalServiceException(FAIL_OAUTH_TOKEN_REQUEST, code)

		// 유저 정보 조회
		val userInfoResponse = defaultWebClient.get()
			.uri(KAKAO_USERINFO_URL)
			.header(HttpHeaders.AUTHORIZATION, "Bearer ${tokenResponse.access_token}")
			.retrieve()
			.bodyToMono(TokenResponse.KakaoUserInfoResponse::class.java)
			.block() ?: throw ExternalServiceException(FAIL_OAUTH_USER_INFO_REQUEST, tokenResponse.access_token)

		// 유저 조회 or 가입
		val user = userService.findByEmailOrCreate(KAKAO, userInfoResponse.kakao_account.email)

		// 로그인 성공 처리
		val tokens = handleLoginSuccess(user)

		// 토큰 반환
		return tokens
	}

	@Transactional
	fun handleLoginSuccess(user: User): TokenResponse.Token {
		// 로그인 카운트 increment
		val updatedUser = userService.incrementLoginCount(user)

		// 인증 토큰 생성
		val accessToken = jwtUtils.generateAccessToken(updatedUser.id!!, updatedUser.email, updatedUser.role)
		val refreshToken = jwtUtils.generateRefreshToken(updatedUser.id!!)

		// 리프레시 토큰 DB 저장
		val refreshTokenEntity = RefreshToken.create(
			token = refreshToken,
			user = updatedUser,
			expiredAt = jwtUtils.getRefreshTokenExpiration()
		)
		refreshTokenRepository.save(refreshTokenEntity)

		// 토큰 반환
		return TokenResponse.Token(accessToken, refreshToken)
	}

}
