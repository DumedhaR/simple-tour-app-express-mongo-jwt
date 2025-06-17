const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const sendErrorDev = (req, res, err) => {
  //api
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      err: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // render web
  console.log('error', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went worng',
    msg: err.message,
  });
};

const handleDuplicateFieldsDB = (err) => {
  const key = Object.keys(err.keyValue)[0];
  const value = Object.values(err.keyValue)[0];
  const message = `Duplicate value for "${key}": "${value}". Please use another value.`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token! please login again', 401);

const handleJWTExpireError = () =>
  new AppError('Your Session has been expired! please login again', 401);

const sendErrorProd = (req, res, err) => {
  // client will get full info on an operational error
  //api side
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // but client shouldnt need know about programming error or other unkown error, in such case:
    }
    // 1) log error
    console.log('error', err);

    // 2) send generic error as below
    return res.status(500).json({
      status: 'error',
      message: 'something went worng!',
    });
  }
  // render web
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went worng',
      msg: err.message,
    });
    // but client shouldnt need know about programming error or other unkown error, in such case:
  }
  // 1) log error
  console.log('error', err);

  // 2) send generic error as below
  return res.status(err.statusCode).render('error', {
    title: 'Something went worng',
    msg: 'Please try again later!',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(req, res, err);
  } else if (process.env.NODE_ENV === 'production') {
    //console.log(err);
    let error = { ...err, message: err.message, name: err.name };

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpireError();

    sendErrorProd(req, res, error);
  }
};
