const express = require('express');
const router = express.Router();
const config = require('../config/config');
const packageJson = require('../../package.json');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'GENEXUS-AI',
    version: packageJson.version,
    environment: config.server.environment,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    api: 'GENEXUS-AI API',
    version: packageJson.version,
    description: 'Professional API server integrating all Pollinations.ai capabilities',
    endpoints: {
      images: '/api/images',
      videos: '/api/videos',
      chat: '/api/chat',
      edit: '/api/edit',
      health: '/health'
    },
    documentation: 'See README.md for complete documentation',
    license: 'MIT License'
  });
});

// Version info
router.get('/version', (req, res) => {
  res.json({
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    author: packageJson.author,
    license: packageJson.license,
    dependencies: Object.keys(packageJson.dependencies).length,
    devDependencies: Object.keys(packageJson.devDependencies).length
  });
});

// Basic runtime metrics endpoint
router.get('/metrics', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    process: {
      uptime: process.uptime(),
      pid: process.pid
    },
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
