// const fs = require('fs');
// const url = require('url');
const Tour = require('../model/Tour');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkReqData = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Missing request data',
//     });
//   }
//   next();
// };

// exports.checkId = (req, res, next, val) => {
//   console.log(`requested tourId: ${val}`);
//   const id = val * 1;
//   const tour = tours.find((el) => el.id === id);
//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid Id',
//     });
//   }
//   next();
// };

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

exports.getAllTours = async (req, res) => {
  try {
    // Build Query
    console.log(req.query);
    const queryObj = { ...req.query };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    // Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // console.log(JSON.parse(queryStr));
    let query = Tour.find(JSON.parse(queryStr));

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      // console.log(sortBy);
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Fields Limiting (projection)
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      console.log(fields);
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    // Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      console.log(numTours);
      if (skip >= numTours) throw new Error('This page dosent exist');
    }

    query = query.skip(skip).limit(limit);

    // Execute Query
    const tours = await query;

    res.status(200).json({
      status: 'success',
      requestedAt: req.reqTime,
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  // console.log(req.params);
  // const id = req.params.id * 1;
  // const tour = tours.find((el) => el.id === id);
  try {
    const tour = await Tour.findById(req.params.id);
    // same as Tour.findOne({});
    res.status(200).json({
      status: 'success',
      requestedAt: req.reqTime,
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    // const tour = new Tour({});
    // tour.save();
    const newTour = await Tour.create(req.body);
    // const newId = tours[tours.length - 1].id + 1;
    // const newTour = { id: newId, ...req.body };
    // tours.push(newTour);
    // fs.writeFile(
    //   `${__dirname}/dev-data/data/tours-simple.json`,
    //   JSON.stringify(tours),
    //   (err) => {
    //   },
    // );
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  // const id = req.params.id * 1;
  // const tour = tours.find((el) => el.id === id);
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'succuess',
      data: { tour },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
exports.deleteTour = async (req, res) => {
  // const id = req.params.id * 1;
  // const tour = tours.find((el) => el.id === id);
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'Succuess',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
