package org.core.user.domain

enum class UserRole {
	USER,
	ADMIN;

	fun asAuthority(): String = "ROLE_${name}"

	companion object {
		val allAuthorities = entries.map { it.asAuthority() }
	}

}
