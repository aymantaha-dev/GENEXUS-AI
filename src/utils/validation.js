const { body, param, query } = require('express-validator');

const validateImageGeneration = [
  body('prompt')
    .notEmpty().withMessage('Prompt is required')
    .isString().withMessage('Prompt must be a string')
    .isLength({ max: 1000 }).withMessage('Prompt cannot exceed 1000 characters'),
  body('model')
    .optional()
    .isIn([
      'kontext', 'turbo', 'nanobanana', 'nanobanana-pro', 'seedream', 
      'seedream-pro', 'gptimage', 'gptimage-large', 'flux', 'zimage'
    ]).withMessage('Invalid image model'),
  body('width')
    .optional()
    .isInt({ min: 100, max: 2000 }).withMessage('Width must be between 100 and 2000'),
  body('height')
    .optional()
    .isInt({ min: 100, max: 2000 }).withMessage('Height must be between 100 and 2000'),
  body('seed')
    .optional()
    .isInt().withMessage('Seed must be an integer')
];

const validateVideoGeneration = [
  body('prompt')
    .notEmpty().withMessage('Prompt is required')
    .isString().withMessage('Prompt must be a string')
    .isLength({ max: 1000 }).withMessage('Prompt cannot exceed 1000 characters'),
  body('model')
    .optional()
    .isIn(['veo', 'seedance', 'seedance-pro']).withMessage('Invalid video model'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 30 }).withMessage('Duration must be between 1 and 30 seconds')
];

const validateChatGeneration = [
  body('prompt')
    .notEmpty().withMessage('Prompt is required')
    .isString().withMessage('Prompt must be a string')
    .isLength({ max: 2000 }).withMessage('Prompt cannot exceed 2000 characters'),
  body('model')
    .optional()
    .isIn([
      'openai', 'openai-fast', 'openai-large', 'qwen-coder', 'mistral', 'openai-audio',
      'gemini', 'gemini-fast', 'deepseek', 'grok', 'gemini-search', 'chickytutor',
      'midijourney', 'claude-fast', 'claude', 'claude-large', 'perplexity-fast',
      'perplexity-reasoning', 'kimi', 'gemini-large', 'nova-fast', 'glm', 'minimax'
    ]).withMessage('Invalid chat model'),
  body('temperature')
    .optional()
    .isFloat({ min: 0, max: 1 }).withMessage('Temperature must be between 0 and 1'),
  body('max_tokens')
    .optional()
    .isInt({ min: 1, max: 4000 }).withMessage('Max tokens must be between 1 and 4000')
];

const validateFileUpload = [
  body('model')
    .optional()
    .isIn([
      'kontext', 'turbo', 'nanobanana', 'nanobanana-pro', 'seedream', 
      'seedream-pro', 'gptimage', 'gptimage-large', 'flux', 'zimage'
    ]).withMessage('Invalid image model for editing')
];

module.exports = {
  validateImageGeneration,
  validateVideoGeneration,
  validateChatGeneration,
  validateFileUpload
};