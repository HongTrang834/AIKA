# AI Service Architecture - Centralized AI Management

## 📚 Overview

**AIService** là một lớp abstraction tập trung cho tất cả logic AI trong ứng dụng. Thay vì gọi API rải rác ở nhiều chỗ, tất cả đều đi qua **AIService** để dễ quản lý và switch models.

### Lợi Ích

✅ **Centralized Logic**: Tất cả AI calls đi qua một điểm duy nhất  
✅ **Easy Model Switching**: Đổi giữa Gemini ↔ Local Models chỉ bằng env variable  
✅ **Conversation Management**: Tự động quản lý history cho mỗi user  
✅ **Error Handling**: Unified error handling, fallback logic  
✅ **Provider Agnostic**: Thêm OpenAI, Claude, etc. chỉ bằng tạo provider mới

---

## 🏗️ Architecture

```
AIService (aiService.js - Singleton)
  │
  ├── Gemini Provider (providers/geminiProvider.js)
  │   ├── v1 API endpoint
  │   ├── Model fallback chain
  │   └── Mock response fallback
  │
  ├── Local Model Provider (providers/localModelProvider.js)
  │   ├── Ollama integration
  │   ├── LLaMA.cpp support
  │   └── Custom local models
  │
  └── OpenAI Provider (providers/openaiProvider.js) - Template
      ├── GPT-4, GPT-3.5-turbo
      └── Azure OpenAI support

Conversation History (per user)
  └── AIService manages Map<userId -> conversation[]>
```

---

## ⚙️ Configuration

### 1. **Gemini API (Cloud)** - Default

Set environment variables:

```bash
# .env
AI_PROVIDER=gemini
GOOGLE_API_KEY=your_api_key_here
```

### 2. **Local Model (Via Ollama)** - No API Keys!

#### Setup:

```bash
# Install Ollama
# From: https://ollama.ai

# Pull a model
ollama pull neural-chat
# or: ollama pull llama2, ollamavicuna, v.v.

# Start server (port 11434)
ollama serve
```

#### Configure:

```bash
# .env
AI_PROVIDER=local
LOCAL_MODEL_URL=http://localhost:11434
LOCAL_MODEL_NAME=neural-chat
```

**Recommended Models for Learning:**

- `neural-chat` - Good balance (7B, fast)
- `mistral` - Faster, more concise (7B)
- `llama2` - Larger, better reasoning (13B - slow)
- `orca-mini` - Compact, fast (3B)

### 3. **Custom Local Model (LLaMA.cpp)**

```bash
# Build llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make

# Download model
wget https://huggingface.co/models/gguf-file.gguf

# Run server
./server -m model.gguf --host 0.0.0.0 --port 8000
```

```bash
# .env
AI_PROVIDER=local
LOCAL_MODEL_URL=http://localhost:8000
LOCAL_MODEL_NAME=local-model
```

---

## 🚀 Usage

### Backend Routes

#### 1. **Chat** (Main endpoint)

```typescript
POST /api/kaiwa/chat
{
  "message": "こんにちは、I am learning Japanese",
  "mode": "free",  // or "scenario"
  "scenario": "restaurant"
}

Response:
{
  "response": "こんにちは！お疲れ様です...",
  "errors": [
    {
      "type": "grammar",
      "original": "I am learning",
      "correction": "学んでいます",
      "explanation": "..."
    }
  ],
  "metadata": {
    "provider": "Google Gemini",
    "mode": "free",
    "totalMessages": 5
  }
}
```

#### 2. **Get Provider Info**

```typescript
GET /api/kaiwa/provider

Response:
{
  "name": "Google Gemini",
  "type": "cloud",
  "status": "ready"
}
```

#### 3. **Switch Provider** (Admin)

```typescript
POST /api/kaiwa/provider/switch
{
  "provider": "local",
  "config": {
    "baseURL": "http://localhost:11434",
    "model": "neural-chat"
  }
}

Response:
{
  "message": "Provider switched to local",
  "provider": {
    "name": "Local Model (neural-chat)",
    "type": "local",
    "status": "ready"
  }
}
```

#### 4. **Health Check**

```typescript
GET /api/kaiwa/health

Response:
{
  "status": "healthy",
  "provider": "Google Gemini",
  "message": "AI service is ready"
}
```

### Code Usage

```typescript
// backend/someRoute.js
import aiService from "../services/aiService.js";

// Use directly
const result = await aiService.chat({
  userId: "user123",
  message: "こんにちは",
  mode: "free",
  scenario: null,
});

console.log(result.response);
console.log(result.errors);
console.log(result.metadata.provider);

// Clear history
aiService.clearHistory("user123");

// Get provider info
const info = aiService.getProviderInfo();

// Switch provider (runtime)
aiService.switchProvider("local", {
  baseURL: "http://localhost:11434",
  model: "neural-chat",
});
```

