package org.core.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@ConfigurationProperties(prefix = "app")
class AppProperties {
	var cookieDomain: String = ""
	var clientBaseUrl: String = ""
	var serverBaseUrl: String = ""
	var accessTokenExpirationSeconds: Int = 900 // 15 minutes
	var refreshTokenExpirationSeconds: Int = 1209600 // 14 days
}
