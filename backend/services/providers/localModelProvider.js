/**
 * Local Model Provider
 * Support for local AI models via Ollama, LLaMA.cpp, or similar APIs
 * No API keys needed - runs on your machine
 *
 * Setup:
 * 1. Install Ollama: https://ollama.ai
 * 2. Pull a model: `ollama pull neural-chat`
 * 3. Run: `ollama serve` (listens on http://localhost:11434)
 * 4. Set .env: AI_PROVIDER=local
 */

import axios from 'axios';

class LocalModelProvider {
  constructor(config) {
    this.name = 'Local Model ';
    this.type = 'local';
    this.baseURL = config.baseURL || 'http://localhost:11434';
    this.model = config.model || 'neural-chat';

    // Verify connection
    this._verifyConnection();

    // System prompts (same as Gemini)
    this.systemPrompts = {
      free: `You are a friendly Japanese language tutor for N2-level learners.
Engage in natural Japanese conversation with the user.
Respond in Japanese only.

Guidelines:
- Keep conversation natural and conversational
- If there are grammatical errors or unnatural phrasing, point them out at the END

Error format:
[ERROR] Incorrect: <user's phrase> | Correct: <better phrasing> | Reason: <brief explanation>`,

      scenario: `You are a Japanese conversation simulator for N2-level learners.
The user is practicing Japanese through a real-world scenario.
Respond entirely in Japanese.

Error format:
[ERROR] Incorrect: <phrase> | Correct: <correct> | Reason: <explanation>`,
    };

    this.scenarioContexts = {
      restaurant: 'You are a restaurant staff.',
      taxi: 'You are a taxi driver.',
      hotel: 'You are a hotel receptionist.',
      interview: 'You are conducting a job interview.',
      coffee: 'You are a cafe staff member.',
      shopping: 'You are a shop staff member.',
    };

    console.log(`🟢 Local Model Provider initialized`);
    console.log(`   Model: ${this.model}`);
    console.log(`   URL: ${this.baseURL}`);
  }

  /**
   * Verify local model server is running
   * @private
   */
  async _verifyConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, { timeout: 5000 });
      console.log(`✅ Connected to local model server at ${this.baseURL}`);
      console.log(`   Available models: ${response.data.models?.map(m => m.name).join(', ') || 'unknown'}`);
    } catch (error) {
      console.warn(`⚠️ Cannot connect to local model server at ${this.baseURL}`);
      console.warn(`   Make sure Ollama or comparable server is running`);
      console.warn(`   Start with: ollama serve`);
    }
  }

  /**
   * Generate response using local model
   * @param {Object} params - Request parameters
   * @param {string} params.userMessage - User's message
   * @param {Array} params.conversationHistory - Previous messages
   * @param {string} params.mode - 'free' or 'scenario'
   * @param {string} params.scenario - Scenario name
   * @returns {Promise<Object>} { response, errors }
   */
  async generateResponse(params) {
    const {
      userMessage,
      conversationHistory = [],
      mode = 'free',
      scenario = null,
    } = params;

    console.log(`🟢 [LocalModel] Generating response (${this.model})`);

    try {
      // Build system prompt
      let systemPrompt = this.systemPrompts[mode] || this.systemPrompts.free;
      if (mode === 'scenario' && scenario) {
        const scenarioDesc = this.scenarioContexts[scenario] || 'You are helping a customer.';
        systemPrompt += `\n\nScenario: ${scenarioDesc}`;
      }

      // Build conversation context
      const messages = [];

      // Add system context
      messages.push({
        role: 'system',
        content: systemPrompt,
      });

      // Add conversation history
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      });

      // Add current message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Call local model via Ollama API (or compatible)
      const response = await this._callOllamaAPI(messages);

      // Parse response for errors
      const { mainResponse, errors } = this._parseResponse(response);

      console.log(`✅ [LocalModel] Response generated`);

      return {
        response: mainResponse,
        errors,
      };
    } catch (error) {
      console.error(`❌ [LocalModel] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Call Ollama API
   * @private
   */
  async _callOllamaAPI(messages) {
    try {
      // Format for Ollama chat API
      const payload = {
        model: this.model,
        messages: messages,
        stream: false,
        temperature: 0.7,
      };

      console.log(`🟢 Calling Ollama API: ${this.baseURL}/api/chat`);

      const response = await axios.post(`${this.baseURL}/api/chat`, payload, {
        timeout: 60000, // 60 second timeout for local model
      });

      const content = response.data.message?.content;
      if (!content) {
        throw new Error('No content in Ollama response');
      }

      return content;
    } catch (error) {
      console.error(`❌ Ollama API call failed: ${error.message}`);

      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to local model server at ${this.baseURL}. ` +
          `Make sure Ollama is running: ollama serve`
        );
      }

      throw error;
    }
  }

  /**
   * Parse response to extract errors
   * @private
   */
  _parseResponse(responseText) {
    const parts = responseText.split(/\[ERROR\]/);
    const mainResponse = parts[0].trim();

    const errors = [];
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        try {
          const errorText = parts[i].trim();
          const match = errorText.match(
            /Incorrect:\s*([^|]+)\s*\|\s*Correct:\s*([^|]+)\s*\|\s*Reason:\s*(.+)/
          );
          if (match) {
            errors.push({
              type: 'grammar',
              original: match[1].trim(),
              correction: match[2].trim(),
              explanation: match[3].trim(),
            });
          }
        } catch (e) {
          // Skip malformed errors
        }
      }
    }

    return { mainResponse, errors };
  }

  /**
   * Health check - verify model is working
   */
  async healthCheck() {
    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: 'こんにちは',
        stream: false,
      });

      return !!response.data.response;
    } catch (error) {
      console.error(`❌ Local model health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get list of available models on the local server
   */
  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      console.error(`❌ Failed to fetch available models: ${error.message}`);
      return [];
    }
  }

  /**
   * Switch to a different local model
   */
  switchModel(modelName) {
    console.log(`🔄 Switching local model to: ${modelName}`);
    this.model = modelName;
  }
}

export default LocalModelProvider;
