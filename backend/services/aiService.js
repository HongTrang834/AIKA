/**
 * AI Service - Centralized AI/LLM Management
 * Abstraction layer for switching between different AI providers
 * Supports: Gemini, Local Models (Ollama, LLaMA.cpp), OpenAI, etc.
 */

import GeminiProvider from './providers/geminiProvider.js';
import LocalModelProvider from './providers/localModelProvider.js';

class AIService {
  constructor() {
    this.currentProvider = null;
    this.provider = process.env.AI_PROVIDER || 'gemini'; // 'gemini' | 'local' | 'openai'
    this.conversationHistory = new Map(); // userId -> conversation array
    
    this._initializeProvider();
  }

  /**
   * Initialize the appropriate AI provider based on environment
   */
  _initializeProvider() {
    console.log(`🤖 Initializing AI Service with provider: ${this.provider}`);

    switch (this.provider) {
      case 'local':
        this.currentProvider = new LocalModelProvider({
          baseURL: process.env.LOCAL_MODEL_URL || 'http://localhost:11434',
          model: process.env.LOCAL_MODEL_NAME || 'neural-chat',
        });
        break;

      case 'gemini':
      default:
        this.currentProvider = new GeminiProvider({
          apiKey: process.env.GOOGLE_API_KEY,
        });
        break;
    }

    if (!this.currentProvider) {
      throw new Error(`❌ Unsupported AI provider: ${this.provider}`);
    }

    console.log(`✅ AI Provider initialized: ${this.currentProvider.name}`);
  }

  /**
   * Generate chat response with error detection
   * @param {Object} options - Configuration options
   * @param {string} options.userId - User ID for conversation history
   * @param {string} options.message - User message
   * @param {string} options.mode - 'free' or 'scenario'
   * @param {string} options.scenario - Scenario name (if mode='scenario')
   * @returns {Promise<Object>} { response, errors, metadata }
   */
  async chat(options) {
    const {
      userId,
      message,
      mode = 'free',
      scenario = null,
    } = options;

    try {
      // Initialize conversation history for user if not exists
      if (!this.conversationHistory.has(userId)) {
        this.conversationHistory.set(userId, []);
      }

      const history = this.conversationHistory.get(userId);

      // Call provider
      const result = await this.currentProvider.generateResponse({
        userMessage: message,
        conversationHistory: history,
        mode,
        scenario,
      });

      // Add to conversation history
      history.push({
        role: 'user',
        content: message,
      });
      history.push({
        role: 'assistant',
        content: result.response,
      });

      // Keep history limited (last 30 messages = 15 exchanges)
      if (history.length > 30) {
        history.splice(0, history.length - 30);
      }

      return {
        response: result.response,
        errors: result.errors || [],
        metadata: {
          provider: this.currentProvider.name,
          mode,
          scenario,
          totalMessages: history.length,
        },
      };
    } catch (error) {
      console.error(`❌ AI Service Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear conversation history for a user
   * @param {string} userId - User ID
   */
  clearHistory(userId) {
    this.conversationHistory.delete(userId);
    console.log(`🗑️ Cleared conversation history for user: ${userId}`);
  }

  /**
   * Get conversation history for a user
   * @param {string} userId - User ID
   * @returns {Array} Conversation history
   */
  getHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }

  /**
   * Switch AI provider at runtime
   * @param {string} providerName - 'gemini' | 'local' | 'openai'
   * @param {Object} config - Provider configuration
   */
  switchProvider(providerName, config = {}) {
    console.log(`🔄 Switching AI provider to: ${providerName}`);
    this.provider = providerName;
    process.env.AI_PROVIDER = providerName;

    switch (providerName) {
      case 'local':
        this.currentProvider = new LocalModelProvider({
          baseURL: config.baseURL || process.env.LOCAL_MODEL_URL || 'http://localhost:11434',
          model: config.model || process.env.LOCAL_MODEL_NAME || 'neural-chat',
        });
        break;

      case 'gemini':
        this.currentProvider = new GeminiProvider({
          apiKey: config.apiKey || process.env.GOOGLE_API_KEY,
        });
        break;

      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }

    console.log(`✅ Provider switched successfully to: ${this.currentProvider.name}`);
  }

  /**
   * Get current provider info
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      name: this.currentProvider.name,
      type: this.currentProvider.type,
      status: 'ready',
    };
  }

  /**
   * Health check for current provider
   * @returns {Promise<boolean>} True if provider is working
   */
  async healthCheck() {
    try {
      return await this.currentProvider.healthCheck?.();
    } catch (error) {
      console.error(`❌ Provider health check failed: ${error.message}`);
      return false;
    }
  }
}

// Export singleton instance
export default new AIService();
