import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini API with v1 endpoint (not v1beta)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Available models to try in order (v1 API models)
const AVAILABLE_MODELS = [
  'gemini-2.0-flash',      // Newest, fastest
  'gemini-1.5-flash',      // Fast, good for N2 practice
  'gemini-1.5-pro',        // Most capable
];

let currentModel = AVAILABLE_MODELS[0];

// Store conversation history per userId
const conversationHistory = new Map();

// System prompts for different modes
const SYSTEM_PROMPTS = {
  free: `You are a friendly Japanese language tutor for N2-level learners.
Engage in natural Japanese conversation with the user.
Respond in Japanese.

Guidelines:
- Keep your response natural and conversational
- If the user makes grammatical errors or uses unnatural phrasing, point them out at the END of your response

Error format (only if there are mistakes):
[ERROR] Incorrect: <user's phrase> | Correct: <better phrasing> | Reason: <brief explanation>

Example:
User: "これは面白いですね"
Your response: "そうですね、とても面白いです。[ERROR] Incorrect: これは面白いですね | Correct: これは面白い | Reason: The i-adjective 面白い doesn't need です attached"

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

// Scenario descriptions for context
const SCENARIO_CONTEXT = {
  restaurant: 'You are a restaurant staff member taking a customer\'s reservation or order.',
  taxi: 'You are a taxi driver. The customer wants to go somewhere.',
  hotel: 'You are a hotel receptionist checking in a customer.',
  interview: 'You are conducting a job interview in Japanese.',
  coffee: 'You are a cafe staff member taking a customer\'s order.',
  shopping: 'You are a shop staff member helping a customer find products.',
};

// Function to parse Gemini response in plain text format with [ERROR] markers
function parseGeminiResponse(responseText, mode) {
  // Split response by [ERROR] marker
  const parts = responseText.split(/\[ERROR\]/);
  const mainResponse = parts[0].trim();

  const errors = [];
  if (parts.length > 1) {
    // Parse error information from remaining parts
    for (let i = 1; i < parts.length; i++) {
      try {
        const errorText = parts[i].trim();
        // Expected format: Incorrect: <phrase> | Correct: <correct> | Reason: <reason>
        const match = errorText.match(/Incorrect:\s*([^|]+)\s*\|\s*Correct:\s*([^|]+)\s*\|\s*Reason:\s*(.+)/);
        if (match) {
          errors.push({
            type: 'grammar',
            original: match[1].trim(),
            correction: match[2].trim(),
            explanation: match[3].trim(),
          });
        }
      } catch (e) {
        // Skip malformed error entries
      }
    }
  }

  return {
    mode: mode,
    response: mainResponse,
    errors: errors,
  };
}

// Mock response generator for development/quota exceeded scenarios
function generateMockResponse(userMessage, mode, scenario) {
  const mockResponses = {
    free: {
      'こんにちは': { response: 'こんにちは！お疲れ様です。今日はどんな日ですか？', errors: [] },
      'hi': { response: 'こんにちは！お疲れ様です。今日はどんな日ですか？', errors: [] },
      'hello': { response: 'こんにちは！お疲れ様です。今日はどんな日ですか？', errors: [] },
      'bạn là ai': { response: '私はAI日本語チューターです。N2レベルの学習者のお手伝いをしています。何かお手伝いすることはありますか？', errors: [] },
      'こんにちは、元気ですか': {
        response: 'ありがとうございます、元気です。あなたもお元気ですか？',
        errors: [{
          type: 'grammar',
          original: 'こんにちは、元気ですか',
          correction: 'こんにちは。元気ですか？/ こんにちは、お元気ですか？',
          explanation: 'Formal greeting should use 。 as sentence separator, not 、. Also, 元気ですか is casual; use お元気ですか for polite form.'
        }]
      }
    },
    scenario: {
      restaurant: { response: 'いらっしゃいませ！本日はご予約ですか？それとも、お席のご案内ですか？', errors: [] },
      taxi: { response: 'いらっしゃいませ。どちらへお運びしましょうか？', errors: [] },
      hotel: { response: 'いらっしゃいませ。本日はご宿泊ですか？', errors: [] },
      interview: { response: '本日はお忙しいところお越しいただき、ありがとうございます。では、まずはあなたの背景についてお聞きしてもよろしいでしょうか？', errors: [] },
      coffee: { response: 'いらっしゃいませ。本日は何をお召し上がりになりますか？', errors: [] },
      shopping: { response: 'いらっしゃいませ。何かお探しのものはありますか？', errors: [] },
    }
  };

  const key = mode === 'scenario' ? scenario : userMessage;
  const responseSet = mockResponses[mode];
  const mock = responseSet?.[key];

  if (mock) {
    return mock;
  }

  // Default mock response
  return {
    response: mode === 'scenario' 
      ? 'シナリオ会話モードです。自然な日本語で お話しください。'
      : '申し訳ありませんが、現在APIの制限があります。モック応答を使用しています。',
    errors: []
  };
}

// POST /api/kaiwa/chat
router.post('/chat', async (req, res) => {
  try {
    const userId = req.userId;
    const { message, mode = 'free', scenario = null } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const mode_lower = mode.toLowerCase();
    if (!['free', 'scenario'].includes(mode_lower)) {
      return res.status(400).json({ error: 'Invalid mode. Use "free" or "scenario"' });
    }

    // Initialize conversation history for this user if not exists
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }

    const history = conversationHistory.get(userId);

    console.log(`📝 [Kaiwa] User ${userId} (${mode_lower}): ${message}`);

    // Check if API key exists
    if (!process.env.GOOGLE_API_KEY) {
      console.error('❌ GOOGLE_API_KEY not found in environment');
      return res.status(500).json({ error: 'API Key not configured' });
    }

    // Build system prompt
    let systemPrompt = SYSTEM_PROMPTS[mode_lower];
    if (mode_lower === 'scenario' && scenario) {
      const scenarioDesc = SCENARIO_CONTEXT[scenario] || 'You are helping a customer in a real situation.';
      systemPrompt += `\n\nScenario: ${scenarioDesc}`;
    }

    // Build conversation history for Gemini
    const historyForAPI = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Initialize Gemini model with v1 API configuration
    const model = genAI.getGenerativeModel({ 
      model: currentModel,
    });

    // Call Gemini with multi-turn conversation
    const chat = model.startChat({
      history: historyForAPI,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    console.log(`📝 [Kaiwa] Using model: ${currentModel}`);
    console.log(`📝 [Kaiwa] Sending to Gemini...`);
    
    let response;
    let responseText;
    
    try {
      response = await chat.sendMessage(message);
      responseText = response.response.text();
    } catch (modelError) {
      console.error(`❌ Model error: ${modelError.message}`);
      
      // If quota exceeded or all models fail, use mock response
      if (modelError.message?.includes('429') || modelError.message?.includes('Quota exceeded')) {
        console.warn('⚠️ Quota exceeded on Gemini API - using mock response for development');
        console.warn('💡 To use real AI: 1) Get a new API key from https://ai.google.dev, 2) Add to .env, 3) Restart server');
        
        const mockResponse = generateMockResponse(message, mode_lower, req.body.scenario);
        
        // Store conversation in history
        history.push({
          role: 'user',
          content: message,
        });
        history.push({
          role: 'assistant',
          content: mockResponse.response,
        });

        if (history.length > 30) {
          history.splice(0, history.length - 30);
        }

        return res.json({
          mode: mode_lower,
          response: mockResponse.response,
          errors: mockResponse.errors,
          _dev: { message: 'Using mock response - API quota exceeded. See console for details.' }
        });
      }
      
      // If model not found, try fallback models
      if (modelError.message?.includes('404') || modelError.message?.includes('not found')) {
        console.warn(`⚠️ Model ${currentModel} not available, trying fallback models...`);
        
        for (const fallbackModel of AVAILABLE_MODELS) {
          if (fallbackModel === currentModel) continue;
          
          try {
            console.log(`🔄 Trying model: ${fallbackModel}`);
            const fallbackModelObj = genAI.getGenerativeModel({ model: fallbackModel });
            const fallbackChat = fallbackModelObj.startChat({
              history: historyForAPI,
            });
            response = await fallbackChat.sendMessage(message);
            responseText = response.response.text();
            currentModel = fallbackModel;
            console.log(`✅ Successfully switched to model: ${currentModel}`);
            break;
          } catch (fbError) {
            console.warn(`❌ Fallback model ${fallbackModel} failed: ${fbError.message}`);
            
            // If fallback also quota exceeded, use mock
            if (fbError.message?.includes('429') || fbError.message?.includes('Quota exceeded')) {
              console.warn('⚠️ All models hit quota limit - falling back to mock response');
              const mockResponse = generateMockResponse(message, mode_lower, req.body.scenario);
              
              history.push({
                role: 'user',
                content: message,
              });
              history.push({
                role: 'assistant',
                content: mockResponse.response,
              });

              if (history.length > 30) {
                history.splice(0, history.length - 30);
              }

              return res.json({
                mode: mode_lower,
                response: mockResponse.response,
                errors: mockResponse.errors,
                _dev: { message: 'Using mock response - API quota exceeded for all models.' }
              });
            }
          }
        }
        
        if (!responseText) {
          console.warn('⚠️ All Gemini models unavailable - using mock response');
          const mockResponse = generateMockResponse(message, mode_lower, req.body.scenario);
          
          history.push({
            role: 'user',
            content: message,
          });
          history.push({
            role: 'assistant',
            content: mockResponse.response,
          });

          if (history.length > 30) {
            history.splice(0, history.length - 30);
          }

          return res.json({
            mode: mode_lower,
            response: mockResponse.response,
            errors: mockResponse.errors,
            _dev: { message: 'Using mock response - Gemini API unavailable.' }
          });
        }
      } else {
        throw modelError;
      }
    }

    console.log(`✅ [Kaiwa] Raw response: ${responseText.substring(0, 200)}...`);

    // Parse response using the plain text format with [ERROR] markers
    const parsedResponse = parseGeminiResponse(responseText, mode_lower);

    // Store conversation in history
    history.push({
      role: 'user',
      content: message,
    });
    history.push({
      role: 'assistant',
      content: parsedResponse.response || responseText,
    });

    // Limit history to last 30 messages to avoid token overflow
    if (history.length > 30) {
      history.splice(0, history.length - 30);
    }

    console.log(`✅ [Kaiwa] Response ready. Errors: ${parsedResponse.errors?.length || 0}`);

    res.json(parsedResponse);
  } catch (error) {
    console.error('❌ [Kaiwa] Error:', error.message);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// GET /api/kaiwa/history - Get conversation history for user
router.get('/history', async (req, res) => {
  try {
    const userId = req.userId;
    const history = conversationHistory.get(userId) || [];

    // Format for display
    const formatted = history.map((msg, idx) => ({
      id: idx,
      role: msg.role,
      content: msg.content,
    }));

    res.json({ messages: formatted });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/kaiwa/history - Clear conversation history
router.delete('/history', async (req, res) => {
  try {
    const userId = req.userId;
    conversationHistory.delete(userId);
    res.json({ message: 'Conversation history cleared' });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
