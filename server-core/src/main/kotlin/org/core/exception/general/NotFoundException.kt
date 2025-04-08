package org.core.exception.general

import org.core.exception.ErrorType
import org.core.exception.base.BadRequestException

class NotFoundException(
    errorType: ErrorType,
    invalidInput: String? = null,
    cause: Throwable? = null,
    additionalInfo: Map<String, Any?>? = null
) : BadRequestException(errorType, invalidInput, cause, additionalInfo)
