const pollinationsService = require('../services/pollinationsService');
const fileService = require('../services/fileService');
const { formatResponse, formatPollinationsError } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

const generateImage = async (req, res) => {
  try {
    const { prompt, model, width, height, seed, nologo = true, noStore = false } = req.body;
    
    logger.info('Generating image:', { prompt, model, width, height, seed });
    
    const imageBuffer = await pollinationsService.generateImage(prompt, {
      model,
      width: parseInt(width) || 1024,
      height: parseInt(height) || 1024,
      seed: seed ? parseInt(seed) : undefined,
      nologo: nologo === 'true' || nologo === true,
      noStore: noStore === 'true' || noStore === true
    });

    // Save the generated image
    const file = {
      name: `generated_${Date.now()}.png`,
      data: imageBuffer,
      size: imageBuffer.length,
      mimetype: 'image/png'
    };
    
    const savedFile = await fileService.saveFile(file, 'generated');

    res.status(200).json(formatResponse({
      imageUrl: savedFile.url,
      imagePath: savedFile.path,
      prompt,
      model: model || 'flux',
      width: width || 1024,
      height: height || 1024,
      seed: seed || 'random'
    }, 'Image generated successfully'));
  } catch (error) {
    logger.error('Image generation failed:', error);
    res.status(500).json(formatPollinationsError(error));
  }
};

const getAvailableModels = async (req, res) => {
  try {
    const models = await pollinationsService.getImageModels();
    res.status(200).json(formatResponse(models, 'Available image models'));
  } catch (error) {
    logger.error('Failed to get image models:', error);
    res.status(500).json(formatPollinationsError(error));
  }
};

const getImage = async (req, res) => {
  try {
    const { prompt, model, width, height, seed, nologo = true, noStore = false } = req.query;
    
    logger.info('Generating image via GET:', { prompt, model, width, height, seed });
    
    const imageBuffer = await pollinationsService.generateImage(prompt, {
      model,
      width: parseInt(width) || 1024,
      height: parseInt(height) || 1024,
      seed: seed ? parseInt(seed) : undefined,
      nologo: nologo === 'true' || nologo === true,
      noStore: noStore === 'true' || noStore === true
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="generated_${Date.now()}.png"`);
    res.send(imageBuffer);
  } catch (error) {
    logger.error('Image generation failed (GET):', error);
    res.status(500).json(formatPollinationsError(error));
  }
};

module.exports = {
  generateImage,
  getAvailableModels,
  getImage
};