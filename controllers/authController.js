const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const asyncWrapper = require('../utils/asyncWrapper');
const ForbiddenError = require('../errors/forbidden');
const BadRequestError = require('../errors/badRequest');
const UnauthenticatedError = require('../errors/unathenticated');

const createSendToken = (user, statusCode, res) => {
    const token = user.generateAuthToken();

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        user,
    });
};

exports.signup = asyncWrapper(async (req, res, next) => {
    const newUser = _.pick(req.body, ['username', 'email', 'role', 'password', 'passwordConfirm', 'passwordChangedAt']);
    const user = await User.create({ ...newUser });

    createSendToken(user, StatusCodes.CREATED, res);
});

exports.login = asyncWrapper(async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return next(new BadRequestError('Please provide email and password'));
    }

    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.correctPassword(password))) {
        return next(new UnauthenticatedError('Incorrect username or password'));
    }

    createSendToken(user, StatusCodes.OK, res);
});

exports.protect = asyncWrapper(async (req, res, next) => {
    // getting token and check if it's there
    let token;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return next(new UnauthenticatedError('You are not logged in! Please log in to get access'));
    }

    // verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // check if user still exists
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
        return next(new UnauthenticatedError('The user belonging to this token does no longer exist'));
    }

    // check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new UnauthenticatedError('User recently changed password! Please log in again'));
    }

    // grant access to protected routes
    req.user = currentUser;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ForbiddenError('You do not have permission to perform this action'));
        }
        next();
    };
};

exports.updatePassword = asyncWrapper(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(req.body.passwordCurrent))) {
        return next(new UnauthenticatedError('Your current password is incorrect'));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createSendToken(user, StatusCodes.OK, res);
});
