/* eslint-disable */
import axios from 'axios';
const stripe = Stripe(
  'pk_test_51RahIJ4Dam5et2qp03hFLXLiICiQrhpptm15a4Agq060S32gCl9vkhd1UuSZQvv8ttiu6MNEBBwrGxT82Qjx3zWE00KTi6gz5W',
);
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  try {
    //get checkout session from api
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);
    //create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
