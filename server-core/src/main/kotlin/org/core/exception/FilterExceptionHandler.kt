package org.core.exception

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import org.springframework.web.servlet.HandlerExceptionResolver

/**
 * 필터에서 발생한 예외를 HandlerExceptionResolver 로 위임하는 필터
 * 이를 통해 필터에서 발생한 예외도 GlobalExceptionHandler 에서 처리할 수 있음
 */
@Component
class FilterExceptionHandler : OncePerRequestFilter() {

	@Autowired
	@Qualifier("handlerExceptionResolver")
	private lateinit var resolver: HandlerExceptionResolver

	override fun doFilterInternal(
		request: HttpServletRequest,
		response: HttpServletResponse,
		filterChain: FilterChain
	) {
		try {
			filterChain.doFilter(request, response)
		} catch (e: Exception) {
			resolver.resolveException(request, response, null, e)
		}
	}
}
