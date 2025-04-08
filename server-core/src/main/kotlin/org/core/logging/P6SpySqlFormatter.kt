package org.core.logging;

import com.p6spy.engine.spy.P6SpyOptions
import com.p6spy.engine.spy.appender.MessageFormattingStrategy
import jakarta.annotation.PostConstruct
import org.hibernate.engine.jdbc.internal.FormatStyle
import org.springframework.context.annotation.Configuration

/**
 * P6Spy 사용한 SQL 쿼리 로깅 포맷터
 * 데이터베이스 쿼리 실행을 가로채서 실행 시간, 호출 위치, SQL 문 등을 포맷팅하여 로그로 출력함
 */
@Configuration
class P6SpySqlFormatter : MessageFormattingStrategy {

    /**
     * 빈 초기화 시 P6Spy 로깅 포맷을 현재 클래스로 설정
     */
    @PostConstruct
    fun setLogMessageFormat() {
        P6SpyOptions.getActiveInstance().logMessageFormat = this::class.java.name
    }

    /**
     * SQL 쿼리를 포맷팅하여 로그 메시지 생성
     */
    override fun formatMessage(connectionId: Int, now: String?, elapsed: Long, category: String?, prepared: String?, sql: String?, url: String?): String {
        var formattedSql = sql
        if (!sql.isNullOrBlank() && category == "statement") {
            // SQL 문 유형에 따라 적절한 포맷 적용
            formattedSql = when {
                // DDL 문(create, alter, comment)인 경우 DDL 포맷 적용
                sql.trim().startsWith("create", ignoreCase = true) ||
                        sql.trim().startsWith("alter", ignoreCase = true) ||
                        sql.trim().startsWith("comment", ignoreCase = true) -> FormatStyle.DDL.formatter.format(sql)
                // 그 외의 경우 기본 포맷 적용
                else -> FormatStyle.BASIC.formatter.format(sql)
            }
        }
        // 로그 메시지 형식: [카테고리] | 실행시간 | 호출위치 | SQL
        return "\n[$category] | $elapsed ms | ${stackTrace()} | $formattedSql"
    }

    /**
     * SQL 을 호출한 실제 애플리케이션 코드의 위치 추적
     */
    private fun stackTrace(): String? {
        // 스레드 스택에서 시스템/라이브러리 코드를 제외한 스택 정보 필터링
        val filteredStackTraces = Thread.currentThread().stackTrace
            .filterNot {
                it.className.startsWith("java.") ||
                        it.className.startsWith("javax.") ||
                        it.className.startsWith("jakarta.") ||
                        it.className.startsWith("sun.") ||
                        it.className.startsWith("org.springframework.") ||
                        it.className.startsWith("org.hibernate.") ||
                        it.className.startsWith("com.p6spy.") ||
                        it.className.startsWith("net.sf.cglib.") ||
                        it.className.startsWith("kotlin.reflect.") ||
                        it.className.startsWith("org.core.logging.P6SpySqlFormatter")
            }

        // 실제 애플리케이션 코드(org.core 패키지)에서 SQL 을 호출한 첫 번째 위치 찾기
        return filteredStackTraces.firstOrNull { it.className.startsWith("org.core") }
            ?.let { "${it.className}.${it.methodName}(${it.fileName}:${it.lineNumber})" }
    }
}
