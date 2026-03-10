const express = require('express');
const helmet = require('helmet');
const app = express();
const port = 3000;
const routes = require('./routes');
const authRoutes = require('./routes/auth');
const db = require('./config/db');

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes);
app.use('/api/auth', authRoutes);

app.use((req, res, next) => {
  res.status(404).send('Not Found');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  }).on('error', (err) => {
    console.error(`Server startup error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = app;