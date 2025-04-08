package org.core.auth.service

import org.core.auth.domain.RefreshToken
import org.core.auth.repository.RefreshTokenRepository
import org.core.exception.ErrorType.NOT_FOUND_REFRESH_TOKEN
import org.core.exception.general.NotFoundException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RefreshTokenService(
	private val refreshTokenRepository: RefreshTokenRepository,
) {
	@Transactional(readOnly = true)
	fun findByToken(token: String): RefreshToken {
		return refreshTokenRepository.findByToken(token)
			?: throw NotFoundException(NOT_FOUND_REFRESH_TOKEN, token)
	}

}
