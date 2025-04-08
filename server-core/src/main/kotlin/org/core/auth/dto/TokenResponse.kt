package org.core.auth.dto

class TokenResponse {
	data class Token(
		val accessToken: String,
		val refreshToken: String
	)

	data class OAuthTokenResponse(
		val access_token: String,
	)

	data class GoogleUserInfoResponse(
		val email: String,
	)

	data class KakaoUserInfoResponse(
		val kakao_account: KakaoAccount
	) {
		data class KakaoAccount(
			val email: String,
		)
	}

	data class NaverUserInfoResponse(
		val response: NaverUserInfo
	) {
		data class NaverUserInfo(
			val email: String,
		)
	}

}
