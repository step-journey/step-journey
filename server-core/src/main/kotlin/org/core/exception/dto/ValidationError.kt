package org.core.exception.dto

/**
 * 유효성 검증 오류 상세 정보를 위한 모델
 */
data class ValidationError(
	val field: String,
	val value: Any?,
	val reason: String
)
