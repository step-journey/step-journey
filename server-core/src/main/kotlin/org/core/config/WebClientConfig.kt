package org.core.config

import io.netty.channel.ChannelOption
import io.netty.handler.timeout.ReadTimeoutHandler
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.client.reactive.ReactorClientHttpConnector
import org.springframework.web.reactive.function.client.*
import reactor.core.publisher.Mono
import reactor.netty.Connection
import reactor.netty.http.client.HttpClient
import reactor.netty.resources.ConnectionProvider
import java.time.Duration
import java.util.concurrent.TimeUnit

@Configuration
class WebClientConfig {

	private val logger = LoggerFactory.getLogger(WebClientConfig::class.java)

	/**
	 * Netty httpClient 설정을 위한 Bean (ConnectionPool, Timeouts 등)
	 */
	@Bean
	fun httpClient(
		@Value("\${http.client.connect-timeout-millis}") connectTimeout: Int,
		@Value("\${http.client.pool.name:defaultPool}") poolName: String,
		@Value("\${http.client.pool.max-connections}") maxConnections: Int,
		@Value("\${http.client.read-timeout-seconds}") readTimeoutSeconds: Long,
	): HttpClient {
		// ConnectionProvider: 커넥션 풀 설정
		val provider = ConnectionProvider.builder(poolName)
			.maxConnections(maxConnections)  // 동시에 열 수 있는 최대 커넥션 수
			.pendingAcquireTimeout(Duration.ofSeconds(5)) // 커넥션이 부족할 때 얻기 대기 타임아웃
			.build()

		return HttpClient.create(provider)
			// 연결 타임아웃
			.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectTimeout)
			// ReadTimeoutHandler: 서버로부터 응답 수신까지 걸리는 시간 제한
			.doOnConnected { connection: Connection ->
				connection.addHandlerLast(ReadTimeoutHandler(readTimeoutSeconds, TimeUnit.SECONDS))
			}
	}

	/**
	 * WebClient 빌더에 공통 설정 적용 (로깅, 에러 처리 등)
	 */
	@Bean
	fun webClientBuilder(httpClient: HttpClient): WebClient.Builder {
		return WebClient.builder()
			.clientConnector(ReactorClientHttpConnector(httpClient))
			.exchangeStrategies(
				ExchangeStrategies.builder()
					// JSON 응답 디코딩시 메모리 버퍼 최대 크기 설정 (DataBufferLimitException 방지)
					.codecs { configurer ->
						 configurer.defaultCodecs().maxInMemorySize(1 * 1024 * 1024)
					}
					.build()
			)
			.defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
			.filter(loggingFilter())
			.filter(errorHandlingFilter())
	}

	@Bean
	fun defaultWebClient(builder: WebClient.Builder): WebClient {
		return builder
			.build()
	}

	@Bean
	fun exampleApiClient(builder: WebClient.Builder): WebClient {
		return builder
			.baseUrl("https://api.example.com")
			.build()
	}

	private fun loggingFilter(): ExchangeFilterFunction {
		return ExchangeFilterFunction.ofRequestProcessor { request ->
			// TODO: WebClient 요청, 응답 로깅 로직 구현
			Mono.just(request)
		}
	}

	private fun errorHandlingFilter(): ExchangeFilterFunction {
		return ExchangeFilterFunction.ofResponseProcessor { clientResponse ->
			if (clientResponse.statusCode().is4xxClientError) {
				clientResponse.createException().flatMap { error ->
					logger.error("[WebClient] 4xx 에러 발생: {}", error.message)
					Mono.error(error)
				}
			} else if (clientResponse.statusCode().is5xxServerError) {
				clientResponse.createException().flatMap { error ->
					logger.error("[WebClient] 5xx 에러 발생: {}", error.message)
					Mono.error(error)
				}
			} else {
				Mono.just(clientResponse)
			}
		}
	}

}
