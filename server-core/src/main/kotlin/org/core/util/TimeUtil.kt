package org.core.util

import org.springframework.stereotype.Component
import java.time.*
import java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME


@Component
class TimeUtil {

    companion object {
        private val SEOUL_ZONE_ID: ZoneId = ZoneId.of("Asia/Seoul")

        fun convertMillisToISOString(millis: Long): String {
            val instant = Instant.ofEpochMilli(millis)
            val dateTime = ZonedDateTime.ofInstant(instant, SEOUL_ZONE_ID)
            return dateTime.format(ISO_OFFSET_DATE_TIME)
        }
    }

}
