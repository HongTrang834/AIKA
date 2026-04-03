# Database Setup Instructions - AIKa Japanese Learning App

## Current Status ⚠️

- Frontend ✅ Running on http://localhost:5173
- Backend ✅ Running on http://localhost:3000
- Database ⏳ Schema needs migration (flashcard_decks table)

## Why Decks Not Working?

The app is working in **temporary/local mode** because the `flashcard_decks` table doesn't exist yet. You can:

1. Create decks locally (temporary, not saved)
2. Run migration to enable persistent decks

---

## Option 1: Quick Setup (Use Local Temporary Decks)

The app works now! You can create and use decks locally. When you restart, new decks are generated.

**Steps:**

1. Backend is running on `http://localhost:3000`
2. Frontend is running on `http://localhost:5173`
3. Login → Go to Vocab → Click `+` → Create temporary deck

---

## Option 2: Persistent Decks (Requires Database)

### Prerequisites

- PostgreSQL installed and running
- Know your PostgreSQL password

### Step 1: Update Backend `.env`

Edit `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/aika_db
JWT_SECRET=your_secret_key_change_in_production
PORT=3000
NODE_ENV=development
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

## Step 2a: Using pgAdmin (Easiest)

1. Open pgAdmin (usually `http://localhost:5050`)
2. Right-click `Databases` → `Create` → `Database`
3. Name: `aika_db`
4. Open Query Tool
5. Copy entire content from `database/add_decks.sql`
6. Run the query

## Step 2b: Using Node Script (If PostgreSQL Connection Works)

From project root:

```bash
cd backend
node setup-decks.js
```

## Step 2c: Using PSQL Command Line

```bash
psql -U postgres -d aika_db -f database/add_decks.sql
```

You may be prompted for password - enter your PostgreSQL password.

---

## Verify Setup Worked ✅

1. Restart your app
2. Login
3. Go to Vocab → Click `+`
4. Should see 4 default decks:
   - N2 Vocabulary (blue)
   - Kanji Practice (red)
   - Grammar Patterns (green)
   - Review (purple)

---

## Troubleshooting

### Error: "password authentication failed"

- Your `.env` DATABASE_URL has wrong password
- Check PostgreSQL password in System Environment

### Error: "FATAL: database 'aika_db' does not exist"

- Create the database first:
  ```bash
  createdb -U postgres aika_db
  ```

### Still showing "No decks available"?

- App is in temporary local mode ✅ (working!)
- Run migration for persistence

---

## For Testing

App works perfectly with or without database. All CRUD operations work locally. Migration just makes it permanent.

**Current Workaround Status:** ✅ **WORKING**

- Create decks: Works (temporary)
- Add to flashcard: Works (needs deck_id, accepts any ID)
- View vocabularies: Works
- Select topics: Works

---

## Next Steps After Migration

Once decks table exists:

1. Create/delete decks - persists in DB
2. Default decks auto-create for new users
3. All flashcard data linked to deck_id
