package org.core.auth.domain

import org.core.user.domain.UserRole
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import java.util.*

data class SecurityUser(
	val id: UUID,
	private val email: String,
	val role: UserRole
) : UserDetails {
	// 권한 목록을 Spring Security 가 이해하는 형태로 변환
	override fun getAuthorities() = listOf(SimpleGrantedAuthority(role.asAuthority()))

	// JWT 인증에서는 비밀번호를 저장하지 않으므로 null 반환
	override fun getPassword() = null

	// Spring Security 에서 사용자 식별자로 이메일 사용
	override fun getUsername() = email

	// 계정 상태 관련 메서드들 (모두 true로 설정하여 항상 유효한 상태)
	override fun isAccountNonExpired() = true
	override fun isAccountNonLocked() = true
	override fun isCredentialsNonExpired() = true
	override fun isEnabled() = true
}
