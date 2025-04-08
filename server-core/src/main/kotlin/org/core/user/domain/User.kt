package org.core.user.domain

import jakarta.persistence.*
import jakarta.persistence.EnumType.STRING
import org.core.auth.domain.OAuthProvider
import org.core.auth.domain.OAuthProviderConverter
import org.core.common.BaseEntity
import java.time.LocalDateTime

@Entity
@Table(name = "app_user")
class User(
	@Convert(converter = OAuthProviderConverter::class)
	@Column(name = "oauth_provider", nullable = false)
	val oauthProvider: OAuthProvider,

	@Column(name = "email", nullable = false, unique = true, length = 255)
	var email: String,

	@Column(name = "nickname", nullable = true, length = 255)
	var nickname: String?,

	@Column(name = "profile_image", nullable = true, length = 255)
	var profileImage: String?,

	@Enumerated(STRING)
	@Column(name = "role", nullable = false, length = 50)
	var role: UserRole,

	@Column(name = "login_count", nullable = false)
	var loginCount: Long,

	@Column(name = "deleted_at", nullable = true)
	var deletedAt: LocalDateTime?,
) : BaseEntity() {

	fun softDelete() {
		this.deletedAt = LocalDateTime.now()
	}

	companion object {
		fun create(
			oauthProvider: OAuthProvider,
			email: String,
			nickname: String,
			profileImage: String?,
			role: UserRole,
		): User {
			return User(
				oauthProvider = oauthProvider,
				email = email,
				nickname = nickname,
				profileImage = profileImage,
				role = role,
				loginCount = 1,
				deletedAt = null,
			)
		}
	}

}
