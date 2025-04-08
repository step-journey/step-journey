package org.core.exception.base

import org.core.exception.ErrorType

abstract class BadRequestException(
    errorType: ErrorType,
    invalidInput: String? = null,
    cause: Throwable? = null,
    additionalInfo: Map<String, Any?>? = null
) : BusinessException(errorType, invalidInput, cause, additionalInfo)
