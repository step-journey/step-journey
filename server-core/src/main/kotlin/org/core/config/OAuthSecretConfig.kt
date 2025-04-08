package org.core.config

import com.fasterxml.jackson.databind.ObjectMapper
import org.core.exception.ErrorType.*
import org.core.exception.general.ExternalServiceException
import org.core.exception.general.ValidationException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.config.BeanFactoryPostProcessor
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.ConfigurableEnvironment
import org.springframework.core.env.PropertiesPropertySource
import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest
import java.util.Properties

@Configuration
class OAuthSecretConfig {
	private val logger = LoggerFactory.getLogger(OAuthSecretConfig::class.java)
	private val objectMapper = ObjectMapper()

	companion object {
		private const val OAUTH_SECRET_ENV_VAR = "OAUTH_SECRET"
	}

	@Bean
	fun oauthSecretProcessor(environment: ConfigurableEnvironment): BeanFactoryPostProcessor {
		return BeanFactoryPostProcessor { _: ConfigurableListableBeanFactory ->
			try {
				// 시크릿 JSON 로드
				val secretJson = loadSecrets(environment)

				// JSON 파싱
				val secretsMap = objectMapper.readValue(secretJson, Map::class.java) as Map<String, String>

				// 설정 적용
				val properties = createOAuthProperties(secretsMap, environment)

				// OAuth 시크릿을 애플리케이션 설정에 동적으로 추가 (최우선 적용)
				environment.propertySources.addFirst(
					PropertiesPropertySource("oauthSecrets", properties)
				)

				logger.info("OAuth secrets successfully loaded and applied")
			} catch (e: Exception) {
				throw ExternalServiceException(OAUTH_SECRET_LOAD_FAILED, "", e)
			}
		}
	}

	private fun loadSecrets(environment: ConfigurableEnvironment): String {
		return if (environment.activeProfiles.contains("local")) {
			// 로컬 환경에서는 AWS Secrets Manager 에서 직접 로드
			loadFromSecretsManager(environment)
		} else {
			// 그 외 환경에서는 환경 변수에서 로드 (ECS 제공)
			loadEnvironmentSecrets()
		}
	}

	/**
	 * AWS Secrets Manager 시크릿 로드
	 */
	private fun loadFromSecretsManager(environment: ConfigurableEnvironment): String {
		// ARN 대신 시크릿 이름 사용
		val secretName = environment.getProperty("app.aws.secret-name")
			?: throw ValidationException(MISSING_CONFIGURATION, "app.aws.secret-name")

		// AWS 프로필 설정
		val awsProfile = environment.getProperty("app.aws.profile")

		logger.info("Loading OAuth secrets from AWS Secrets Manager using profile '{}': {}", awsProfile, secretName)

		// AWS 리전 설정
		val regionStr = environment.getProperty("app.aws.region") ?: "ap-northeast-2"
		val region = Region.of(regionStr)

		try {
			// AWS 자격 증명 공급자 설정
			val credentialsProvider = ProfileCredentialsProvider.builder()
				.profileName(awsProfile)
				.build()

			// Secrets Manager 클라이언트 생성
			val secretsClient = SecretsManagerClient.builder()
				.region(region)
				.credentialsProvider(credentialsProvider)
				.build()

			// 시크릿 값 요청 - ARN 대신 이름 사용
			val valueRequest = GetSecretValueRequest.builder()
				.secretId(secretName)
				.build()

			val valueResponse = secretsClient.getSecretValue(valueRequest)

			// 시크릿 문자열 반환
			logger.info("Successfully retrieved OAuth secret from AWS Secrets Manager")
			return valueResponse.secretString()
		} catch (e: Exception) {
			logger.error("Failed to load secrets from AWS Secrets Manager: {}", e.message)
			throw ExternalServiceException(AWS_SECRET_ACCESS_FAILED, "", e)
		}
	}

	/**
	 * 환경 변수에서 OAuth 시크릿 JSON 로드
	 *
	 * AWS 시크릿 매니저에 저장된 OAuth 시크릿 값이 ECS 태스크 정의 containerDefinitions.secrets 항목에서 참조되어
	 * 컨테이너의 OAUTH_SECRET 환경 변수로 주입됨. 컨테이너 시작 시 ECS 서비스가 해당 시크릿을 자동으로 가져와 환경 변수에 설정함.
	 *
	 * 참고: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html#secrets-envvar-secrets-manager-update-container-definition
	 */
	private fun loadEnvironmentSecrets(): String {
		val oauthSecretJson = System.getenv(OAUTH_SECRET_ENV_VAR)
			?: throw ValidationException(OAUTH_ENV_VAR_MISSING)
		return oauthSecretJson
	}

	/**
	 * OAuth 프로퍼티 생성
	 */
	private fun createOAuthProperties(
		secretsMap: Map<String, String>,
		environment: ConfigurableEnvironment
	): Properties {
		val properties = Properties()
		val serverBaseUrl = environment.getProperty("app.server-base-url")
			?: throw ValidationException(MISSING_CONFIGURATION, "app.server-base-url")

		// Google
		properties["oauth.google-client-id"] = secretsMap["google_client_id"]
			?: throw ValidationException(MISSING_CONFIGURATION, "google_client_id")
		properties["oauth.google-client-secret"] = secretsMap["google_client_secret"]
			?: throw ValidationException(MISSING_CONFIGURATION, "google_client_secret")
		properties["oauth.google-scopes"] = "profile,email"
		properties["oauth.google-redirect-uri"] = "$serverBaseUrl/api/v1/auth/google/callback"

		// Naver
		properties["oauth.naver-client-id"] = secretsMap["naver_client_id"]
			?: throw ValidationException(MISSING_CONFIGURATION, "naver_client_id")
		properties["oauth.naver-client-secret"] = secretsMap["naver_client_secret"]
			?: throw ValidationException(MISSING_CONFIGURATION, "naver_client_secret")
		properties["oauth.naver-redirect-uri"] = "$serverBaseUrl/api/v1/auth/naver/callback"

		// Kakao
		properties["oauth.kakao-client-id"] = secretsMap["kakao_rest_api_key"]
			?: throw ValidationException(MISSING_CONFIGURATION, "kakao_rest_api_key")
		properties["oauth.kakao-client-secret"] = secretsMap["kakao_client_secret"]
			?: throw ValidationException(MISSING_CONFIGURATION, "kakao_client_secret")
		properties["oauth.kakao-scopes"] = "account_email"
		properties["oauth.kakao-redirect-uri"] = "$serverBaseUrl/api/v1/auth/kakao/callback"

		return properties
	}
}
