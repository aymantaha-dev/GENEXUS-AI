const cors = require('cors');
const config = require('../config/config');

const corsOptions = {
  origin: config.server.cors.origin,
  methods: config.server.cors.methods,
  credentials: config.server.cors.credentials,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);