---

## 🔄 Model Switching Scenarios

### Scenario 1: Development (Local Model)

```bash
# Fast iteration, no API keys, free
AI_PROVIDER=local
LOCAL_MODEL_NAME=neural-chat
```

### Scenario 2: Production (Gemini)

```bash
# Better quality, handles edge cases
AI_PROVIDER=gemini
GOOGLE_API_KEY=xxx
```

### Scenario 3: Conditional Switching

```typescript
// Switch based on time/load
if (isHighLoad()) {
  aiService.switchProvider('local', {...});
} else {
  aiService.switchProvider('gemini', {...});
}
```

### Scenario 4: Fallback Chain

```typescript
// Try gemini first, fallback to local
try {
  aiService.switchProvider('gemini');
  const result = await aiService.chat(...);
} catch (error) {
  console.warn('Gemini failed, switching to local');
  aiService.switchProvider('local');
  const result = await aiService.chat(...);
}
```

---

## 📡 Adding New Providers

### Create Provider Template

```javascript
// backend/services/providers/openaiProvider.js

class OpenAIProvider {
  constructor(config) {
    this.name = "OpenAI";
    this.type = "cloud";
    this.apiKey = config.apiKey;
    // Initialize OpenAI client
  }

  async generateResponse(params) {
    const { userMessage, conversationHistory, mode, scenario } = params;
    // Implement OpenAI logic
    return { response: "...", errors: [] };
  }

  async healthCheck() {
    // Verify OpenAI API is working
  }
}

export default OpenAIProvider;
```

### Register in AIService

```typescript
// backend/services/aiService.js

switch (this.provider) {
  case "openai":
    this.currentProvider = new OpenAIProvider({
      apiKey: process.env.OPENAI_API_KEY,
    });
    break;
}
```

### Use New Provider

```bash
# .env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxx
```

---

## 🧪 Testing

### Test 1: Local Model Setup Automation

```bash
# Auto install & run Ollama (Windows)
# (Create batch script)

@echo off
echo Installing Ollama...
choco install ollama -y

echo Pulling model...
ollama pull neural-chat

echo Starting Ollama server...
start ollama serve

echo Setup complete!
pause
```

### Test 2: Verify Provider Switching

```bash
# Terminal 1: Start with Gemini
export AI_PROVIDER=gemini
npm run dev:backend

# Terminal 2: Switch to Local (after Ollama running)
curl -X POST http://localhost:3000/api/kaiwa/provider/switch \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "local",
    "config": {
      "baseURL": "http://localhost:11434",
      "model": "neural-chat"
    }
  }'

# Verify
curl http://localhost:3000/api/kaiwa/provider
```

### Test 3: Chat with Different Providers

```bash
# With Gemini
curl -X POST http://localhost:3000/api/kaiwa/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "こんにちは",
    "mode": "free"
  }'

# Switch to Local
# (Run switch command above)

# Chat again with Local
curl -X POST http://localhost:3000/api/kaiwa/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "こんにちは",
    "mode": "free"
  }'
```

---

## 📊 Performance Comparison

| Provider           | Speed  | Quality   | Cost | Setup           |
| ------------------ | ------ | --------- | ---- | --------------- |
| **Gemini**         | Medium | High      | $$   | API key         |
| **Local (Ollama)** | Slow   | Medium    | Free | ~10 min install |
| **OpenAI**         | Medium | Very High | $$$  | API key         |

---

## 🔐 Security Notes

- **Gemini API Key**: Keep in `.env` (gitignore)
- **Local Model**: No credentials needed, runs locally
- **Admin Endpoints**: Add middleware to `/provider/switch`

```typescript
// backend/middleware/adminCheck.js
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
};

// Use in route
router.post("/provider/switch", requireAdmin, async (req, res) => {
  // ...
});
```

---

## 🐛 Troubleshooting

### "Cannot connect to local model server"

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Check firewall isn't blocking 11434
```

### "Model not found"

```bash
# List available models
ollama list

# Pull missing model
ollama pull neural-chat
```

### "Quota exceeded" (Gemini)

```bash
# Automatically falls back to mock response
# Get new API key from https://ai.google.dev
# Or switch to local model
```

---

## 🎯 Next Steps

1. ✅ **Test with current Gemini setup**
2. ⬜ **Setup Ollama locally** and test switching
3. ⬜ **Add OpenAI provider** as backup
4. ⬜ **Implement RAG** (uses same service)
5. ⬜ **Deploy production** setup
