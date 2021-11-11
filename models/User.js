const validator = require('validator');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const md5 = require('md5');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
        required: [true, 'Please tell us your username'],
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
        required: [true, 'Please provide your email address'],
        validate: [validator.isEmail, 'Please provide a valid email'],
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: 'Passwords are not the same',
        },
    },
    passwordChangedAt: Date,
    active: {
        type: Boolean,
        default: true,
        select: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

userSchema.virtual('gravatar').get(function () {
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;

    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.generateAuthToken = function () {
    return jwt.sign({ id: this._id, username: this.username }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

userSchema.methods.correctPassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimeStamp;
    }
    // return false if password's not changed
    return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
