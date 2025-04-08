package org.core.user.controller

import org.core.common.CustomResponse
import org.core.auth.domain.SecurityUser
import org.core.user.dto.UserResponse
import org.core.user.service.UserService
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
class UserController(private val userService: UserService) {

	@GetMapping("/api/v1/users/me")
	@PreAuthorize("isAuthenticated()")
	fun getUserInfo(@AuthenticationPrincipal securityUser: SecurityUser): CustomResponse<UserResponse.UserMe> {
		return CustomResponse.ok(userService.getUserMe(securityUser.id))
	}

}
