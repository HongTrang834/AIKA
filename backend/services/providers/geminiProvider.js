/**
 * Gemini AI Provider
 * Implementation of Google's Generative AI API for N2 Japanese learning
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiProvider {
  constructor(config) {
    this.name = 'Google Gemini';
    this.type = 'cloud';
    this.apiKey = config.apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);

    // Available models (v1 API)
    this.availableModels = [
      'gemini-2.0-flash',      // Newest, fastest
      'gemini-1.5-flash',      // Fast, good for N2
      'gemini-1.5-pro',        // Most capable
    ];

    this.currentModel = this.availableModels[0];

    // System prompts for different modes
    this.systemPrompts = {
      free: `You are a friendly Japanese language tutor for N2-level learners.
Engage in natural Japanese conversation with the user.
Respond in Japanese.

Guidelines:
- Keep your response natural and conversational
- If the user makes grammatical errors or uses unnatural phrasing, point them out at the END of your response

Error format (only if there are mistakes):
[ERROR] Incorrect: <user's phrase> | Correct: <better phrasing> | Reason: <brief explanation>

If there are no errors, just respond normally without [ERROR] marker.`,

      scenario: `You are a Japanese conversation simulator for N2-level learners.
The user is practicing Japanese through a specific real-world scenario.
Follow the scenario context and respond naturally as if you're in that situation.
Respond in Japanese only.

Guidelines:
- Stay focused on the scenario throughout the conversation
- Respond naturally to what the user says
- If the user makes grammatical errors or unnatural phrasing, point them out at the END

Error format (only if there are mistakes):
[ERROR] Incorrect: <user's phrase> | Correct: <better phrasing> | Reason: <brief explanation>

If there are no errors, just respond normally without [ERROR] marker.`,
    };

    // Scenario descriptions
    this.scenarioContexts = {
      restaurant: 'You are a restaurant staff member taking a customer\'s reservation or order.',
      taxi: 'You are a taxi driver. The customer wants to go somewhere.',
      hotel: 'You are a hotel receptionist checking in a customer.',
      interview: 'You are conducting a job interview in Japanese.',
      coffee: 'You are a cafe staff member taking a customer\'s order.',
      shopping: 'You are a shop staff member helping a customer find products.',
    };

    if (!this.apiKey) {
      throw new Error('❌ GOOGLE_API_KEY not provided in config');
    }
  }

  /**
   * Generate response using Gemini API
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

    console.log(`🔵 [Gemini] Generating response (model: ${this.currentModel})`);

    try {
      // Build system prompt
      let systemPrompt = this.systemPrompts[mode] || this.systemPrompts.free;
      if (mode === 'scenario' && scenario) {
        const scenarioDesc = this.scenarioContexts[scenario] || 'You are helping a customer.';
        systemPrompt += `\n\nScenario: ${scenarioDesc}`;
      }

      // Convert conversation history to Gemini format
      const historyForAPI = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Get model instance
      const model = this.genAI.getGenerativeModel({ model: this.currentModel });

      // Start chat session
      const chat = model.startChat({
        history: historyForAPI,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      // Send message
      const response = await chat.sendMessage(userMessage);
      const responseText = response.response.text();

      // Parse response for errors
      const { mainResponse, errors } = this._parseResponse(responseText);

      console.log(`✅ [Gemini] Response generated successfully`);

      return {
        response: mainResponse,
        errors,
      };
    } catch (error) {
      console.error(`❌ [Gemini] Error: ${error.message}`);

      // Quota exceeded - return mock response
      if (error.message?.includes('429') || error.message?.includes('Quota exceeded')) {
        console.warn('⚠️ Gemini quota exceeded - using fallback response');
        return this._getMockResponse(userMessage, mode, scenario);
      }

      // Model not found - try fallback
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        console.warn(`⚠️ Model ${this.currentModel} not available - trying fallback`);
        return await this._tryFallbackModel(
          userMessage,
          conversationHistory,
          mode,
          scenario,
          error
        );
      }

      throw error;
    }
  }

  /**
   * Try fallback models if primary fails
   * @private
   */
  async _tryFallbackModel(userMessage, history, mode, scenario, previousError) {
    for (const model of this.availableModels) {
      if (model === this.currentModel) continue;

      try {
        console.log(`🔄 Trying fallback model: ${model}`);
        this.currentModel = model;

        const systemPrompt = this.systemPrompts[mode];
        const historyForAPI = history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));

        const modelInstance = this.genAI.getGenerativeModel({ model });
        const chat = modelInstance.startChat({
          history: historyForAPI,
          generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 1024 },
        });

        const response = await chat.sendMessage(userMessage);
        const responseText = response.response.text();
        const { mainResponse, errors } = this._parseResponse(responseText);

        console.log(`✅ Fallback model ${model} succeeded`);
        return { response: mainResponse, errors };
      } catch (e) {
        console.warn(`⚠️ Fallback model ${model} also failed: ${e.message}`);
      }
    }

    // All models failed - use mock
    return this._getMockResponse(userMessage, mode, scenario);
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
   * Get mock response (fallback)
   * @private
   */
  _getMockResponse(userMessage, mode, scenario) {
    const mockResponses = {
      free: {
        'こんにちは': 'こんにちは！お疲れ様です。今日はどんな日ですか？',
        'hi': 'こんにちは！お疲れ様です。今日はどんな日ですか？',
        'default': 'わかりました。もう一度日本語でお願いします。',
      },
      scenario: {
        restaurant: 'いらっしゃいませ！本日はご予約ですか？',
        taxi: 'いらっしゃいませ。どちらへお運びしましょうか？',
        hotel: 'いらっしゃいませ。本日はご宿泊ですか？',
        interview: '本日はお忙しいところお越しいただき、ありがとうございます。',
        coffee: 'いらっしゃいませ。本日は何をお召し上がりになりますか？',
        shopping: 'いらっしゃいませ。何かお探しのものはありますか？',
      },
    };

    const key = mode === 'scenario' ? scenario : userMessage;
    const response =
      mockResponses[mode]?.[key] ||
      mockResponses[mode]?.['default'] ||
      'シナリオ会話モードです。自然な日本語でお話しください。';

    return { response, errors: [] };
  }

  /**
   * Health check - verify API is working
   */
  async healthCheck() {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.currentModel });
      const response = await model.generateContent('こんにちは');
      return !!response.response.text();
    } catch (error) {
      console.error(`❌ Gemini health check failed: ${error.message}`);
      return false;
    }
  }
}

export default GeminiProvider;
