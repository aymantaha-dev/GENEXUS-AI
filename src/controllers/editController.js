const pollinationsService = require('../services/pollinationsService');
const fileService = require('../services/fileService');
const { formatResponse, formatError, formatPollinationsError } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

const editImage = async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json(formatError({ message: 'No image file uploaded' }, 400));
    }

    const imageFile = req.files.image;
    const { prompt, model, strength = 0.75 } = req.body;
    
    logger.info('Editing image:', { prompt, model, strength, fileName: imageFile.name });
    
    // Save the uploaded image temporarily
    const tempFile = await fileService.saveTempFile(imageFile.data, imageFile.name);
    
    // Read the image file
    const imageBuffer = await fileService.readFile(tempFile.path);
    
    // Edit image using Pollinations image-editing mode
    const editedImageBuffer = await pollinationsService.editImage(imageBuffer, prompt, {
      model,
      strength: parseFloat(strength) || 0.75
    });

    // Save the edited image
    const file = {
      name: `edited_${Date.now()}.png`,
      data: editedImageBuffer,
      size: editedImageBuffer.length,
      mimetype: 'image/png'
    };
    
    const savedFile = await fileService.saveFile(file, 'edited');

    // Clean up temp file
    await fileService.deleteFile(tempFile.path);

    res.status(200).json(formatResponse({
      editedImageUrl: savedFile.url,
      editedImagePath: savedFile.path,
      originalImage: imageFile.name,
      prompt,
      model: model || 'flux',
      strength: strength || 0.75
    }, 'Image edited successfully'));
  } catch (error) {
    logger.error('Image editing failed:', error);
    res.status(500).json(formatPollinationsError(error));
  }
};

module.exports = {
  editImage
};
