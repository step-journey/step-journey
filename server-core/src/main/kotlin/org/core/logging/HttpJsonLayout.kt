package org.core.logging

import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.LayoutBase
import com.fasterxml.jackson.databind.ObjectMapper
import org.core.logging.LogUtil.Companion.formatStackTrace
import org.core.logging.LogUtil.Companion.processHeaders
import org.core.util.TimeUtil.Companion.convertMillisToISOString
import org.slf4j.MDC

class HttpJsonLayout : LayoutBase<ILoggingEvent>() {
    private val objectMapper = ObjectMapper()

    override fun doLayout(event: ILoggingEvent): String {
        val logMap = mutableMapOf<String, Any>()

        logMap["level"] = event.level.toString()

        // Request 정보
        logMap["request"] = mutableMapOf<String, Any?>().apply {
            put("method", MDC.get("requestMethod"))
            put("url", MDC.get("requestUrl"))
            put("x-amzn-trace-id", MDC.get("x-amzn-trace-id"))
            put("user_uuid", MDC.get("userUuid"))
            put("headers", processHeaders(MDC.get("requestHeaders")))
            put("body", MDC.get("requestBody"))
            put("timestamp", MDC.get("requestTimestamp"))
        }

        logMap["thread"] = event.threadName
        logMap["loggerName"] = event.loggerName

        val isError = event.throwableProxy != null
        if (isError) {
            // 에러 정보 로깅
            val errorInfo = mutableMapOf<String, Any>().apply {
                put("status", MDC.get("httpStatus") ?: "Unknown") // GlobalExceptionHandler 에서 MDC.put()으로 추가함
                put("exception", event.throwableProxy.className)
                put("message", event.throwableProxy.message ?: "")
                put("stack_trace", formatStackTrace(event.throwableProxy))
                put("timestamp", convertMillisToISOString(event.timeStamp))
            }
            logMap["error"] = errorInfo
        } else {
            // 응답 정보 로깅
            logMap["response"] = mutableMapOf<String, Any?>().apply {
                put("status", MDC.get("responseStatus"))
                put("processing_time_s", MDC.get("processing_time_s"))
                put("body", MDC.get("responseBody"))
            }
        }

    return objectMapper.writeValueAsString(logMap) + System.lineSeparator()
	}

}
