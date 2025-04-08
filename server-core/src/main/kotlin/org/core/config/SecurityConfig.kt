package org.core.config

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.servlet.http.HttpServletResponse
import org.core.auth.service.RefreshTokenService
import org.core.auth.util.JwtUtils
import org.core.common.CustomResponse
import org.core.exception.ErrorType.FAIL_JWT_AUTH
import org.core.exception.FilterExceptionHandler
import org.core.filter.JwtAuthFilter
import org.core.user.service.UserService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.security.web.context.SecurityContextHolderFilter

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig(
	private val jwtUtils: JwtUtils,
	private val userService: UserService,
	private val refreshTokenService: RefreshTokenService,
	private val filterExceptionHandler: FilterExceptionHandler,
	private val objectMapper: ObjectMapper
) {

	@Bean
	fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
		return http
			.csrf { it.disable() }
			.formLogin { it.disable() }
			.httpBasic { it.disable() }
			.sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
			.authorizeHttpRequests { auth ->
				auth
					.requestMatchers("/api/v1/auth/**").permitAll()
					.requestMatchers("/actuator/**").permitAll()
					.anyRequest().authenticated()
			}
			// 인증 실패 시 401 응답을 반환하도록 AuthenticationEntryPoint 설정
			.exceptionHandling { ex ->
				ex.authenticationEntryPoint { _, response, _ ->
					response.status = HttpServletResponse.SC_UNAUTHORIZED
					response.contentType = "application/json;charset=UTF-8"

					val errorResponse = CustomResponse.error(
						code = FAIL_JWT_AUTH.code,
						message = FAIL_JWT_AUTH.message
					)
					val jsonResponse = objectMapper.writeValueAsString(errorResponse)
					response.writer.write(jsonResponse)
				}
			}
			// 예외 처리 필터를 Spring Security 필터 체인의 가장 앞에 배치
			.addFilterBefore(filterExceptionHandler, SecurityContextHolderFilter::class.java)
			.addFilterBefore(
				JwtAuthFilter(jwtUtils, userService, refreshTokenService),
				UsernamePasswordAuthenticationFilter::class.java
			)
			.build()
	}

}
