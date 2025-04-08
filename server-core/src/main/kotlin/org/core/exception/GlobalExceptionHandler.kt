package org.core.exception

import jakarta.validation.ConstraintViolationException
import org.core.common.CustomResponse
import org.core.exception.ErrorType.*
import org.core.exception.base.BadRequestException
import org.core.exception.base.ForbiddenException
import org.core.exception.base.UnauthorizedException
import org.core.exception.dto.ValidationError
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.slf4j.event.Level
import org.slf4j.event.Level.ERROR
import org.slf4j.event.Level.INFO
import org.springframework.http.HttpStatus
import org.springframework.validation.BindException
import org.springframework.validation.BindingResult
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.MissingRequestHeaderException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

/**
 * 에러 공통 처리를 여기서 하고 로그를 찍긴 하지만,
 * 실제 로깅 처리는 [org.core.logging.HttpJsonLayout] 에서 함
 * */
@RestControllerAdvice
class GlobalExceptionHandler {
    private val logger: Logger = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    @ExceptionHandler(BadRequestException::class)
    fun badRequestExceptionHandler(e: BadRequestException): CustomResponse<Nothing> {
        val errorType = e.getErrorType()
        val additionalInfo = e.getAdditionalInfo()

        logException(e, errorType.status, e.message, ERROR)

        return CustomResponse.error(
            code = errorType.code,
            message = e.message ?: errorType.message,
            additionalInfo = additionalInfo
        )
    }

    @ExceptionHandler(ForbiddenException::class)
    fun forBiddenExceptionHandler(e: ForbiddenException): CustomResponse<Nothing> {
        val errorType = e.getErrorType()
        val additionalInfo = e.getAdditionalInfo()

        logException(e, errorType.status, e.message, ERROR)

        return CustomResponse.error(
            code = errorType.code,
            message = e.message ?: errorType.message,
            additionalInfo = additionalInfo
        )
    }


    @ExceptionHandler(UnauthorizedException::class)
    fun unauthorizedExceptionHandler(e: UnauthorizedException): CustomResponse<Nothing> {
        val errorType = e.getErrorType()
        val additionalInfo = e.getAdditionalInfo()
        val loggingLevel = if (errorType == EXPIRED_TOKEN) INFO else ERROR

        logException(e, errorType.status, e.message, loggingLevel)

        return CustomResponse.error(
            code = errorType.code,
            message = e.message ?: errorType.message,
            additionalInfo = additionalInfo
        )
    }

    @ExceptionHandler(ConstraintViolationException::class)
    fun constraintViolationExceptionHandler(e: ConstraintViolationException): CustomResponse<Nothing> {
        val validationErrors = extractValidationErrors(e.constraintViolations)
        val additionalInfo = mapOf("violations" to validationErrors)

        logException(e, INVALID_REQUEST.status, "요청 파라미터 유효성 검증 실패", ERROR)

        return CustomResponse.error(
            code = INVALID_REQUEST.code,
            message = "요청 파라미터 유효성 검증 실패",
            additionalInfo = additionalInfo
        )
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun illegalArgumentExceptionHandler(e: IllegalArgumentException): CustomResponse<Nothing> {
        logException(e, INVALID_REQUEST.status, e.message ?: "잘못된 요청입니다.", ERROR)

        return CustomResponse.error(
            code = INVALID_REQUEST.code,
            message = e.message ?: "잘못된 요청입니다.",
            additionalInfo = null
        )
    }
    @ExceptionHandler(BindException::class)
    fun bindExceptionHandler(e: BindException): CustomResponse<Nothing> {
        val validationErrors = extractValidationErrors(e.bindingResult)
        val additionalInfo = mapOf("violations" to validationErrors)

        logException(e, INVALID_REQUEST.status, "요청 본문 유효성 검증 실패", ERROR)

        return CustomResponse.error(
            code = INVALID_REQUEST.code,
            message = "요청 본문 유효성 검증 실패",
            additionalInfo = additionalInfo
        )
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun methodArgumentExceptionHandler(e: MethodArgumentNotValidException): CustomResponse<Nothing> {
        val validationErrors = extractValidationErrors(e.bindingResult)
        val additionalInfo = mapOf("violations" to validationErrors)

        logException(e, INVALID_REQUEST.status, "요청 본문 유효성 검증 실패", ERROR)

        return CustomResponse.error(
            code = INVALID_REQUEST.code,
            message = "요청 본문 유효성 검증 실패",
            additionalInfo = additionalInfo
        )
    }

    @ExceptionHandler(
        Exception::class,
        IllegalStateException::class,
        RuntimeException::class,
        java.lang.IllegalStateException::class,
    )
    fun unCaughtException(e: Exception): CustomResponse<Nothing> {
        logException(e, INTERNAL_SERVER_ERR.status, e.message, ERROR)

        return CustomResponse.error(
            code = INTERNAL_SERVER_ERR.code,
            message = "서버 오류가 발생했습니다.",
            additionalInfo = null
        )
    }


    @ExceptionHandler(MissingRequestHeaderException::class)
    fun missingRequestHeaderException(e: MissingRequestHeaderException): CustomResponse<Nothing> {
        val message = "필수 헤더값이 없습니다: ${e.headerName}"
        logException(e, INVALID_REQUEST.status, message, ERROR)

        return CustomResponse.error(
            code = INVALID_REQUEST.code,
            message = message,
            additionalInfo = null
        )
    }

    @ExceptionHandler(MissingServletRequestParameterException::class)
    fun missingRequestParameterException(e: MissingServletRequestParameterException): CustomResponse<Nothing> {
        val message = "필수 파라미터가 없습니다: ${e.parameterName}"
        logException(e, INVALID_REQUEST.status, message, ERROR)

        return CustomResponse.error(
            code = INVALID_REQUEST.code,
            message = message,
            additionalInfo = null
        )
    }

    private fun logException(e: Exception, status: HttpStatus, message: String? = null, level: Level = ERROR) {
        // MDC 사용해 HTTP 상태 코드 로깅
        MDC.put("httpStatus", status.value().toString())

        // 로그 메시지
        val messageToLog = message ?: e.message

        // 로깅 레벨에 따라 로깅
        when (level) {
            INFO -> logger.info(messageToLog, e)
            else -> logger.error(messageToLog, e)
        }

        // MDC 정보 제거
        MDC.remove("httpStatus")
    }

    private fun extractValidationErrors(bindingResult: BindingResult): List<ValidationError> {
        val errors = mutableListOf<ValidationError>()

        // 필드 오류 처리
        bindingResult.fieldErrors.forEach { fieldError ->
            errors.add(
                ValidationError(
                    field = fieldError.field,
                    value = fieldError.rejectedValue,
                    reason = fieldError.defaultMessage ?: "유효하지 않은 값"
                )
            )
        }

        // 글로벌 오류 처리
        bindingResult.globalErrors.forEach { globalError ->
            errors.add(
                ValidationError(
                    field = globalError.objectName,
                    value = null,
                    reason = globalError.defaultMessage ?: "유효하지 않은 객체"
                )
            )
        }

        return errors
    }

    private fun extractValidationErrors(constraintViolations: Set<jakarta.validation.ConstraintViolation<*>>): List<ValidationError> {
        return constraintViolations.map { violation ->
            ValidationError(
                field = violation.propertyPath.toString(),
                value = violation.invalidValue,
                reason = violation.message
            )
        }
    }
}
