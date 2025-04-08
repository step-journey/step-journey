package org.core.util

object StringUtil {
	fun extractUsernameFromEmail(email: String): String {
		return email.split("@").firstOrNull() ?: email
	}
}
