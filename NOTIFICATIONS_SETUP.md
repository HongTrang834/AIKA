# Notification System - Quick Setup Guide

## 🚀 5-Minute Integration

### Step 1: Apply Database Migration (1 minute)

```bash
cd d:\DATN\n2-japanese-learning

# Apply the notification tables migration
psql -U postgres -d aika_db -f database/migration_notifications.sql
```

**Expected Output**:

```
CREATE TABLE
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE FUNCTION
CREATE TRIGGER
CREATE TABLE
CREATE INDEX
GRANT
GRANT
```

---

### Step 2: Install node-cron (if needed)

```bash
npm install node-cron
```

---

### Step 3: Update server.js (2 minutes)

**Location**: `/backend/server.js`

**Add these imports at the top**:

```javascript
import notificationRoutes from "./routes/notifications.js";
import NotificationService from "./services/notificationService.js";
import cron from "node-cron";
```

**Add notification routes** (find your other app.use() statements):

```javascript
// Around line 50-60, after other routes
app.use("/api/notifications", notificationRoutes);
```

**Initialize cron jobs** (add after database connection is established):

```javascript
// After your database connection setup (around line 80)
NotificationService.initializeCronJobs();
console.log("✅ Notification system initialized");
```

**Complete example of routes section**:

```javascript
// Notification routes
app.use("/api/notifications", notificationRoutes);

// Other existing routes...
app.use("/api/progress", progressRoutes);
app.use("/api/user", userRoutes);
// ... etc
```

---

### Step 4: Add NotificationPanel to TopBar (1 minute)

**Location**: `/frontend/src/components/TopBar.tsx`

**Find the TopBar component and add NotificationPanel**:

```typescript
// Add import at top
import NotificationPanel from './NotificationPanel';

// In your TopBar JSX (typically in the header right side), add:
<NotificationPanel />
```

**Example of where to add it** (usually next to user profile/settings):

```typescript
<div className="flex items-center gap-2">
  <NotificationPanel />
  {/* Other icons like settings, profile, etc */}
</div>
```

---

### Step 5: Restart Server (1 minute)

```bash
# Kill existing process
npm run dev

# Or if running in terminal, press Ctrl+C and restart
npm run dev
```

**Check logs for**:

```
✅ Notification system initialized
⏰ Initializing notification cron jobs...
✅ Notification cron jobs initialized
🟢 Notification routes registered
```

---

## ✅ Verification Checklist

After setup, verify each component:

### 1. Database

```bash
psql -U postgres -d aika_db -c "SELECT COUNT(*) FROM notifications;"
```

Should return: ✅ count = 0 (table exists but empty initially)

### 2. Backend Routes

```bash
# In another terminal
curl -X GET http://localhost:3000/api/notifications/count \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Should return:

```json
{ "success": true, "unreadCount": 0 }
```

### 3. Frontend Component

- Open browser console: No errors?
- Check TopBar for bell icon
- Click bell icon - does dropdown appear?

### 4. Cron Jobs Running

- Check server logs for cron job confirmations
- Check if achievement notification triggers around user streaks

---

## 🧪 Testing Notifications

### Test 1: Achievement Notification (Immediate)

```bash
# Manually trigger achievement check (useful for testing)
curl -X POST http://localhost:3000/api/notifications/trigger/achievement \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 2: Weekly Summary (Immediate)

```bash
curl -X POST http://localhost:3000/api/notifications/trigger/weekly-summary \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 3: Conversation Ready (Immediate)

```bash
curl -X POST http://localhost:3000/api/notifications/trigger/conversation-ready \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 4: Review Due (Immediate)

```bash
curl -X POST http://localhost:3000/api/notifications/trigger/review-due \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📊 Check Cron Job Status

**View all active notifications in database**:

```bash
psql -U postgres -d aika_db

# In psql prompt:
SELECT type, COUNT(*) as count FROM notifications GROUP BY type;
```

**Monitor notification creation in real-time**:

```bash
watch -n 5 "psql -U postgres -d aika_db -c \"SELECT COUNT(*) FROM notifications WHERE created_at > NOW() - INTERVAL '1 minute';\""
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'node-cron'"

**Solution**:

```bash
npm install node-cron
npm run dev
```

### Issue: Notification routes return 404

**Solution**: Make sure you added this line to server.js:

```javascript
app.use("/api/notifications", notificationRoutes);
```

### Issue: No unread count badge showing

**Solution**:

- Check browser console for errors
- Verify token is being sent in Authorization header
- Check that `/api/notifications/count` endpoint works

### Issue: Cron jobs not running (check server logs)

**Solution**:

- Make sure `NotificationService.initializeCronJobs()` is called
- Check Node environment (node-cron works in all environments)
- Verify server timezone settings

### Issue: NotificationPanel not showing in TopBar

**Solution**:

- Make sure import statement is added: `import NotificationPanel from './NotificationPanel';`
- Verify component is added to JSX: `<NotificationPanel />`
- Check for TypeScript compilation errors in browser console

---

## 📈 Next Steps (After Verification)

Once everything is working:

1. ✅ Monitor notification delivery (check server logs)
2. ✅ Test with real user actions (study flashcard → see notification)
3. ✅ Monitor database size (notifications table growth)
4. ⏭️ Implement SRS algorithm for better Review Due scheduling
5. ⏭️ Add New Content Available notifications (requires lessons.released_at)
6. ⏭️ Create Admin Panel for notification management

---

## 🎯 Current Notification Schedule

| Type                   | Trigger                             | Frequency              |
| ---------------------- | ----------------------------------- | ---------------------- |
| **Review Due**         | Items with last_reviewed_at < today | Every 6 hours          |
| **Achievement**        | User reaches 7/14/30/100 day streak | Every 1 hour check     |
| **Weekly Summary**     | Sunday 6 PM                         | Weekly                 |
| **Conversation Ready** | Streak user no Kaiwa for 2+ days    | Every 12 hours         |
| **New Content**        | Lesson released                     | ⏭️ Not yet implemented |

---

## 📞 Support

If something doesn't work:

1. Check server logs for errors
2. Verify all files were created in correct locations
3. Ensure database migration was applied
4. Review the [NOTIFICATIONS_TODO.md](./NOTIFICATIONS_TODO.md) for detailed info

---

## 🎉 Success!

Once you see the bell icon in TopBar and can click it to see notifications, the system is ready to go!

Next phase is implementing SRS algorithm and Admin features based on your priorities.

Good luck! 🚀
