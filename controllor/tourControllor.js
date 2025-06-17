const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../model/Tour');
// const ApiFeatures = require('../utils/apiFeaturs');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// Middleware for change req query
exports.aliasTopTours = (req, res, next) => {
  // Need the full URL, including host — use dummy origin if not available
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  // Use WHATWG URL to parse, cant chnage query directly in new node versions and url is also outdated
  const parsedUrl = new URL(fullUrl);

  // Cant use query obj since we use URL (url outdated), searchParams use to chnage query here.
  parsedUrl.searchParams.set('limit', '5');
  parsedUrl.searchParams.set('sort', '-ratingsAverage,price');
  parsedUrl.searchParams.set(
    'fields',
    'name,price,ratingsAverage,summary,difficulty',
  );

  // update req.url to only path + search (relative URL) — Express needs path + query, not full URL
  req.url = parsedUrl.pathname + parsedUrl.search;

  next();
};

const multerStorage = multer.memoryStorage(); //

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
// multi fields and multi fields
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
// upload.single('photo'); - for single field
// upload.array('images', 5) req.files - for single field and multiple  files

exports.resizeTourImages = async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );

  console.log(req.files);
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// Data Aggregate Pipeline
exports.getTourState = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'Succuess',
    data: { stats },
  });
});

exports.getMontlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTours: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'Succuess',
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  if (!distance || !latlng || !unit) {
    return next(
      new AppError(
        'Missing required parameters: distance, latlng, or unit.',
        400,
      ),
    );
  }
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  });
  res.status(200).json({
    status: 'Succuess',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = async (req, res, next) => {
  const { latlng, unit } = req.params;
  if (!latlng || !unit) {
    return next(
      new AppError('Missing required parameters: latlng, or unit.', 400),
    );
  }
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'Succuess',
    data: {
      data: distances,
    },
  });
};
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // console.log(req.query);

//   // Execute Query -----
//   const features = new ApiFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.reqTime,
//     results: tours.length,
//     data: {
//       tours,
//     },
//   });
// });

// exports.getTour = catchAsync(async (req, res, next) => {
//   // use populate to fill the referenced review/tour guides with thier data using stored Ids
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   // .populate({
//   //   path: 'guides',
//   //   select: '-__v -passwordChangedAt',
//   // });
//   // same as Tour.findOne({});

//   if (!tour) {
//     return next(new AppError('No tour found for given ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.reqTime,
//     data: {
//       tour,
//     },
//   });
// });

// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(new AppError('No tour found for given ID', 404));
//   }
//   res.status(200).json({
//     status: 'succuess',
//     data: { tour },
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppError('No tour found for given ID', 404));
//   }
//   res.status(204).json({
//     status: 'Succuess',
//     data: null,
//   });
// });
