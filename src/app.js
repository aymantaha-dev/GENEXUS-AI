require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const config = require('./config/config');
const logger = require('./utils/logger');
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const fileUploadMiddleware = require('./middleware/fileUpload');

const indexRoutes = require('./routes');
const imageRoutes = require('./routes/imageRoutes');
const videoRoutes = require('./routes/videoRoutes');
const chatRoutes = require('./routes/chatRoutes');
const editRoutes = require('./routes/editRoutes');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development flexibility
}));

// CORS middleware
app.use(corsMiddleware);

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload middleware
app.use(fileUploadMiddleware);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/', indexRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/edit', editRoutes);

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`🚀 GENEXUS-AI server started successfully on port ${PORT}`);
  logger.info(`🌍 Environment: ${config.server.environment}`);
  logger.info(`🔗 API Base URL: http://localhost:${PORT}`);
  logger.info(`📚 Available endpoints:`);
  logger.info(`   GET  /health - Health check`);
  logger.info(`   GET  /api/images/models - Available image models`);
  logger.info(`   POST /api/images/generate - Generate image`);
  logger.info(`   GET  /api/images/generate - Generate image (browser)`);
  logger.info(`   GET  /api/videos/models - Available video models`);
  logger.info(`   POST /api/videos/generate - Generate video`);
  logger.info(`   GET  /api/videos/generate - Generate video (browser)`);
  logger.info(`   GET  /api/chat/models - Available chat models`);
  logger.info(`   POST /api/chat/chat - Chat generation`);
  logger.info(`   GET  /api/chat/chat - Chat (browser)`);
  logger.info(`   POST /api/edit/image - Edit image`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('🔄 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🔄 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;