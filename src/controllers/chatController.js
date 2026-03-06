const pollinationsService = require('../services/pollinationsService');
const { formatResponse, formatPollinationsError } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

const generateText = async (req, res) => {
  try {
    const { 
      prompt, 
      model, 
      temperature, 
      max_tokens, 
      system_prompt 
    } = req.body;
    
    logger.info('Generating text:', { prompt, model, temperature, max_tokens });
    
    const response = await pollinationsService.generateText(prompt, {
      model,
      temperature: parseFloat(temperature) || 0.7,
      max_tokens: parseInt(max_tokens) || 1000,
      system_prompt: system_prompt || 'You are a helpful AI assistant.'
    });

    // Normalize Pollinations.ai response formats
    let content = '';
    if (typeof response === 'string') {
      content = response;
    } else if (response.choices && response.choices[0]) {
      // OpenAI-like structure
      content = response.choices[0].message?.content || response.choices[0].text || '';
    } else if (response.content) {
      // Direct content structure
      content = response.content;
    } else {
      // Fallback for unknown object structure
      content = JSON.stringify(response);
    }

    res.status(200).json(formatResponse({
      content,
      prompt,
      model: model || 'openai',
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 1000,
      usage: response.usage || {}
    }, 'Text generated successfully'));
  } catch (error) {
    logger.error('Text generation failed:', error);
    res.status(500).json(formatPollinationsError(error));
  }
};

const getAvailableModels = async (req, res) => {
  try {
    const models = await pollinationsService.getAvailableModels();
    const textModels = models.chat || [];
    res.status(200).json(formatResponse(textModels, 'Available text/chat models'));
  } catch (error) {
    logger.error('Failed to get text models:', error);
    res.status(500).json(formatPollinationsError(error));
  }
};

const chat = async (req, res) => {
  try {
    const { 
      prompt, 
      model, 
      temperature, 
      max_tokens, 
      system_prompt 
    } = req.query;
    
    logger.info('Chat via GET:', { prompt, model, temperature, max_tokens });
    
    const response = await pollinationsService.generateText(prompt, {
      model,
      temperature: parseFloat(temperature) || 0.7,
      max_tokens: parseInt(max_tokens) || 1000,
      system_prompt: system_prompt || 'You are a helpful AI assistant.'
    });

    // Normalize Pollinations.ai response formats
    let content = '';
    if (typeof response === 'string') {
      content = response;
    } else if (response.choices && response.choices[0]) {
      content = response.choices[0].message?.content || response.choices[0].text || '';
    } else if (response.content) {
      content = response.content;
    } else {
      content = JSON.stringify(response);
    }

    res.status(200).json(formatResponse({
      content,
      prompt,
      model: model || 'openai',
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 1000,
      usage: response.usage || {}
    }, 'Chat response generated successfully'));
  } catch (error) {
    logger.error('Chat failed (GET):', error);
    res.status(500).json(formatPollinationsError(error));
  }
};

module.exports = {
  generateText,
  getAvailableModels,
  chat
};
