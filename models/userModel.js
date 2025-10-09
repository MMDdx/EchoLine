const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    avatar:{
        type: String,
        default: 'default-user.jpeg',
    },
    email:{
        type: String,
        required: true,
        unique: true,
        validate: [validator.isEmail, "please enter a valid email"],
    },
    firstName:{
        type: String,
        default: "new User"
    },
    lastName:{
        type: String,
    },
    joinedAt:{
        type: Date,
        default: Date.now(),
    },
    password:{
        type: String,
        required: [true, "Password is required"],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    confirmPassword: {
        type: String,
        required: [true, "confirm password is required"],
        validate:{
            // this only works only on SAVE AND CREATE!
            validator:function (val){
                return val === this.password
            },
            message: "confirm password is not equal to password"
        }
    },
    role:{
        type: String,
        default: 'user',
        enum: ["user",'admin']
    },
    active: {
        type: Boolean,
        default: false,
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    passwordChangedAt: Date,
},{
    toJSON: {virtuals: true},
    toObject: {virtuals: true},
})
userSchema.index({username:1})

userSchema.pre('save',async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
    next();
})

userSchema.methods.comparePassword = async function (candidatePassword, password) {
    return await bcrypt.compare(candidatePassword, password);
}

userSchema.methods.changedPasswordAfter = function (iat) {
    if (this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        return iat < changedTimestamp
    }
    return false
}


userSchema.methods.createVerifyEmailToken = function (){
    const token = crypto.randomBytes(32).toString("hex");
    this.verificationToken = crypto.createHash("sha256").update(token).digest("hex");
    this.verificationTokenExpires = Date.now() + 3 * 600 * 1000

    return token;
}

const User = mongoose.model('User', userSchema);

module.exports = User;