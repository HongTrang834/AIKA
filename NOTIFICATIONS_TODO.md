# Notification System - TODO & Data Requirements

## ✅ IMPLEMENTED & READY TO USE

### 1. Review Due Notification

- **Status**: ⚠️ PARTIALLY IMPLEMENTED
- **What's Done**:
  - Backend logic to check `last_reviewed_at < today`
  - Counts vocab + grammar items pending review
  - Creates notification with count
  - Cron job triggers every 6 hours
- **What's Missing**:
  - ❌ SRS Algorithm for optimal review scheduling
  - ❌ `review_interval` field in `user_vocabulary_learned` table
  - ❌ Dynamic review schedules (Anki-style spacing)
- **TODO**:
  ```
  [ ] Add review_interval field to user_vocabulary_learned & user_grammar_learned tables
  [ ] Implement SRS algorithm (exponential backoff)
  [ ] Add last_review_count to track review attempts
  [ ] Adjust checkReviewDueNotifications() to use SRS scheduling
  ```
- **Database Fields Needed**:
  ```sql
  ALTER TABLE user_vocabulary_learned ADD COLUMN review_interval INTEGER DEFAULT 1; -- days
  ALTER TABLE user_vocabulary_learned ADD COLUMN review_count INTEGER DEFAULT 0;
  ALTER TABLE user_vocabulary_learned ADD COLUMN next_review_date TIMESTAMP;
  ```

### 2. Achievement Unlocked

- **Status**: ✅ FULLY IMPLEMENTED & READY
- **What's Done**:
  - Milestone tracking: 7/14/30/100 day streaks
  - `achievement_milestones` table created
  - Notification created on unlock
  - Cron job triggers every hour
  - Badge names assigned (Samurai/Warrior/Legend/Immortal)
- **Testing**:
  ```bash
  # Manually trigger achievement check
  curl -X POST http://localhost:3000/api/notifications/trigger/achievement \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
- **No Extra Work**: Just running the app will auto-detect milestone achievements!

### 3. New Content Available

- **Status**: ❌ NOT YET IMPLEMENTED - NEEDS DATABASE CHANGES
- **What's Needed**:
  - ❌ Add `released_at` field to lessons table
  - ❌ Track which lessons user has seen
  - ❌ Admin endpoint to mark lesson as released
- **TODO**:
  ```
  [ ] Add released_at field to lessons table
  [ ] Create lessons_released_tracking table (user_id, lesson_id, seen_at)
  [ ] Implement checkNewContentNotifications() logic
  [ ] Create admin endpoint: POST /api/admin/lessons/:id/release
  [ ] Add cron job for new content notifications (24-hour check)
  ```
- **Migration Needed**:

  ```sql
  ALTER TABLE lessons ADD COLUMN released_at TIMESTAMP DEFAULT NULL;
  ALTER TABLE lessons ADD COLUMN is_released BOOLEAN DEFAULT FALSE;

  CREATE TABLE lessons_released_tracking (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    lesson_id INTEGER NOT NULL REFERENCES lessons(id),
    seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id)
  );
  ```

### 4. Weekly Progress Summary

- **Status**: ✅ FULLY IMPLEMENTED & READY
- **What's Done**:
  - Calculates vocab + grammar learned in last 7 days
  - Creates notification with summary stats
  - Cron job triggers every Sunday at 6 PM
- **Testing**:
  ```bash
  # Manually trigger weekly summary check
  curl -X POST http://localhost:3000/api/notifications/trigger/weekly-summary \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
- **No Extra Work**: Just running the app will auto-create weekly summaries!

### 5. Conversation Ready

- **Status**: ✅ FULLY IMPLEMENTED & READY
- **What's Done**:
  - Checks users with streak but no conversation in 2+ days
  - Prevents duplicate notifications (24-hour cooldown)
  - Cron job triggers every 12 hours
  - Encourages Kaiwa Hub practice
- **Testing**:
  ```bash
  # Manually trigger conversation ready check
  curl -X POST http://localhost:3000/api/notifications/trigger/conversation-ready \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
- **No Extra Work**: Just running the app will auto-remind users!

### 6. Daily Reminder (NOT IN CURRENT SCOPE)

- **Status**: ❌ NOT IMPLEMENTED YET
- **Description**: Morning reminder at 8-9 AM to maintain daily check-in streak
- **TODO**:
  ```
  [ ] Create checkDailyReminderNotifications() method
  [ ] Add cron job for 8 AM daily (or user-configured time)
  [ ] Track user timezone for proper scheduling
  [ ] Add user preference for notification time
  ```

---

## 📋 BACKEND INTEGRATION CHECKLIST

### Step 1: Apply Database Migration

```bash
# Apply notifications table migration
psql -U postgres -d aika_db -f database/migration_notifications.sql
```

### Step 2: Install node-cron (if not already installed)

```bash
npm install node-cron
```

### Step 3: Update server.js to Initialize Cron Jobs

```javascript
import NotificationService from "./services/notificationService.js";

// In server initialization (after database connection)
NotificationService.initializeCronJobs();
console.log("✅ Notification cron jobs started");
```

### Step 4: Add Notification Routes to server.js

```javascript
import notificationRoutes from "./routes/notifications.js";

