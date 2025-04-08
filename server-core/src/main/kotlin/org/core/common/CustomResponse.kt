package org.core.common

sealed class CustomResponse<out T> {
	data class Success<T>(
		val data: T?,
		val code: String = "0000",
		val message: String = "성공",
	) : CustomResponse<T>()

	data class Error(
		val code: String,
		val message: String,
		val additionalInfo: Map<String, Any?>? = null
	) : CustomResponse<Nothing>()

	companion object {
		// 데이터가 있는 성공 응답
		fun <T> ok(data: T) = Success(data)

		// 데이터가 없는 성공 응답
		fun ok() = Success<Unit>(null)

		// 에러 응답
		fun error(code: String, message: String) = Error(code, message)

		// 추가 정보가 있는 에러 응답
		fun error(code: String, message: String, additionalInfo: Map<String, Any?>?) =
			Error(code, message, additionalInfo)
	}
}
