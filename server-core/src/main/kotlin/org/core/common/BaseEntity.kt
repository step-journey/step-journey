package org.core.common

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.LocalDateTime
import java.util.*

@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	@Column(
		name = "id",
		nullable = false,
		updatable = false,
		columnDefinition = "UUID"
	)
	val id: UUID? = null

	@CreatedDate
	@Column(name = "created_at", nullable = false, updatable = false)
	lateinit var createdAt: LocalDateTime
		protected set

	@LastModifiedDate
	@Column(name = "updated_at", nullable = false)
	lateinit var updatedAt: LocalDateTime
		protected set

}
