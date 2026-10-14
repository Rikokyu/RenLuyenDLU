package dto

type ProfileMutation struct {
	FirstName  string `json:"firstName" binding:"required"`
	LastName   string `json:"lastName" binding:"required"`
	Gender     string `json:"gender" binding:"required"`
	BirthDay   string `json:"birthDay" binding:"required"`
	BirthPlace string `json:"birthPlace"`
	Phone      string `json:"phone" binding:"required"`
}
