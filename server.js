const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  // handle unhandled exception errors.
  console.log('Unhandled Exception! Shutting down...');
  console.log(err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB) // No need to pass useNewUrlParser and useUnifiedTopology in new versions
  .then(() => {
    console.log('DB connection online!');
  })
  .catch((err) => {
    console.error('DB connection error:', err.message);
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  // handle unhandled rejection errors/ promises like db con error, etc.
  console.log('Unhandled Rejection! Shutting down...');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
