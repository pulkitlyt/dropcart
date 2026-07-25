import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},
		role: {
			type: String,
			enum: ['buyer', 'seller', 'admin'],
			default: 'buyer',
		},
		refreshToken: {
			type: String,
		},
	},
	{
		timestamps: true,
	},
)

userSchema.pre('save', async function (next) {
    console.log('PRE SAVE HOOK RUNNING')
  console.log('isModified password:', this.isModified('password'))
	if (!this.isModified('password')) {
		return 
	}
    this.password = await bcrypt.hash(this.password, 10)
    console.log('PASSWORD HASHED:', this.password)

	
})
userSchema.methods.isPasswordCorrect = async function (password) {
	return bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
	return jwt.sign(
		{
			_id: this._id,
			email: this.email,
			name: this.name,
			role: this.role,
		},
		process.env.ACCESS_TOKEN_SECRET,
		{
			expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
		},
	)
}

userSchema.methods.generateRefreshToken = function () {
	return jwt.sign(
		{
			_id: this._id,
		},
		process.env.REFRESH_TOKEN_SECRET,
		{
			expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
		},
	)
}

const User = mongoose.model('User', userSchema)

export default User
