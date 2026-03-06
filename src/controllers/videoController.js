const pollinationsService = require('../services/pollinationsService');
const { formatResponse, formatPollinationsError } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

const generateVideo = async (req, res) => {
  try {
    const { prompt, model, duration } = req.body;
    
    logger.info('Generating video:', { prompt, model, duration });
    
    const videoData = await pollinationsService.generateVideo(prompt, {
      model,
      duration: parseInt(duration) || 5
    });

    res.status(200).json(formatResponse({
      videoUrl: videoData.url,
      prompt,
      model: model || 'seedance',
      duration: duration || 5,
      jobId: videoData.job_id
    }, 'Video generation started successfully'));
  } catch (error) {
    logger.error('Video generation failed:', error);
    res.status(500).json(formatPollinationsError(error));
  }
};

const getAvailableModels = async (req, res) => {
  try {
    const models = await pollinationsService.getVideoModels();
    res.status(200).json(formatResponse(models, 'Available video models'));
  } catch (error) {
    logger.error('Failed to get video models:', error);
    res.status(500).json(formatPollinationsError(error));
  }
};

const getVideo = async (req, res) => {
  try {
    const { prompt, model, duration } = req.query;
    
    logger.info('Generating video via GET:', { prompt, model, duration });
    
    const videoData = await pollinationsService.generateVideo(prompt, {
      model,
      duration: parseInt(duration) || 5
    });

    res.status(200).json(formatResponse({
      videoUrl: videoData.url,
      prompt,
      model: model || 'seedance',
      duration: duration || 5,
      jobId: videoData.job_id
    }, 'Video generation started successfully'));
  } catch (error) {
    logger.error('Video generation failed (GET):', error);
    res.status(500).json(formatPollinationsError(error));
  }
};

module.exports = {
  generateVideo,
  getAvailableModels,
  getVideo
};