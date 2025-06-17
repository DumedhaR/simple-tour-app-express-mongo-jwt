const express = require('express');
const tourController = require('../controller/tourController');
const authController = require('../controller/authController');
const reviewRouter = require('./reviewRouter');
// const reviewContoller = require('../controllor/reviewController');

const router = express.Router();

// router.param('id', tourControllor.checkId);

// router.route('/').post(tourControllor.checkReqData, tourControllor.createTour);

// nested route or merge routes
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-cheap-5')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourState);

router
  .route('/tour-monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMontlyPlan,
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
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
