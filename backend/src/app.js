const express = require('express');
const path = require('path');
const chatRoutes = require('./routes/chatRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use('/api', chatRoutes);

app.use(errorHandler);

module.exports = app;
