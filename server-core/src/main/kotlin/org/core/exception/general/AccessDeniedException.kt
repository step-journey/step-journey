package org.core.exception.general

import org.core.exception.ErrorType
import org.core.exception.base.ForbiddenException

class AccessDeniedException(
    errorType: ErrorType,
    invalidInput: String? = null,
    cause: Throwable? = null,
    additionalInfo: Map<String, Any?>? = null
) : ForbiddenException(errorType, invalidInput, cause, additionalInfo)
