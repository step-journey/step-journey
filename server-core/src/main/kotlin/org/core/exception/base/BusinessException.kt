package org.core.exception.base

import org.core.exception.ErrorType

abstract class BusinessException(
    private val errorType: ErrorType,
    invalidInput: String? = null,
    cause: Throwable? = null,
    private val additionalInfo: Map<String, Any?>? = null
) : RuntimeException(errorType.getMessage(invalidInput), cause) {
    fun getErrorType(): ErrorType = this.errorType
    fun getAdditionalInfo(): Map<String, Any?>? = this.additionalInfo
}
