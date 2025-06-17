const path = require('path');
const express = require('express');
// const fs = require('fs');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss-clean');
const hpp = require('hpp');
const AppError = require('../utils/appError');
const globalErrorHandler = require('../controller/errorController');
const userRouter = require('../routes/userRouter');
const tourRouter = require('../routes/tourRouter');
const reviewRouter = require('../routes/reviewRouter');
const viewRouter = require('../routes/reviewRouter');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// serve static file in puplic folder, access throught url
app.use(express.static(path.join(__dirname, 'public')));

// Enable extended query parsing
app.set('query parser', 'extended');

// Globle Middlewares ------------------

// set security http headers
app.use(helmet());

// development env logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request rate by client to prevent some attack
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour',
});
app.use('/api', limiter);

// body parser, reading data from body into => req.body
app.use(express.json());

// data sanitization against no sql query injection
// in recent versions of Express (particularly Express 5.x), the req.query object is defined as read-only.
// The express-mongo-sanitize middleware attempts to overwrite req.query, leading to this error.
// app.use(mongoSanitize());

// data sanitization against XSS attacks
// in recent versions of Express (particularly Express 5.x), the req.query object is defined as read-only.
// xss-clean is trying to overwrite req.query, which is read-only in Express 5. This breaks the app.
// app.use(xss());

// prevent prameter polution attacks
app.use(hpp({ whitelist: ['duration', 'difficulty', 'price'] }));

// test middleware to set req time into => req.reqTime
app.get((req, res, next) => {
  req.reqTime = new Date().toISOString();
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
// this for handling false url/req, should stay on the end of the route line
app.all('/{*splat}', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: Can't find the ${req.originalUrl} on this server,
  // });
  // const err = new Error(Can't find the ${req.originalUrl} on this server!);
  // err.status = 'fail';
  // err.statusCode = 404;

  // this will pass the err to next middleware,
  // but instead of passing err to next, will skip the all other middlweare
  // in the satck and pass it to error handling middleware at the end of line.
  // next(err);

  next(new AppError(`Can't find the ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
