const fileUpload = require('express-fileupload');
const config = require('../config/config');
const logger = require('../utils/logger');

module.exports = fileUpload({
  ...config.fileUpload,
  abortOnLimit: true,
  responseOnLimit: "File size limit has been reached",
  debug: process.env.NODE_ENV === 'development',
  useTempFiles: config.fileUpload.useTempFiles,
  tempFileDir: config.fileUpload.tempFileDir,
  limits: config.fileUpload.limits,
  safeFileNames: true,
  preserveExtension: true
});