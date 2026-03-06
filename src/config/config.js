require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true
    }
  },
  pollinations: {
    apiKey: process.env.POLLINATIONS_API_KEY,
    baseUrl: process.env.POLLINATIONS_BASE_URL || 'https://gen.pollinations.ai',
    imageUrl: process.env.POLLINATIONS_IMAGE_URL || 'https://image.pollinations.ai',
    videoUrl: process.env.POLLINATIONS_VIDEO_URL || 'https://video.pollinations.ai',
    textUrl: process.env.POLLINATIONS_TEXT_URL || 'https://text.pollinations.ai',
    timeout: parseInt(process.env.POLLINATIONS_TIMEOUT) || 60000
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/server.log'
  },
  fileUpload: {
    limits: {
      fileSize: parseInt(process.env.FILE_UPLOAD_LIMIT) || 10 * 1024 * 1024 // 10MB
    },
    useTempFiles: true,
    tempFileDir: '/tmp/'
  }
};

// Validate required configuration
if (!config.pollinations.apiKey && process.env.NODE_ENV !== 'development') {
  console.warn('⚠️  POLLINATIONS_API_KEY not set. Some features may not work properly.');
}

module.exports = config;