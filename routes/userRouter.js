const express = require('express');
const userControllor = require('../controllor/userControllor');
const authControllor = require('../controllor/authControllor');

const router = express.Router();

router.route('/signup').post(authControllor.signUp);
router.route('/login').post(authControllor.logIn);
router.route('/logout').get(authControllor.logOut);
router.route('/forgotPassword').post(authControllor.forgotPassword);
router.route('/resetPassword/:token').patch(authControllor.resetPassword);

// Protect all routes after this middleware
router.use(authControllor.protect);

// Req logged user
router.route('/updateMyPassword').patch(authControllor.updatePassword);
router
  .route('/updateMe')
  .patch(
    userControllor.uploadUserPhoto,
    userControllor.resizeUserPhoto,
    userControllor.updateMe,
  );
router.route('/deleteMe').delete(userControllor.deleteMe);

// Only for admin role
router.use(authControllor.restrictTo('admin'));

router.route('/').get(userControllor.getAllUsers);
router
  .route('/:id')
  .get(userControllor.getUser)
  .patch(userControllor.updateUser)
  .delete(userControllor.deleteUser);

module.exports = router;
