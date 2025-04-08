package org.core.logging

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.Logger
import org.springframework.web.util.ContentCachingRequestWrapper
import java.nio.charset.StandardCharsets.UTF_8

class LogUtil {
    companion object {
        private val objectMapper = ObjectMapper()

        fun extractHeaders(request: HttpServletRequest): String {
            val excludedHeaders = setOf(
                "authorization", "user-uuid", "user-agent", "accept", "host", "accept-encoding",
                "connection", "content-type", "content-length", "x-forwarded-proto",
                "x-envoy-expected-rq-timeout-ms", "x-forwarded-for", "x-forwarded-port",
                "x-amzn-trace-id", "x-envoy-expected-rq-timeout-ms"
            )
            val headersMap = request.headerNames.asSequence()
                .filter { it !in excludedHeaders }
                .associateWith { headerName -> request.getHeader(headerName) }
            return objectMapper.writeValueAsString(headersMap)
        }

        fun getRequestBody(wrappedRequest: ContentCachingRequestWrapper): String {
            val requestBodyBytes = wrappedRequest.contentAsByteArray
            return String(requestBodyBytes, UTF_8).trim()
        }

        fun processHeaders(rawHeaders: String?): Map<String, Any> {
            val objectMapper = ObjectMapper()
            return rawHeaders?.let {
                try {
                    objectMapper.readValue(it, object : TypeReference<Map<String, Any>>() {})
                } catch (e: Exception) {
                    emptyMap()
                }
            } ?: emptyMap()
        }

        fun formatStackTrace(throwableProxy: ch.qos.logback.classic.spi.IThrowableProxy): List<String> {
            val stackTraceList = mutableListOf<String>()
            var tp: ch.qos.logback.classic.spi.IThrowableProxy? = throwableProxy
            while (tp != null) {
                stackTraceList.addAll(tp.stackTraceElementProxyArray.map { it.steAsString })
                // try-catch 로 원본 예외 잡아서 다시 커스텀 예외로 던진 경우에
                // 원본 예외의 에러 트레이스까지 포함하기 위한 로직
                if (tp.cause != null) {
                    stackTraceList.add("Caused by: ${tp.cause.className}: ${tp.cause.message}")
                    stackTraceList.addAll(tp.cause.stackTraceElementProxyArray.map { "    at $it" })
                }
                tp = tp.cause
            }
            return stackTraceList
        }

        fun logStructured(log: Logger, title: String, content: Any) {
            val logEntry = mutableMapOf(
                "title" to title,
                "content" to content
            )
            val logMessage = objectMapper.writeValueAsString(logEntry)
            log.info(logMessage)
        }

        fun logError(log: Logger, title: String, e: Exception) {
            val errorEntry = mutableMapOf<String, Any>(
                "title" to title,
                "error" to (e.message ?: "Unknown error")
            )
            val logMessage = objectMapper.writeValueAsString(errorEntry)
            log.error(logMessage, e)
        }

    }
}
