package org.core.filter

import jakarta.servlet.FilterChain
import jakarta.servlet.annotation.WebFilter
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.core.logging.LogUtil.Companion.extractHeaders
import org.core.logging.LogUtil.Companion.getRequestBody
import org.slf4j.LoggerFactory
import org.slf4j.MDC
import org.springframework.core.Ordered
import org.springframework.core.Ordered.HIGHEST_PRECEDENCE
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import org.springframework.web.util.ContentCachingRequestWrapper
import org.springframework.web.util.ContentCachingResponseWrapper
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME

/**
 * 여기서 하고 로그를 찍긴 하지만 log.info(""),
 * 실제 로깅 처리는 [org.core.logging.HttpJsonLayout] 에서 함
 * */
@WebFilter(urlPatterns = ["/*"], asyncSupported = true)
@Component
class HttpLoggingFilter : OncePerRequestFilter(), Ordered {

    override fun getOrder(): Int {
        return HIGHEST_PRECEDENCE
    }

    private val log = LoggerFactory.getLogger(HttpLoggingFilter::class.java)

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        if (request.requestURI == "/actuator/health") return

        val startTime = System.nanoTime()
        val wrappedRequest = ContentCachingRequestWrapper(request)
        val wrappedResponse = ContentCachingResponseWrapper(response)
        val requestTimestamp = OffsetDateTime.now(ZoneId.of("Asia/Seoul")).format(ISO_OFFSET_DATE_TIME)
        val urlWithParameters = request.requestURI + (request.queryString?.let { "?$it" } ?: "")

        try {
            MDC.put("requestMethod", request.method)
            MDC.put("requestUrl", urlWithParameters)
            MDC.put("requestHeaders", extractHeaders(request))
            MDC.put("x-amzn-trace-id", request.getHeader("x-amzn-trace-id") ?: "not available")
            MDC.put("userUuid", request.getHeader("user-uuid") ?: "not available")
            MDC.put("requestTimestamp", requestTimestamp)

            filterChain.doFilter(wrappedRequest, wrappedResponse)
            val requestBody = getRequestBody(wrappedRequest)
            MDC.put("requestBody", requestBody)
        } finally {
            val responseBody = String(wrappedResponse.contentAsByteArray)
            val processingTimeSeconds = (System.nanoTime() - startTime) / 1_000_000_000.0
            val statusCode = wrappedResponse.status

            MDC.put("responseBody", responseBody)
            MDC.put("responseStatus", statusCode.toString())
            MDC.put("processing_time_s", String.format("%.3f", processingTimeSeconds))

            wrappedResponse.copyBodyToResponse()

            // 정상 응답시에만 여기서 로깅하고, 에러 발생시에는 GlobalExceptionHandler 에서 로깅
            if (statusCode < 400) {
                log.info("")
            }
            MDC.clear()
        }
    }

}
