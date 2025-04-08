package org.core.user.service

import org.core.auth.domain.OAuthProvider
import org.core.exception.ErrorType.INVALID_REQUEST
import org.core.exception.general.NotFoundException
import org.core.user.domain.User
import org.core.user.domain.UserRole
import org.core.user.dto.UserResponse
import org.core.user.repository.UserRepository
import org.core.util.StringUtil.extractUsernameFromEmail
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class UserService(private val userRepository: UserRepository) {

	@Transactional(readOnly = true)
	fun getUserMe(id: UUID): UserResponse.UserMe {
		val user = findById(id)
		return UserResponse.UserMe.from(user)
	}

	@Transactional(readOnly = true)
	fun findById(id: UUID): User {
		return userRepository.findById(id).orElseThrow {
			NotFoundException(INVALID_REQUEST, id.toString())
		}
	}

	@Transactional
	fun findByEmailOrCreate(oauthProvider: OAuthProvider, email: String): User {
		return userRepository.findByEmail(email)
			?: userRepository.save(
				User.create(
					oauthProvider = oauthProvider,
					email = email,
					nickname = extractUsernameFromEmail(email),
					profileImage = null,
					role = UserRole.USER,
				)
			)
	}

	@Transactional
	fun incrementLoginCount(user: User): User {
		user.loginCount++
		return userRepository.save(user)
	}

}
