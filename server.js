'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api.js');

const app = express();

// CSP ÚNICO Y SIN CACHE PARA freeCodeCamp
app.use(function (req, res, next) {

  // 🔥 Evitar cache de Cloudflare / Render
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  // 🔥 CSP EXACTO para freeCodeCamp
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'"
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

apiRoutes(app);

app.use(function (req, res) {
  res.status(404).type('text').send('Not Found');
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + listener.address().port);
});

module.exports = app;
