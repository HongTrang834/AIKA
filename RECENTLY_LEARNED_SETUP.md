/\*\*

- SETUP GUIDE: Recently Learned Section
-
- Para que o "Recently Learned" funcione, siga os passos:
  \*/

## PASSO 1: Apply Database Migration ✅ OBRIGATÓRIO

```bash
# Aplicar migration dos learning history tables
psql -U postgres -d aika_db -f database/migration_learning_history.sql
```

**Verifica se foi criado:**

```bash
psql -U postgres -d aika_db -c "\dt user_vocabulary_learned user_grammar_learned"
psql -U postgres -d aika_db -c "\dv recently_learned_items"
```

## PASSO 2: Endpoints Criados ✅ BACKEND

**POST /api/progress/vocab-learned/:vocabId**

- Marca um vocabulário como aprendido
- Body: `{ "status": 1 }` (0=NEW, 1=LEARNING, 2=MASTERED)
- Response: `{ success: true, learning: { id, vocabulary_id, status, review_count } }`

**POST /api/progress/grammar-learned/:grammarId**

- Marca um padrão de gramática como aprendido
- Body: `{ "status": 1 }` (0=NEW, 1=LEARNING, 2=MASTERED)
- Response: `{ success: true, learning: { id, grammar_id, status, review_count } }`

**GET /api/progress/recently-learned?limit=5**

- Retorna últimos 5 itens aprendidos
- Queries `recently_learned_items` view
- Return: `[{ type, word, meaning, pronunciation, status, learned_at, review_count }]`

## PASSO 3: Frontend Hooks ✅ FRONTEND

**Flashcards.tsx - handleUpdateFlashcard()**

```typescript
// Quando flashcard é revisado, chama:
POST /api/progress/vocab-learned/:vocabId
```

**Dashboard.tsx - RecentlyLearned Section**

```typescript
// Fetch com:
GET /api/progress/recently-learned?limit=5

// Renderiza cards com status badges
```

## PASSO 4: Flow Completo (COMO FUNCIONA)

```
1. Usuário estuda flashcard
   ↓
2. Clica em "Good" ou "Hard" (quality score)
   ↓
3. handleUpdateFlashcard() é chamado
   ↓
4. Chama POST /api/progress/vocab-learned/:vocabId
   ↓
5. Insere em user_vocabulary_learned (ou faz UPDATE se já existe)
   ↓
6. Volta para Dashboard (ou página home)
   ↓
7. Dashboard carrega recentemente-learned section
   ↓
8. Chama GET /api/progress/recently-learned
   ↓
9. Query recentemente_learned_items VIEW
   ↓
10. Renderiza cards da lista aprendida
```

## PASSO 5: Teste Manualmente 🧪

**1. Aplicar migrations:**

```bash
psql -U postgres -d aika_db -f database/migration_learning_history.sql
```

**2. Assumir um token (test na frontend):**

- Logar na aplicação
- Abrir DevTools → Network tab

**3. Estudar um flashcard:**

- Ir para Flashcards
- Estudar um card
- Avaliar (click Good/Hard)

**4. Check se foi inserido:**

```bash
psql -U postgres -d aika_db
SELECT * FROM user_vocabulary_learned WHERE user_id = 1 LIMIT 5;
```

**5. Test endpoint diretamente:**

```bash
# Mark vocab 1 as learned
curl -X POST http://localhost:5000/api/progress/vocab-learned/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": 2}'

# Get recently learned
curl http://localhost:5000/api/progress/recently-learned \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**6. Check Dashboard:**

- Ir para Dashboard
- Scroll down para "Recently Learned" section
- Verificar se os cards aparecem com status correto

## FIX RÁPIDO: Se Recently Learned não atualizar

**Problema 1: Migration não foi aplicada**

```bash
psql -U postgres -d aika_db -f database/migration_learning_history.sql
```

**Problema 2: Flashcard não tem vocab_id**

- Check console se `currentCard.vocab_id` é undefined
- Verify flashcard data structure em API

**Problema 3: Endpoint retorna erro 404**

- Verify que vocabulary existe:
  ```bash
  psql -U postgres -d aika_db -c "SELECT * FROM vocabulary LIMIT 1;"
  ```

**Problema 4: Recently learned retorna vazio**

- Check se migration view existe:
  ```bash
  psql -U postgres -d aika_db -c "SELECT COUNT(*) FROM recently_learned_items WHERE user_id = YOUR_ID;"
  ```

## NEXT STEPS

1. ✅ Apply migration
2. ✅ Study flashcards
3. ✅ Check Recently Learned updates
4. 🔄 Implement similar logic para vocabulário study (VocabLab, Kaiwa)
5. 📊 Add statistics tracking (total mastered, learning speed, etc)
