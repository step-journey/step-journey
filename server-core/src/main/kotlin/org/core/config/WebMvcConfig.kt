package org.core.config

import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebMvcConfig : WebMvcConfigurer{

    companion object {
        private const val NULL_ORIGIN = "null"  // 로컬의 HTML 파일의 요청시 CORS 허용을 위해 추가
        private const val LOCALHOST_5173 = "http://localhost:5173"
    }

    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/**")
            .allowedOrigins(NULL_ORIGIN, LOCALHOST_5173)
            .allowedMethods(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.PUT.name(),
                HttpMethod.DELETE.name(),
                HttpMethod.OPTIONS.name()
            )
            .allowedHeaders("*")
            .allowCredentials(true)
    }

}
