/**
 * Kaiwa Hub Routes
 * Conversation practice with AI
 * Uses centralized AIService for flexible model switching
 */

import express from 'express';
import aiService from '../services/aiService.js';

const router = express.Router();

/**
 * POST /api/kaiwa/chat
 * Generate AI response for Japanese conversation practice
 *
 * Request body:
 * {
 *   message: string (user's message in Japanese)
 *   mode: 'free' | 'scenario' (conversation mode)
 *   scenario: string (scenario name if mode='scenario')
 * }
 *
 * Response:
 * {
 *   response: string (AI response in Japanese)
 *   errors: Array (grammar/usage errors detected)
 *   metadata: Object (provider info, mode, scenario)
 * }
 */
router.post('/chat', async (req, res) => {
  try {
    const userId = req.userId;
    const { message, mode = 'free', scenario = null } = req.body;

    // Validate input
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const mode_lower = mode.toLowerCase();
    if (!['free', 'scenario'].includes(mode_lower)) {
      return res.status(400).json({ error: 'Invalid mode. Use "free" or "scenario"' });
    }

    console.log(`📝 [Kaiwa] User ${userId} (${mode_lower}): "${message}"`);
    console.log(`🤖 [Kaiwa] AI Provider: ${aiService.getProviderInfo().name}`);

    // Call AIService (handles conversation history, model selection, etc.)
    const result = await aiService.chat({
      userId,
      message,
      mode: mode_lower,
      scenario,
    });

    console.log(`✅ [Kaiwa] Response generated (${result.metadata.provider})`);

    res.json({
      mode: mode_lower,
      response: result.response,
      errors: result.errors,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('❌ [Kaiwa] Error:', error.message);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

/**
 * GET /api/kaiwa/history
 * Get conversation history for current user
 *
 * Response:
 * {
 *   messages: Array of { id, role, content }
 * }
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.userId;
    const history = aiService.getHistory(userId);

    const formatted = history.map((msg, idx) => ({
      id: idx,
      role: msg.role,
      content: msg.content,
    }));

    res.json({ messages: formatted });
  } catch (error) {
    console.error('❌ Error fetching history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/kaiwa/history
 * Clear conversation history for current user
 *
 * Response:
 * {
 *   message: success message
 * }
 */
router.delete('/history', async (req, res) => {
  try {
    const userId = req.userId;
    aiService.clearHistory(userId);
    res.json({ message: 'Conversation history cleared' });
  } catch (error) {
    console.error('❌ Error clearing history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/kaiwa/provider
 * Get current AI provider information
 *
 * Response:
 * {
 *   name: string (provider name)
 *   type: string ('cloud' | 'local')
 *   status: string
 * }
 */
router.get('/provider', async (req, res) => {
  try {
    const providerInfo = aiService.getProviderInfo();
    res.json(providerInfo);
  } catch (error) {
    console.error('❌ Error getting provider info:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/kaiwa/provider/switch
 * Switch AI provider at runtime
 * Admin only
 *
 * Request body:
 * {
 *   provider: 'gemini' | 'local' | 'openai'
 *   config: { baseURL, model, apiKey, etc. } (provider-specific config)
 * }
 *
 * Response:
 * {
 *   message: success message
 *   provider: new provider info
 * }
 */
router.post('/provider/switch', async (req, res) => {
  try {
    // TODO: Add admin check middleware
    const { provider, config = {} } = req.body;

    console.log(`🔄 Switching AI provider to: ${provider}`);
    aiService.switchProvider(provider, config);

    const newProviderInfo = aiService.getProviderInfo();
    res.json({
      message: `Provider switched to ${provider}`,
      provider: newProviderInfo,
    });
  } catch (error) {
    console.error('❌ Error switching provider:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/kaiwa/health
 * Health check for AI service
 *
 * Response:
 * {
 *   status: 'healthy' | 'error'
 *   provider: string
 *   message: string (if error)
 * }
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await aiService.healthCheck();
    const providerInfo = aiService.getProviderInfo();

    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      provider: providerInfo.name,
      message: isHealthy ? 'AI service is ready' : 'AI service is not responding',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export default router;
