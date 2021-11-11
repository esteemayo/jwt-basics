const express = require('express');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.route('/signup').post(authController.signup);

router.route('/login').post(authController.login);

router.use(authController.protect);

router.route('/update-my-password').patch(authController.updatePassword);

router.route('/update-me').patch(userController.updateMe);

router.route('/delete-me').delete(userController.deleteMe);

router.route('/me').get(userController.getMe, userController.getUser);

router
    .route('/dashboard')
    .get(userController.dashboard);

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(
        authController.restrictTo('admin'),
        userController.updateUser,
    )
    .delete(
        authController.restrictTo('admin'),
        userController.deleteUser,
    );

module.exports = router;
