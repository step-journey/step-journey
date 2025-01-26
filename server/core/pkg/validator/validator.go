package validator

type Validator struct{}

func NewValidator() *Validator {
	return &Validator{}
}

func (v *Validator) ValidateUsername(username string) bool {
	// 간단 예시: 비어있지 않은지만 체크
	return username != ""
}
