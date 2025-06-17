const express = require('express');
const viewsController = require('../controller/viewsController');
const authController = require('../controller/authController');
const bookingController = require('../controller/bookingController');

const router = express.Router();

// router.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hikers',
//   });
// });

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLogged,
  viewsController.getOverview,
);

router.get(
  '/tour/:slug',
  authController.isLogged,
  viewsController.getTourDetails,
);

router.get('/login', authController.isLogged, viewsController.getUserLogin);
router.get('/me', authController.protect, viewsController.getAccount);
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData,
);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
module.exports = router;
