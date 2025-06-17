/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-console */
const mongoose = require('mongoose');
const slugyfi = require('slugify');
// const User = require('./User');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have less than or equal to 40 characters',
      ],
      minlength: [
        10,
        'A tour name must have more than or equal to 10 characters',
      ],
      // validate: [validator.isAlpha, 'tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A rating must be above 1'],
      max: [5, 'A rating must be below 5'],
      set: (val) => Math.round(val * 10) / 10, // 4.666666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Disscount should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      // required: [true, 'tour must have a description'],?
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'tour must have a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // hide in query results
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: 'String',
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: 'String',
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    // guides: Array,
    // //emded guide data (but this type of case embed is not good so here we used refrencing)
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Document middleware, that runs before (pre) or after (post) , save() and create()
tourSchema.pre('save', function (next) {
  this.slug = slugyfi(this.name, { lower: true }); // this. points current document
  next();
});

tourSchema.pre('save', function (next) {
  console.log('A document about to save...');
  next();
});
// embed tour guide doc datainto tour doc when user send user ids in gudes attr,
// but embed for this type case not matching, refrencing better
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// Query middleware, pre and post
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); // this. points current query
  next();
});
// populate guides data automatically on each find__ query
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
// tourSchema.pre('findOne', function (next)
// tourSchema.pre('find', function (next)

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(docs); // this. points current query
//   next();
// });

// Aggregation middleware
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
