package org.core.exception

import org.springframework.http.HttpStatus
import org.springframework.http.HttpStatus.*

enum class ErrorType(
    val status: HttpStatus,
    val code: String,
    val message: String,
) {
    // COMMON
    ILLEGAL_ARGUMENT(BAD_REQUEST, "A001", "잘못된 파라미터입니다."),
    INVALID_APPROACH(BAD_REQUEST, "A002", "잘못된 접근입니다."),
    INVALID_REQUEST(BAD_REQUEST, "A003", "잘못된 요청입니다."),

    FAIL_JWT_AUTH(UNAUTHORIZED, "T001", "JWT 인증에 실패했습니다."),
    EXPIRED_TOKEN(UNAUTHORIZED, "T002", "만료된 token"),
    FAIL_OAUTH_TOKEN_REQUEST(INTERNAL_SERVER_ERROR, "T003", "OAuth 토큰 요청에 실패했습니다."),
    FAIL_OAUTH_USER_INFO_REQUEST(INTERNAL_SERVER_ERROR, "T004", "OAuth 유저 정보 요청에 실패했습니다."),
    NOT_FOUND_REFRESH_TOKEN(BAD_REQUEST, "T005", "리프레시 토큰을 찾을 수 없습니다."),
    INVALID_JWT_SIGNATURE(UNAUTHORIZED, "T005", "토큰의 서명이 유효하지 않습니다."),
    FAIL_PARSE_TOKEN(UNAUTHORIZED, "T006", "토큰 파싱을 실패했습니다."),

    MISSING_CONFIGURATION(INTERNAL_SERVER_ERROR, "C001", "필수 구성 설정이 누락되었습니다."),
    OAUTH_SECRET_LOAD_FAILED(INTERNAL_SERVER_ERROR, "C002", "OAuth 시크릿 로드에 실패했습니다."),
    AWS_SECRET_ACCESS_FAILED(INTERNAL_SERVER_ERROR, "C003", "AWS Secrets Manager 접근에 실패했습니다."),
    OAUTH_ENV_VAR_MISSING(INTERNAL_SERVER_ERROR, "C004", "OAuth 환경 변수를 찾을 수 없습니다."),

    INTERNAL_SERVER_ERR(INTERNAL_SERVER_ERROR, "9999", "예기치 못한 서버오류")
    ;

    fun getMessage(invalidInput: String? = null): String {
        return if (invalidInput.isNullOrEmpty()) message else "$message : $invalidInput"
    }
}
