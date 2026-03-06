const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class PollinationsService {
  constructor() {
    // ✅ Fixed: Removed extra spaces from base URL
    this.baseUrl = 'https://gen.pollinations.ai';
    this.apiKey = config.pollinations.apiKey;
    this.timeout = config.pollinations.timeout || 60000;
    
    if (!this.apiKey) {
      logger.warn('POLLINATIONS_API_KEY not set. Some features may not work properly.');
    }
  }

  async _makeRequest(endpoint, method = 'GET', data = null, options = {}) {
    try {
      const headers = {
        'Accept': 'application/json',
        'User-Agent': 'GENEXUS-AI/1.0',
        ...options.headers
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      const axiosConfig = {
        method,
        url,
        headers,
        timeout: this.timeout,
        params: options.params || {}
      };

      if (data) {
        axiosConfig.data = data;
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      if (options.responseType) {
        axiosConfig.responseType = options.responseType;
      }

      const response = await axios(axiosConfig);
      return response.data;
    } catch (error) {
      logger.error('Pollinations API request failed:', {
        url: endpoint,
        method,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        throw new Error('Invalid or expired API key. Please check your POLLINATIONS_API_KEY');
      }
      
      if (error.response?.status === 404) {
        throw new Error(`Invalid API endpoint: ${endpoint}. Please check Pollinations.ai documentation`);
      }
      
      if (error.response?.status >= 500) {
        throw new Error(`Pollinations.ai server error: ${error.message}`);
      }
      
      throw error;
    }
  }

  // Image Generation & Editing - Same endpoint supports both generation and editing
  // For editing: include the 'image' parameter with the URL of the image to edit
  async generateImage(prompt, options = {}) {
    const { 
      model = 'flux',
      width,
      height,
      seed,
      noStore = false,
      nologo = true,
      image // Optional: for image editing (URL of the image to edit)
    } = options;
    
    let url;
    const encodedPrompt = encodeURIComponent(prompt);
    
    if (image) {
      // Image editing mode: both prompt and image URL are included in the path
      const encodedImage = encodeURIComponent(image);
      url = `/image/${encodedPrompt}/${encodedImage}?model=${model}`;
    } else {
      // Image generation mode: only prompt is included in the path
      url = `/image/${encodedPrompt}?model=${model}`;
    }
    
    const params = {};
    if (width) params.width = width;
    if (height) params.height = height;
    if (seed !== undefined) params.seed = seed;
    params.noStore = noStore;
    params.nologo = nologo;
    
    return this._makeRequest(url, 'GET', null, { 
      responseType: 'arraybuffer',
      params: params
    });
  }

  // Text Generation - Standard POST endpoint
  async generateText(prompt, options = {}) {
    const { 
      model = 'openai',
      temperature = 0.7,
      max_tokens = 1000,
      stream = false
    } = options;

    const payload = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: parseFloat(temperature),
      max_tokens: parseInt(max_tokens),
      stream: stream
    };

    return this._makeRequest('/v1/chat/completions', 'POST', payload);
  }

  // Video Generation - Browser-compatible
  async generateVideo(prompt, options = {}) {
    const { 
      model = 'seedance',
      duration = 5
    } = options;

    const params = new URLSearchParams({
      prompt: prompt,
      model: model,
      duration: duration.toString()
    });

    const url = `/video/generate?${params.toString()}`;
    return this._makeRequest(url, 'GET');
  }

  // Health check - Fixed URL without extra spaces
  async healthCheck() {
    try {
      const response = await axios.get('https://pollinations.ai/health', {
        timeout: 5000
      });
      
      return { 
        status: 'healthy', 
        data: response.data 
      };
    } catch (error) {
      logger.error('Health check failed:', error.message);
      
      return { 
        status: 'unhealthy', 
        error: error.message,
        data: error.response?.data
      };
    }
  }

  // Get all available models with exact structure from Pollinations.ai
  // This returns server-side models list (not fetched from Pollinations API)
  async getAvailableModels() {
    return {
      // 🖼️ Image models (exact structure from Pollinations.ai)
      image: [
        {
          "name": "kontext",
          "aliases": [],
          "pricing": {
            "currency": "pollen",
            "completionImageTokens": 0.04
          },
          "description": "FLUX.1 Kontext - In-context editing & generation",
          "input_modalities": ["text", "image"],
          "output_modalities": ["image"]
        },
        {
          "name": "turbo",
          "aliases": [],
          "pricing": {
            "currency": "pollen",
            "completionImageTokens": 0.0003
          },
          "description": "SDXL Turbo - Single-step real-time generation",
          "input_modalities": ["text"],
          "output_modalities": ["image"]
        },
        {
          "name": "nanobanana",
          "aliases": [],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 3e-7,
            "promptImageTokens": 3e-7,
            "completionImageTokens": 0.00003
          },
          "description": "NanoBanana - Gemini 2.5 Flash Image",
          "input_modalities": ["text", "image"],
          "output_modalities": ["image"]
        },
        {
          "name": "nanobanana-pro",
          "aliases": [],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 0.00000125,
            "promptImageTokens": 0.00000125,
            "completionImageTokens": 0.00012
          },
          "description": "NanoBanana Pro - Gemini 3 Pro Image (4K, Thinking)",
          "input_modalities": ["text", "image"],
          "output_modalities": ["image"]
        },
        {
          "name": "seedream",
          "aliases": [],
          "pricing": {
            "currency": "pollen",
            "completionImageTokens": 0.03
          },
          "description": "Seedream 4.0 - ByteDance ARK (better quality)",
          "input_modalities": ["text", "image"],
          "output_modalities": ["image"]
        },
        {
          "name": "seedream-pro",
          "aliases": [],
          "pricing": {
            "currency": "pollen",
            "completionImageTokens": 0.04
          },
          "description": "Seedream 4.5 Pro - ByteDance ARK (4K, Multi-Image)",
          "input_modalities": ["text", "image"],
          "output_modalities": ["image"]
        },
        {
          "name": "gptimage",
          "aliases": ["gpt-image", "gpt-image-1-mini"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 0.000002,
            "promptCachedTokens": 2.0000000000000002e-7,
            "promptImageTokens": 0.0000025,
            "completionImageTokens": 0.000008
          },
          "description": "GPT Image 1 Mini - OpenAI's image generation model",
          "input_modalities": ["text", "image"],
          "output_modalities": ["image"]
        },
        {
          "name": "gptimage-large",
          "aliases": ["gpt-image-1.5", "gpt-image-large"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 0.000008,
            "promptCachedTokens": 0.000002,
            "promptImageTokens": 0.000008,
            "completionImageTokens": 0.000032
          },
          "description": "GPT Image 1.5 - OpenAI's advanced image generation model",
          "input_modalities": ["text", "image"],
          "output_modalities": ["image"]
        },
        {
          "name": "flux",
          "aliases": [],
          "pricing": {
            "currency": "pollen",
            "completionImageTokens": 0.0002
          },
          "description": "Flux Schnell - Fast high-quality image generation",
          "input_modalities": ["text"],
          "output_modalities": ["image"]
        },
        {
          "name": "zimage",
          "aliases": ["z-image", "z-image-turbo"],
          "pricing": {
            "currency": "pollen",
            "completionImageTokens": 0.0002
          },
          "description": "Z-Image Turbo - Fast 6B Flux with 2x upscaling",
          "input_modalities": ["text"],
          "output_modalities": ["image"]
        }
      ],
      
      // 🎥 Video models (exact structure from Pollinations.ai)
      video: [
        {
          "name": "veo",
          "aliases": ["veo-3.1-fast", "video"],
          "pricing": {
            "currency": "pollen",
            "completionVideoSeconds": 0.15
          },
          "description": "Veo 3.1 Fast - Google's video generation model (preview)",
          "input_modalities": ["text", "image"],
          "output_modalities": ["video"]
        },
        {
          "name": "seedance",
          "aliases": [],
          "pricing": {
            "currency": "pollen",
            "completionVideoTokens": 0.0000018000000000000001
          },
          "description": "Seedance Lite - BytePlus video generation (better quality)",
          "input_modalities": ["text", "image"],
          "output_modalities": ["video"]
        },
        {
          "name": "seedance-pro",
          "aliases": [],
          "pricing": {
            "currency": "pollen",
            "completionVideoTokens": 0.000001
          },
          "description": "Seedance Pro-Fast - BytePlus video generation (better prompt adherence)",
          "input_modalities": ["text", "image"],
          "output_modalities": ["video"]
        }
      ],
      
      // 📝 Chat models (exact structure from Pollinations.ai)
      chat: [
        {
          "name": "openai",
          "aliases": [],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 1.5e-7,
            "promptCachedTokens": 4e-8,
            "completionTextTokens": 6e-7
          },
          "description": "OpenAI GPT-5 Mini - Fast & Balanced",
          "input_modalities": ["text", "image"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": false
        },
        {
          "name": "openai-fast",
          "aliases": ["gpt-5-nano", "gpt-5-nano-2025-08-07"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 6e-8,
            "promptCachedTokens": 1e-8,
            "completionTextTokens": 4.4e-7
          },
          "description": "OpenAI GPT-5 Nano - Ultra Fast & Affordable",
          "input_modalities": ["text", "image"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": false
        },
        {
          "name": "openai-large",
          "aliases": ["gpt-5.2", "openai-reasoning", "gpt-5.2-reasoning"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 0.00000175,
            "promptCachedTokens": 1.75e-7,
            "completionTextTokens": 0.000014
          },
          "description": "OpenAI GPT-5.2 - Most Powerful & Intelligent",
          "input_modalities": ["text", "image"],
          "output_modalities": ["text"],
          "tools": true,
          "reasoning": true,
          "is_specialized": false
        },
        {
          "name": "qwen-coder",
          "aliases": ["qwen3-coder", "qwen3-coder-30b-a3b-instruct"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 6e-8,
            "completionTextTokens": 2.2e-7
          },
          "description": "Qwen3 Coder 30B - Specialized for Code Generation",
          "input_modalities": ["text"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": false
        },
        {
          "name": "mistral",
          "aliases": ["mistral-small", "mistral-small-3.2", "mistral-small-3.2-24b-instruct-2506"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 1.5e-7,
            "completionTextTokens": 3.5e-7
          },
          "description": "Mistral Small 3.2 24B - Efficient & Cost-Effective",
          "input_modalities": ["text"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": false
        },
        {
          "name": "openai-audio",
          "aliases": ["gpt-4o-mini-audio-preview", "gpt-4o-mini-audio-preview-2024-12-17"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 1.65e-7,
            "completionTextTokens": 6.6e-7,
            "promptAudioTokens": 0.000011,
            "completionAudioTokens": 0.000022
          },
          "description": "OpenAI GPT-4o Mini Audio - Voice Input & Output",
          "input_modalities": ["text", "image", "audio"],
          "output_modalities": ["audio", "text"],
          "tools": true,
          "voices": ["alloy", "echo", "fable", "onyx", "nova", "shimmer", "coral", "verse", "ballad", "ash", "sage", "amuch", "dan"],
          "is_specialized": false
        },
        {
          "name": "gemini",
          "aliases": ["gemini-3-flash", "gemini-3-flash-preview"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 5e-7,
            "promptCachedTokens": 5.0000000000000004e-8,
            "promptAudioTokens": 5e-7,
            "completionTextTokens": 0.000003
          },
          "description": "Google Gemini 3 Flash - Pro-Grade Reasoning at Flash Speed",
          "input_modalities": ["text", "image", "audio", "video"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": false
        },
        {
          "name": "gemini-fast",
          "aliases": ["gemini-2.5-flash-lite"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 1.0000000000000001e-7,
            "promptCachedTokens": 1e-8,
            "promptAudioTokens": 1.0000000000000001e-7,
            "completionTextTokens": 4.0000000000000003e-7
          },
          "description": "Google Gemini 2.5 Flash Lite - Ultra Fast & Cost-Effective",
          "input_modalities": ["text", "image"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": false
        },
        {
          "name": "deepseek",
          "aliases": ["deepseek-v3", "deepseek-reasoning"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 5.6e-7,
            "promptCachedTokens": 2.8e-7,
            "completionTextTokens": 0.00000168
          },
          "description": "DeepSeek V3.2 - Efficient Reasoning & Agentic AI",
          "input_modalities": ["text"],
          "output_modalities": ["text"],
          "tools": true,
          "reasoning": true,
          "is_specialized": false
        },
        {
          "name": "grok",
          "aliases": ["grok-fast", "grok-4", "grok-4-fast"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 2.0000000000000002e-7,
            "promptCachedTokens": 2.0000000000000002e-7,
            "completionTextTokens": 5e-7
          },
          "description": "xAI Grok 4 Fast - High Speed & Real-Time",
          "input_modalities": ["text"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": false
        },
        {
          "name": "gemini-search",
          "aliases": ["gemini-3-flash-search"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 5e-7,
            "promptCachedTokens": 5.0000000000000004e-8,
            "promptAudioTokens": 5e-7,
            "completionTextTokens": 0.000003
          },
          "description": "Google Gemini 3 Flash - With Google Search",
          "input_modalities": ["text", "image"],
          "output_modalities": ["text"],
          "tools": false,
          "is_specialized": false
        },
        {
          "name": "chickytutor",
          "aliases": [],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 8.000000000000001e-7,
            "completionTextTokens": 0.000004
          },
          "description": "ChickyTutor AI Language Tutor - (chickytutor.com)",
          "input_modalities": ["text"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": true
        },
        {
          "name": "midijourney",
          "aliases": [],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 0.0000022,
            "promptCachedTokens": 5.5e-7,
            "completionTextTokens": 0.0000088
          },
          "description": "MIDIjourney - AI Music Composition Assistant",
          "input_modalities": ["text"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": true
        },
        {
          "name": "claude-fast",
          "aliases": ["claude-haiku-4.5", "claude-haiku"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 0.000001,
            "completionTextTokens": 0.000005
          },
          "description": "Anthropic Claude Haiku 4.5 - Fast & Intelligent",
          "input_modalities": ["text", "image"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": false
        },
        {
          "name": "claude",
          "aliases": ["claude-sonnet-4.5", "claude-sonnet"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 0.000003,
            "completionTextTokens": 0.000015
          },
          "description": "Anthropic Claude Sonnet 4.5 - Most Capable & Balanced",
          "input_modalities": ["text", "image"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": false
        },
        {
          "name": "claude-large",
          "aliases": ["claude-opus-4.5", "claude-opus"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 0.000005,
            "completionTextTokens": 0.000025
          },
          "description": "Anthropic Claude Opus 4.5 - Most Intelligent Model",
          "input_modalities": ["text", "image"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": false
        },
        {
          "name": "perplexity-fast",
          "aliases": ["sonar"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 0.000001,
            "completionTextTokens": 0.000001
          },
          "description": "Perplexity Sonar - Fast & Affordable with Web Search",
          "input_modalities": ["text"],
          "output_modalities": ["text"],
          "tools": false,
          "is_specialized": false
        },
        {
          "name": "perplexity-reasoning",
          "aliases": ["sonar-reasoning", "sonar-reasoning-pro"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 0.000002,
            "completionTextTokens": 0.000008
          },
          "description": "Perplexity Sonar Reasoning - Advanced Reasoning with Web Search",
          "input_modalities": ["text"],
          "output_modalities": ["text"],
          "tools": false,
          "reasoning": true,
          "is_specialized": false
        },
        {
          "name": "kimi",
          "aliases": ["kimi-k2", "kimi-reasoning", "kimi-k2-thinking"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 6e-7,
            "completionTextTokens": 0.0000025
          },
          "description": "Moonshot Kimi K2 Thinking - Deep Reasoning & Tool Orchestration",
          "input_modalities": ["text"],
          "output_modalities": ["text"],
          "tools": true,
          "reasoning": true,
          "is_specialized": false
        },
        {
          "name": "gemini-large",
          "aliases": ["gemini-3-pro", "gemini-3", "gemini-3-pro-preview"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 0.000002,
            "promptCachedTokens": 2.0000000000000002e-7,
            "completionTextTokens": 0.000012
          },
          "description": "Google Gemini 3 Pro - Most Intelligent Model with 1M Context (Preview)",
          "input_modalities": ["text", "image", "audio", "video"],
          "output_modalities": ["text"],
          "tools": true,
          "reasoning": true,
          "is_specialized": false
        },
        {
          "name": "nova-fast",
          "aliases": ["amazon-nova-micro", "nova", "nova-micro"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 3.5e-8,
            "completionTextTokens": 1.4e-7
          },
          "description": "Amazon Nova Micro - Ultra Fast & Ultra Cheap",
          "input_modalities": ["text"],
          "output_modalities": ["text"],
          "tools": true,
          "is_specialized": false
        },
        {
          "name": "glm",
          "aliases": ["glm-4.7", "glm-4p7"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 6e-7,
            "promptCachedTokens": 3e-7,
            "completionTextTokens": 0.0000022
          },
          "description": "Z.ai GLM-4.7 - Coding, Reasoning & Agentic Workflows",
          "input_modalities": ["text"],
          "output_modalities": ["text"],
          "tools": true,
          "reasoning": true,
          "context_window": 198000,
          "is_specialized": false
        },
        {
          "name": "minimax",
          "aliases": ["minimax-m2.1", "minimax-m2p1"],
          "pricing": {
            "currency": "pollen",
            "promptTextTokens": 3e-7,
            "promptCachedTokens": 1.5e-7,
            "completionTextTokens": 0.0000012
          },
          "description": "MiniMax M2.1 - Multi-Language & Agent Workflows",
          "input_modalities": ["text"],
          "output_modalities": ["text"],
          "tools": true,
          "reasoning": true,
          "context_window": 200000,
          "is_specialized": false
        }
      ]
    };
  }

  async getImageModels() {
    const models = await this.getAvailableModels();
    return models.image || [];
  }

  async getVideoModels() {
    const models = await this.getAvailableModels();
    return models.video || [];
  }

  async getChatModels() {
    const models = await this.getAvailableModels();
    return models.chat || [];
  }

  async editImage(imageInput, prompt, options = {}) {
    const { model = 'flux', width, height, seed, noStore = false, nologo = true } = options;

    if (!imageInput) {
      throw new Error('Image input is required for editing.');
    }

    let imageReference = imageInput;
    if (Buffer.isBuffer(imageInput)) {
      imageReference = `data:image/png;base64,${imageInput.toString('base64')}`;
    }

    return this.generateImage(prompt, {
      model,
      width,
      height,
      seed,
      noStore,
      nologo,
      image: imageReference
    });
  }
}

module.exports = new PollinationsService();
