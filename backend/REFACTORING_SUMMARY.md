# AI Service Structure - Visual Overview

## 📂 File Organization

```
backend/
├── services/
│   ├── aiService.js ........................ Main singleton service
│   ├── providers/
│   │   ├── geminiProvider.js .............. Google Gemini API implementation
│   │   ├── localModelProvider.js .......... Ollama/Local models implementation
│   │   └── openaiProvider.js ............. [Template] OpenAI implementation
│   └── [Future]
│       ├── claudeProvider.js ............. [Template] Anthropic Claude
│       └── azureProvider.js .............. [Template] Azure OpenAI
│
├── routes/
│   └── kaiwa.js ........................... Simplified! Now just 120 lines
│       (Was 400+ lines - all moved to service)
│
├── db.js
├── server.js
└── AI_SERVICE_GUIDE.md .................... This guide
```

## 🔄 Data Flow Comparison

### BEFORE (Rải rác):

```
kaiwa.js route
    ├─ Parse user input
    ├─ Initialize Gemini API
    ├─ Build system prompt
    ├─ Call Gemini model
    ├─ Error handling (429 → try fallback)
    ├─ Parse response
    ├─ Manage conversation history
    └─ Return response

(ALL IN ONE FILE - 400+ lines, difficult to change)
```

### AFTER (Centralized):

```
kaiwa.js route
    │
    ├─ Validate input
    └─ Call aiService.chat({userId, message, mode, scenario})
        │
        ├─ Determine provider (Gemini/Local/OpenAI)
        ├─ Call provider.generateResponse()
        ├─ Manage history
        └─ Return {response, errors, metadata}

└─ Return response

(CLEAN: 120 lines, easy to understand, easy to extend)
```

## 🎯 Key Changes Made

### 1. **Extracted All AI Logic to AIService**

- ✅ Conversation history management
- ✅ Provider initialization
- ✅ Model selection
- ✅ Error handling
- ✅ Provider switching

### 2. **Created Provider Abstraction**

- ✅ GeminiProvider (working)
- ✅ LocalModelProvider (template)
- ✅ OpenAIProvider (template for completion)

### 3. **Simplified kaiwa.js**

- Removed: 400+ lines of logic
- Kept: Clean 120-line route definitions
- Result: **~70% code reduction**

### 4. **Added Provider Switching APIs**

```bash
GET  /api/kaiwa/provider              # Current provider info
POST /api/kaiwa/provider/switch       # Switch providers at runtime
GET  /api/kaiwa/health                # Health check
```

---

## 💡 Usage Examples

### Example 1: Use Default Provider (Gemini)

```bash
# No changes needed, just works
POST /api/kaiwa/chat
{
  "message": "こんにちは"
}
```

### Example 2: Switch to Local Model

```bash
# Admin switch provider
POST /api/kaiwa/provider/switch
{
  "provider": "local",
  "config": {
    "model": "neural-chat"
  }
}

# Now all chats use local model
POST /api/kaiwa/chat
{
  "message": "こんにちは"
}
# Uses local model, not Gemini
```

### Example 3: Add New Provider

```typescript
// 1. Create backend/services/providers/claudeProvider.js
class ClaudeProvider {
  async generateResponse(params) { ... }
}

// 2. Register in aiService.js
switch (this.provider) {
  case 'claude':
    this.currentProvider = new ClaudeProvider(...);
    break;
}

// 3. Use it
POST /api/kaiwa/provider/switch
{ "provider": "claude" }
```

---

## 🧪 Quick Test

### Test 1: Verify Structure

```bash
# From project root
ls -la backend/services/
# Should show:
# - aiService.js
# - providers/
#   ├── geminiProvider.js
#   └── localModelProvider.js
```

### Test 2: Current Provider

```bash
curl http://localhost:3000/api/kaiwa/provider
# Response: { "name": "Google Gemini", "type": "cloud", ... }
```

### Test 3: Chat (Using Provider)

```bash
curl -X POST http://localhost:3000/api/kaiwa/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "こんにちは"}'
# Response: { "response": "こんにちは...", "metadata": {...} }
```

---

## 📚 Next Phase: RAG Integration

The **AIService** is designed to work seamlessly with RAG (Retrieval-Augmented Generation):

```typescript
// Future usage in RAG
async chat(params) {
  // 1. Get conversation history
  const history = this.getHistory(params.userId);

  // 2. Retrieve relevant content from DB
  const ragContext = await rag.search(params.message);

  // 3. Call provider with enriched context
  const result = await this.currentProvider.generateResponse({
    ...params,
    ragContext,  // Add RAG data
  });

  return result;
}
```

No changes needed to routes - everything works automatically!

---

## ✅ Checklist

- [x] Created aiService.js singleton
- [x] Created GeminiProvider
- [x] Created LocalModelProvider
- [x] Updated kaiwa.js routes
- [x] Added provider switching APIs
- [x] Created documentation
- [ ] Test with local Ollama
- [ ] Create OpenAI provider
- [ ] Integrate RAG
- [ ] Deploy to production

---

## 🤔 FAQ

**Q: Do I need to restart the server to switch providers?**
A: No! Switch dynamically via API `/provider/switch`

**Q: Can I use multiple providers at once?**
A: Currently: one active provider per instance  
Future: Can create separate service instances per user

**Q: How do I add a new LLM provider?**
A: Create `backend/services/providers/xxxProvider.js` with `generateResponse()` method

**Q: Will this affect existing frontend code?**
A: **No!** Response format is the same, only internal logic changed

**Q: What about conversation history?**
A: Still managed transparently by AIService, no frontend changes needed

---

## 📞 Support

See [AI_SERVICE_GUIDE.md](./AI_SERVICE_GUIDE.md) for detailed documentation on:

- Setup instructions for each provider
- Environment variables
- Testing procedures
- Troubleshooting
- Performance comparisons