// In Express app setup
app.use("/api/notifications", notificationRoutes);
```

### Step 5: Test Endpoints

```bash
# Get unread notifications
curl http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get unread count
curl http://localhost:3000/api/notifications/count \
  -H "Authorization: Bearer YOUR_TOKEN"

# Mark as read
curl -X PUT http://localhost:3000/api/notifications/1/read \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test notification triggers
curl -X POST http://localhost:3000/api/notifications/trigger/achievement \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 FRONTEND INTEGRATION CHECKLIST

### Step 1: Add NotificationPanel to TopBar

```typescript
// In TopBar.tsx, add:
import NotificationPanel from './NotificationPanel';

// In JSX:
<NotificationPanel />
```

### Step 2: Test in Browser

- Click bell icon to open notification panel
- Verify unread count badge shows
- Click notification to mark as read
- Verify notifications close on outside click

### Step 3: Style Adjustments (if needed)

- Check notification colors match your design
- Adjust panel width/height if needed
- Test on mobile responsiveness

---

## 🚨 CRITICAL: Admin Panel TODO

- ❌ Add "Notifications" section to Admin Dashboard
- ❌ Show all notifications sent (filtered by type, user, date)
- ❌ Manually create notifications for specific users
- ❌ Release new lesson feature (triggers New Content notification)
- ❌ View notification delivery statistics

---

## 📊 MONITORING & LOGGING

### Things to Monitor:

1. Cron job execution frequency - check server logs
2. Notification creation rate - query database
3. Unread notification percentage - user engagement metric
4. Notification click-through rate - track navigation events

### Query for Monitoring:

```sql
-- Notifications sent today
SELECT type, COUNT(*) as count
FROM notifications
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY type;

-- Unread notification distribution
SELECT user_id, COUNT(*) as unread_count
FROM notifications
WHERE is_read = FALSE
GROUP BY user_id
ORDER BY unread_count DESC;

-- Notification engagement (read rate)
SELECT
  type,
  COUNT(*) as total,
  COUNT(CASE WHEN is_read = TRUE THEN 1 END) as read_count,
  ROUND(100 * COUNT(CASE WHEN is_read = TRUE THEN 1 END) / COUNT(*), 2) as read_rate
FROM notifications
GROUP BY type;
```

---

## 🎯 PRIORITY IMPLEMENTATION ORDER

### Phase 1 (DONE) ✅

- [x] Create database tables (notifications, achievement_milestones)
- [x] Implement NotificationService with logic
- [x] Create API routes
- [x] Create React components

### Phase 2 (READY TO START IMMEDIATELY)

- [ ] Apply database migration
- [ ] Update server.js with routes + cron
- [ ] Add NotificationPanel to TopBar
- [ ] Test all endpoints
- [ ] Deploy and monitor

### Phase 3 (NEXT MILESTONE - Requires DB Changes)

- [ ] Add SRS algorithm for Review Due notifications
- [ ] Implement New Content Available notifications
- [ ] Create Admin Panel for notification management
- [ ] Add Daily Reminder notifications
- [ ] User preferences for notification times/types

### Phase 4 (ENHANCEMENT)

- [ ] Push notifications (web push API)
- [ ] Email notifications
- [ ] SMS notifications (optional)
- [ ] Notification history/archive
- [ ] Analytics dashboard

---

## 🔍 QUICK VALIDATION CHECKLIST

Before deploying:

```
[ ] Database migration applied successfully
[ ] Server runs without errors
[ ] Cron jobs initialized (check console logs)
[ ] Notification routes registered
[ ] NotificationPanel renders in TopBar
[ ] Can fetch notifications from API
[ ] Unread count badge appears
[ ] Can mark notification as read
[ ] Notification dropdown closes on click outside
[ ] Achievement notifications created when streak reaches 7/14/30/100
[ ] Weekly summary created on Sunday 6 PM
[ ] Conversation ready notifications sent (12-hour intervals)
```

---

## 📝 FILES CREATED

1. **Database**: `/database/migration_notifications.sql`
   - Notifications table
   - Achievement milestones table
   - Indexes and triggers

2. **Backend**:
   - `/backend/services/notificationService.js` - Core logic + cron jobs
   - `/backend/routes/notifications.js` - API endpoints

3. **Frontend**:
   - `/frontend/src/hooks/useNotifications.ts` - React hook for notifications
   - `/frontend/src/components/NotificationPanel.tsx` - Notification UI component

4. **Documentation**: This file (`NOTIFICATIONS_TODO.md`)

---

## ❓ QUESTIONS FOR USER

Before proceeding:

1. **Review Due Notifications**:
   - Should review intervals be Anki-style (exponential) or fixed (e.g., every 3 days)?
   - Should completed items (MASTERED status) still appear in review due?

2. **New Content**:
   - How should lessons be "released"? Manual admin action or scheduled?
   - Should all users get notified or only those in the correct N2 level?

3. **Daily Reminder**:
   - Should this be implemented (Daily check-in reminder)?
   - What time should it trigger? (Default: 8 AM user timezone)

4. **User Preferences**:
   - Should users be able to toggle notification types on/off?
   - Should notify time be configurable per user?

---

## 🎉 YOU'RE READY TO GO!

Almost everything is set up. Just need to:

1. Apply the database migration
2. Update server.js (3 lines of code)
3. Add NotificationPanel to TopBar (1 line of code)
4. Test!

After that, you can enhance with SRS algorithm and admin features based on your priorities.

Good luck! 🚀
