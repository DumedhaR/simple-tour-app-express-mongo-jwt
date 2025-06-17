const express = require('express');
// const fs = require('fs');
const morgan = require('morgan');

const userRouter = require('./routes/userRouter');
const tourRouter = require('./routes/tourRouter');

const app = express();
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
// );

// Middlewares ------------------
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   console.log('hello from middleware...');
//   next();
// });
app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  next();
});

// app.get('/', (req, res) => {
//   res.status(200).json({ message: 'Hello from server man :)', app: 'natours' });
// });
// app.post('/', (req, res) => {
//   res.send('this is post from server...');
// });

// Rout Handelrs ----------------
// const getTour = (req, res) => {
//   console.log(req.params);
//   const id = req.params.id * 1;
//   const tour = tours.find((el) => el.id === id);
//   if (tour) {
//     return res.status(200).json({
//       status: 'success',
//       requestedAt: req.reqTime,
//       data: {
//         tour,
//       },
//     });
//   }
//   res.status(404).json({
//     status: 'fail',
//     message: 'Invalid Id',
//   });
// };

// const createTour = (req, res) => {
//   const newId = tours[tours.length - 1].id + 1;
//   const newTour = Object.assign({ id: newId }, req.body);
//   tours.push(newTour);
//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     (err) => {
//       res.status(201).json({
//         status: 'success',
//         data: {
//           tour: newTour,
//         },
//       });
//     }
//   );
// };

// const updateTour = (req, res) => {
//   const id = req.params.id * 1;
//   const tour = tours.find((el) => el.id === id);
//   if (tour) {
//     return res.status(200).json({
//       status: 'succuess',
//       data: { tour: 'updated tour here...' },
//     });
//   }
//   res.status(404).json({
//     status: 'fail',
//     message: 'Invalid Id',
//   });
// };

// const deleteTour = (req, res) => {
//   const id = req.params.id * 1;
//   const tour = tours.find((el) => el.id === id);
//   if (tour) {
//     return res.status(204).json({
//       status: 'Succuess',
//       data: null,
//     });
//   }
//   res.status(404).json({
//     status: 'fail',
//     message: 'Invalid Id',
//   });
// };

// const getAllUsers = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'Oops, Undifined route',
//   });
// };

// const createUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'Oops, Undifined route',
//   });
// };

// const getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'Oops, Undifined route',
//   });
// };

// const updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'Oops, Undifined route',
//   });
// };

// const deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'Oops, Undifined route',
//   });
// };

// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// Routs -----------------------
// const tourRouter = express.Router();
// const userRouter = express.Router();

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// tourRouter.route('').post(createTour);
// tourRouter.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

// userRouter.route('/').get(getAllUsers).post(createUser);
// userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = app;
