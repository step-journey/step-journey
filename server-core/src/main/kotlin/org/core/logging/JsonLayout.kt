package org.core.logging

import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.LayoutBase
import com.fasterxml.jackson.databind.ObjectMapper
import org.core.logging.LogUtil.Companion.formatStackTrace
import org.core.util.TimeUtil.Companion.convertMillisToISOString

class JsonLayout : LayoutBase<ILoggingEvent>() {
	private val objectMapper = ObjectMapper()

	override fun doLayout(event: ILoggingEvent): String {
		val logMap = mutableMapOf<String, Any>()

		logMap["timestamp"] = convertMillisToISOString(event.timeStamp)
		logMap["level"] = event.level.toString()
		logMap["thread"] = event.threadName
		logMap["logger"] = event.loggerName
		logMap["message"] = event.formattedMessage

		// 예외가 발생한 경우 예외 정보 추가
		if (event.throwableProxy != null) {
			logMap["exception"] = event.throwableProxy.className
			logMap["error_message"] = event.throwableProxy.message ?: ""
			logMap["stack_trace"] = formatStackTrace(event.throwableProxy)
		}

		return objectMapper.writeValueAsString(logMap) + System.lineSeparator()
	}

}
