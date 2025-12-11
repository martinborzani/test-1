'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes/api.js');

const app = express();

// Helmet SIN CSP (lo desactivamos para que no interfiera)
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

//  CSP MANUAL EXACTO PARA EL TEST DE freeCodeCamp
app.use(function (req, res, next) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self';"
  );
  next();
});

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(process.cwd() + '/public'));

app.route('/').get(function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Rutas de la API
apiRoutes(app);

// 404
app.use(function (req, res) {
  res.status(404).type('text').send('Not Found');
});

// Servidor
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

module.exports = app;
