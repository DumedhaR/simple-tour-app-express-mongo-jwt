const mongoose = require('mongoose');
const Tour = require('./Tour');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must have a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must have a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// index to make sure that 0ne user can have only a review per tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this
    // .populate({
    //   path: 'tour',
    //   select: 'name',
    // })
    .populate({
      path: 'user',
      select: 'name photo',
    });
  next();
});

// Static method to find avg ratings
reviewSchema.statics.calAvgRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// update avg rating and no ratings upon a new review/update/del
// here this means, this document
reviewSchema.post('save', function () {
  this.constructor.calAvgRatings(this.tour);
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.targetReview = await this.findOne();
  next();
});

// await this.findOne(); does NOT work here, query has already executed
reviewSchema.post(/^findOneAnd/, async function () {
  await this.targetReview.constructor.calAvgRatings(this.targetReview.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
