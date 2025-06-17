const express = require('express');
const bookingController = require('../controllor/bookingController');
const authControllor = require('../controllor/authControllor');

const router = express.Router();

router.use(authControllor.protect);

router
  .route('/checkout-session/:tourId')
  .get(authControllor.protect, bookingController.getCheckoutSession);

router.use(authControllor.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);
router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
