const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  const newToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return newToken;
};

const createAndSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  // const cookieOptions = {
  //   expires: new Date(
  //     Date.now() +
  //       Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
  //   ),
  //   httpOnly: true,
  // };
  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  // res.cookie('jwt', token, cookieOptions);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // send welcome email
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  // send jwt with response
  const token = signToken(newUser._id);
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // console.log(email, password);

  // check user has provided email and password
  if (!email || !password) {
    return next(new AppError('Please provide both email & password'));
  }

  // verify users given credentials are correct
  const user = await User.findOne({ email }).select('+password');
  // const isCorrect = await user.correctPassword(password, user.password);
  // console.log(user);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // if everything ok, send token to user
  createAndSendToken(user, 200, req, res);
});

exports.logOut = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // console.log(req.headers);
  // Getting token and check its in the headers or cookie
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('Unauthorized, please login first', 401));
  }
  // console.log(token);

  // Verify token
  const verifyAsync = promisify(jwt.verify); // promisify convert a callback-based function into a Promise-based one
  const decoded = await verifyAsync(token, process.env.JWT_SECRET);

  // Check if the user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('User no longer exist.', 401));
  }

  // Check if user changed password after token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Your session is expired! please login again', 401),
    );
  }

  // Grant access to Api
  req.user = user;
  res.locals.user = user;
  next();
});

exports.isLogged = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const token = req.cookies.jwt;

      const verifyAsync = promisify(jwt.verify);
      // promisify convert a callback-based function into a Promise-based one
      const decoded = await verifyAsync(token, process.env.JWT_SECRET);
      // Check if the user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return next();
      }
      // Check if user changed password after token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // THERE IS A LOGGED IN USER
      res.locals.user = user;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// Middleware for role based authorization
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles: ['admin', 'lead-guide'], user.role: 'user' = no permission
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permission to perform this action', 403),
      );
    }
    next();
  };

// Middleware that send rest url to user email upon a password forgot request
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Find user base on given email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There no user available with given email', 404));
  }

  // Genarate ramdom reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false }); // validateBeforeSave: false stop unwanted validations here

  // send it to user's email
  try {
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    // const message = `Forgot your password? Submit a PATCH request with your new password and
    // passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`;

    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password rest link (valid for 10mins)',
    //   message,
    // });
    await new Email(user, resetUrl).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the reset email. Try again later!',
      ),
      500,
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user base on the reset token
  const hashedResetToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has been expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // save and update passwordChangedAt prop for the user
  await user.save();

  // signin user and send new jwt token
  createAndSendToken(user, 200, req, res);
});

exports.updatePassword = async (req, res, next) => {
  // get user from db collection and check given current passowrd, match with user password

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Incorrect current password', 401));
  }
  // save and update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // user.findByIdAndUpdate() will not work well as it will trigger validations,
  // post & pre triggers made for create() and save()
  await user.save();

  // signin user and send new jwt token
  createAndSendToken(user, 200, req, res);
};
