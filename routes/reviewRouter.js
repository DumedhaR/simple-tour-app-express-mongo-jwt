const express = require('express');
const reviewController = require('../controllor/reviewController');
const authControllor = require('../controllor/authControllor');

const router = express.Router({ mergeParams: true });
router.use(authControllor.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authControllor.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authControllor.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authControllor.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );

module.exports = router;
