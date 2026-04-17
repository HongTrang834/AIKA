/**
 * Notification Routes
 * Handles notification retrieval, marking as read, and management
 */

import express from 'express';
import NotificationService from '../services/notificationService.js';
import { authMiddleware } from '../auth.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Get unread notifications for current user
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = req.query.limit || 10;

    const notifications = await NotificationService.getUnreadNotifications(userId, limit);
    const unreadCount = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error(`❌ Error fetching notifications: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
});

/**
 * GET /api/notifications/count
 * Get unread notification count for current user
 */
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const count = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error(`❌ Error getting unread count: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification count',
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notificationId = req.params.id;

    const notification = await NotificationService.markAsRead(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error(`❌ Error marking notification as read: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for current user
 */
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const count = await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `Marked ${count} notifications as read`,
      markedCount: count,
    });
  } catch (error) {
    console.error(`❌ Error marking all notifications as read: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read',
    });
  }
});

/**
 * POST /api/notifications/trigger/review-due
 * Manually trigger review due check (for testing/admin)
 */
router.post('/trigger/review-due', authMiddleware, async (req, res) => {
  try {
    // TODO: Add admin check
    await NotificationService.checkReviewDueNotifications();

    res.json({
      success: true,
      message: 'Review Due notification check triggered',
    });
  } catch (error) {
    console.error(`❌ Error triggering review due check: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger review due check',
    });
  }
});

/**
 * POST /api/notifications/trigger/achievement
 * Manually trigger achievement check (for testing/admin)
 */
router.post('/trigger/achievement', authMiddleware, async (req, res) => {
  try {
    // TODO: Add admin check
    await NotificationService.checkAchievementNotifications();

    res.json({
      success: true,
      message: 'Achievement notification check triggered',
    });
  } catch (error) {
    console.error(`❌ Error triggering achievement check: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger achievement check',
    });
  }
});

/**
 * POST /api/notifications/trigger/weekly-summary
 * Manually trigger weekly summary check (for testing/admin)
 */
router.post('/trigger/weekly-summary', authMiddleware, async (req, res) => {
  try {
    // TODO: Add admin check
    await NotificationService.checkWeeklySummaryNotifications();

    res.json({
      success: true,
      message: 'Weekly Summary notification check triggered',
    });
  } catch (error) {
    console.error(`❌ Error triggering weekly summary check: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger weekly summary check',
    });
  }
});

/**
 * POST /api/notifications/trigger/conversation-ready
 * Manually trigger conversation ready check (for testing/admin)
 */
router.post('/trigger/conversation-ready', authMiddleware, async (req, res) => {
  try {
    // TODO: Add admin check
    await NotificationService.checkConversationReadyNotifications();

    res.json({
      success: true,
      message: 'Conversation Ready notification check triggered',
    });
  } catch (error) {
    console.error(`❌ Error triggering conversation ready check: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger conversation ready check',
    });
  }
});

export default router;
