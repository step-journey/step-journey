package org.core.auth.domain

import jakarta.persistence.AttributeConverter
import jakarta.persistence.Converter

@Converter(autoApply = true)
class OAuthProviderConverter : AttributeConverter<OAuthProvider, String> {
	override fun convertToDatabaseColumn(attribute: OAuthProvider?): String? {
		return attribute?.name
	}

	override fun convertToEntityAttribute(dbData: String?): OAuthProvider? {
		if (dbData == null) return null
		return OAuthProvider.valueOf(dbData.uppercase())
	}
}
