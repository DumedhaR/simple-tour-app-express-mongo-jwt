const express = require('express');
const viewsController = require('../controllor/viewsController');
const authControllor = require('../controllor/authControllor');
const bookingController = require('../controllor/bookingController');

const router = express.Router();

// router.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hikers',
//   });
// });

router.get(
  '/',
  bookingController.createBookingCheckout,
  authControllor.isLogged,
  viewsController.getOverview,
);

router.get(
  '/tour/:slug',
  authControllor.isLogged,
  viewsController.getTourDetails,
);

router.get('/login', authControllor.isLogged, viewsController.getUserLogin);
router.get('/me', authControllor.protect, viewsController.getAccount);
router.post(
  '/submit-user-data',
  authControllor.protect,
  viewsController.updateUserData,
);
router.get('/my-tours', authControllor.protect, viewsController.getMyTours);
module.exports = router;
