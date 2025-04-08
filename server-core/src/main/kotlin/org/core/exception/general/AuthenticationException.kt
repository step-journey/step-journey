package org.core.exception.general

import org.core.exception.ErrorType
import org.core.exception.base.UnauthorizedException

class AuthenticationException(
    errorType: ErrorType,
    invalidInput: String? = null,
    cause: Throwable? = null,
    additionalInfo: Map<String, Any?>? = null
) : UnauthorizedException(errorType, invalidInput, cause, additionalInfo)
