const express = require('express');
const tourControllor = require('../controllor/tourControllor');
const authControllor = require('../controllor/authControllor');
const reviewRouter = require('./reviewRouter');
// const reviewContoller = require('../controllor/reviewController');

const router = express.Router();

// router.param('id', tourControllor.checkId);

// router.route('/').post(tourControllor.checkReqData, tourControllor.createTour);

// nested route or merge routes
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-cheap-5')
  .get(tourControllor.aliasTopTours, tourControllor.getAllTours);

router.route('/tour-stats').get(tourControllor.getTourState);

router
  .route('/tour-monthly-plan/:year')
  .get(
    authControllor.protect,
    authControllor.restrictTo('admin', 'lead-guide', 'guide'),
    tourControllor.getMontlyPlan,
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourControllor.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourControllor.getDistances);

router
  .route('/')
  .get(tourControllor.getAllTours)
  .post(
    authControllor.protect,
    authControllor.restrictTo('admin', 'lead-guide'),
    tourControllor.createTour,
  );

router
  .route('/:id')
  .get(tourControllor.getTour)
  .patch(
    authControllor.protect,
    authControllor.restrictTo('admin', 'lead-guide'),
    tourControllor.uploadTourImages,
    tourControllor.resizeTourImages,
    tourControllor.updateTour,
  )
  .delete(
    authControllor.protect,
    authControllor.restrictTo('admin', 'lead-guide'),
    tourControllor.deleteTour,
  );
// // nested route
// router
//   .route('/:tourId/reviews')
//   .post(
//     authControllor.protect,
//     authControllor.restrictTo('user'),
//     reviewContoller.createReview,
//   );

module.exports = router;
