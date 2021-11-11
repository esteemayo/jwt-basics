const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const factory = require('./handlerFactory');
const asyncWrapper = require('../utils/asyncWrapper');
const BadRequestError = require('../errors/badRequest');

exports.updateMe = asyncWrapper(async (req, res, next) => {
    const { password, passwordConfirm } = req.body;
    if (password || passwordConfirm) {
        return next(new BadRequestError(`This route is not for password updates. Please use update ${req.protocol}://${req.get('host')}/api/v1/users/update-my-password`));
    }

    const filterBody = _.pick(req.body, ['username', 'email']);

    const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidators: true,
    });

    res.status(StatusCodes.OK).json({
        status: 'success',
        updatedUser,
    });
});

exports.deleteMe = asyncWrapper(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(StatusCodes.NO_CONTENT).json({
        status: 'success',
        user: null,
    });
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.dashboard = (req, res) => {
    const luckyNumber = Math.floor(Math.random() * 100);

    const capitalize = ([firstLetter, ...rest]) => {
        return `${firstLetter.toUpperCase()}${rest.join('')}`;
    };

    res.status(StatusCodes.OK).json({
        status: 'success',
        message: `Hello, ${capitalize(req.user.username)}`,
        secret: `Here is your authorized data, your lucky number is ${luckyNumber}`,
    });
};

exports.createUser = (req, res) => {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'fail',
        message: `This route is not defined! Please use ${req.protocol}://${req.get('host')}/api/v1/users/signup instead`
    });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// do NOT update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
