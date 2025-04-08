package org.core.auth.domain

import jakarta.persistence.*
import org.core.common.BaseEntity
import org.core.user.domain.User
import java.time.LocalDateTime

@Entity
@Table(name = "refresh_token")
class RefreshToken(
	@Column(name = "token", nullable = false, unique = true, length = 512)
	val token: String,

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	val user: User,

	@Column(name = "expired_at", nullable = false, updatable = false)
	val expiredAt: LocalDateTime
) : BaseEntity() {

	companion object {
		fun create(
			token: String,
			user: User,
			expiredAt: LocalDateTime
		): RefreshToken {
			return RefreshToken(
				token = token,
				user = user,
				expiredAt = expiredAt
			)
		}
	}

}
