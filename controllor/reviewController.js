const Review = require('../model/Review');
// const ApiFeatures = require('../utils/apiFeaturs');
// const AppError = require('../utils/appError');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  // allowing nested routes options
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.reqTime,
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

// exports.getTourReviews = catchAsync(async (req, res, next) => {
//   const reviews = await Review.find({ tour: req.params.id });

//   if (!reviews) {
//     return next(new AppError('No reviews found for given tour ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.reqTime,
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

// exports.getUserReviews = catchAsync(async (req, res, next) => {
//   const reviews = await Review.find({ user: req.user._id });

//   if (!reviews) {
//     return next(new AppError('No reviews found for given user ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.reqTime,
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });
