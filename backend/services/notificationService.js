/**
 * Notification Service
 * Handles creation, retrieval, and management of user notifications
 * Manages all notification types: Review Due, Achievement, New Content, Weekly Summary, Conversation Ready
 */

import pool from '../db.js';
import cron from 'node-cron';

class NotificationService {
  /**
   * Create a notification for a user
   * @param {Object} notification - { userId, type, title, message, action_url, action_type, related_id }
   */
  static async createNotification(notification) {
    const { user_id, type, title, message, action_url, action_type, related_id } = notification;

    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, action_url, action_type, related_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [user_id, type, title, message, action_url, action_type, related_id]
      );

      console.log(`✅ Notification created: ${type} for user ${user_id}`);
      return result.rows[0];
    } catch (error) {
      console.error(`❌ Error creating notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get unread notifications for a user
   */
  static async getUnreadNotifications(userId, limit = 10) {
    try {
      const result = await pool.query(
        `SELECT * FROM notifications
         WHERE user_id = $1 AND is_read = FALSE
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error(`❌ Error fetching unread notifications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId) {
    try {
      const result = await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *`,
        [notificationId]
      );

      return result.rows[0];
    } catch (error) {
      console.error(`❌ Error marking notification as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId) {
    try {
      const result = await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );

      return result.rowCount;
    } catch (error) {
      console.error(`❌ Error marking all notifications as read: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
      );

      return result.rows[0].count;
    } catch (error) {
      console.error(`❌ Error getting unread count: ${error.message}`);
      throw error;
    }
  }

  // ==================== NOTIFICATION TRIGGERS ====================

  /**
   * Check for Review Due items and create notifications
   * TODO: Needs SRS algorithm - currently only checks if last_reviewed_at < today
   * TODO: Add review_interval field to user_vocabulary_learned table
   */
  static async checkReviewDueNotifications() {
    try {
      console.log('🔔 Checking for Review Due notifications...');

      // Get all users with items due for review
      const result = await pool.query(
        `SELECT DISTINCT u.id, u.user_id,
         COUNT(CASE WHEN vl.status != 2 THEN 1 END) as vocab_count,
         COUNT(CASE WHEN gl.status != 2 THEN 1 END) as grammar_count
         FROM users u
         LEFT JOIN user_vocabulary_learned vl ON u.id = vl.user_id 
           AND vl.status IN (0, 1) AND vl.last_reviewed_at < CURRENT_DATE
         LEFT JOIN user_grammar_learned gl ON u.id = gl.user_id 
           AND gl.status IN (0, 1) AND gl.last_reviewed_at < CURRENT_DATE
         WHERE (vl.id IS NOT NULL OR gl.id IS NOT NULL)
         GROUP BY u.id, u.user_id`
      );

      for (const row of result.rows) {
        const totalDue = parseInt(row.vocab_count) + parseInt(row.grammar_count);
        
        if (totalDue > 0) {
          await this.createNotification({
            user_id: row.id,
            type: 'review_due',
            title: `${totalDue} items ready to review`,
            message: `${row.vocab_count} vocabulary + ${row.grammar_count} grammar patterns are ready for review!`,
            action_url: '/flashcards',
            action_type: 'navigate_to_page',
          });
        }
      }

      console.log(`✅ Review Due check completed`);
    } catch (error) {
      console.error(`❌ Error checking Review Due notifications: ${error.message}`);
    }
  }

  /**
   * Check for achievement milestones (7/14/30/100 day streaks)
   */
  static async checkAchievementNotifications() {
    try {
      console.log('🔔 Checking for Achievement notifications...');

      // Get all users
      const usersResult = await pool.query('SELECT id FROM users');

      for (const user of usersResult.rows) {
        try {
          // Calculate streak for this user (same logic as /streak endpoint)
          const conversationResult = await pool.query(
            `SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC') as activity_date
             FROM conversation_history
             WHERE user_id = $1
             UNION
             SELECT DATE(last_activity AT TIME ZONE 'UTC') as activity_date
             FROM user_progress
             WHERE user_id = $1 AND last_activity IS NOT NULL
             ORDER BY activity_date DESC`,
            [user.id]
          );

          if (conversationResult.rows.length === 0) {
            continue; // No activity, skip
          }

          const activityDates = conversationResult.rows.map(row => new Date(row.activity_date));
          
          // Calculate current streak
          let currentStreak = 0;
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
          let checkDate = new Date(today);
          
          for (const actDate of activityDates) {
            const normalizedActDate = new Date(actDate);
            normalizedActDate.setUTCHours(0, 0, 0, 0);

            if (normalizedActDate.getTime() === checkDate.getTime()) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else if (normalizedActDate.getTime() < checkDate.getTime()) {
              break;
            }
          }

          // Check milestones
          const milestones = ['streak_7', 'streak_14', 'streak_30', 'streak_100'];
          const streakValues = { streak_7: 7, streak_14: 14, streak_30: 30, streak_100: 100 };

          for (const milestone of milestones) {
            const requiredStreak = streakValues[milestone];
            
            if (currentStreak === requiredStreak) {
              // Check if milestone already unlocked
              const existingCheck = await pool.query(
                `SELECT id FROM achievement_milestones 
                 WHERE user_id = $1 AND milestone_type = $2`,
                [user.id, milestone]
              );

              if (existingCheck.rows.length === 0) {
                // Record milestone
                await pool.query(
                  `INSERT INTO achievement_milestones (user_id, milestone_type) 
                   VALUES ($1, $2)`,
                  [user.id, milestone]
                );

                // Create notification
                const badgeName = this._getBadgeName(milestone);
                await this.createNotification({
                  user_id: user.id,
                  type: 'achievement',
                  title: `🏆 ${badgeName} Badge Unlocked!`,
                  message: `Congratulations! You reached a ${requiredStreak}-day streak!`,
                  action_url: '/dashboard',
                  action_type: 'show_badge',
                  related_id: requiredStreak,
                });

                console.log(`✅ Achievement unlocked: ${milestone} for user ${user.id}`);
              }
            }
          }
        } catch (userError) {
          console.warn(`⚠️ Error checking achievements for user ${user.id}:`, userError.message);
          // Continue with next user
        }
      }

      console.log(`✅ Achievement check completed`);
    } catch (error) {
      console.error(`❌ Error checking Achievement notifications: ${error.message}`);
    }
  }

  /**
   * TODO: Check for new content available
   * Requires: released_at field in lessons table or separate new_lessons tracking
   * Current status: Cannot implement until lessons table is updated
   */
  static async checkNewContentNotifications() {
    try {
      console.log('🔔 Checking for New Content notifications...');
      
      // TODO: Implement when lessons have released_at field
      // Get all lessons released in last 24 hours
      // For each user, check if they haven't seen it
      // Create notification

      console.log('⏭️  New Content check skipped - needs lessons.released_at field');
    } catch (error) {
      console.error(`❌ Error checking New Content notifications: ${error.message}`);
    }
  }

  /**
   * Create weekly progress summary notifications
   */
  static async checkWeeklySummaryNotifications() {
    try {
      console.log('🔔 Checking for Weekly Summary notifications...');

      // Get all users with activity in last week
      const result = await pool.query(
        `SELECT u.id, u.user_id,
         COUNT(DISTINCT CASE WHEN vl.created_at > NOW() - INTERVAL '7 days' THEN vl.vocabulary_id END) as vocab_learned,
         COUNT(DISTINCT CASE WHEN gl.created_at > NOW() - INTERVAL '7 days' THEN gl.grammar_id END) as grammar_learned,
         MAX(CASE WHEN vl.created_at > NOW() - INTERVAL '30 days' THEN vl.created_at ELSE NULL END) as vocab_max_day,
         MAX(CASE WHEN gl.created_at > NOW() - INTERVAL '30 days' THEN gl.created_at ELSE NULL END) as grammar_max_day
         FROM users u
         LEFT JOIN user_vocabulary_learned vl ON u.id = vl.user_id
         LEFT JOIN user_grammar_learned gl ON u.id = gl.user_id
         WHERE u.is_active = TRUE
         GROUP BY u.id, u.user_id
         HAVING COUNT(vl.vocabulary_id) > 0 OR COUNT(gl.grammar_id) > 0`
      );

      for (const user of result.rows) {
        const totalLearned = parseInt(user.vocab_learned) + parseInt(user.grammar_learned);

        if (totalLearned > 0) {
          await this.createNotification({
            user_id: user.id,
            type: 'weekly_summary',
            title: `📊 Your Weekly Progress`,
            message: `This week you learned ${user.vocab_learned} vocabulary + ${user.grammar_learned} grammar patterns! Keep it up! 🚀`,
            action_url: '/dashboard',
            action_type: 'navigate_to_page',
          });
        }
      }

      console.log(`✅ Weekly Summary check completed`);
    } catch (error) {
      console.error(`❌ Error checking Weekly Summary notifications: ${error.message}`);
    }
  }

  /**
   * Check for conversation readiness
   * Trigger when user has streak/recent activity but hasn't used Kaiwa in 2+ days
   */
  static async checkConversationReadyNotifications() {
    try {
      console.log('🔔 Checking for Conversation Ready notifications...');

      // Get users who are active but haven't had conversation in 2+ days
      const result = await pool.query(
        `SELECT u.id, u.user_id, MAX(ch.created_at) as last_conversation
         FROM users u
         LEFT JOIN conversation_history ch ON u.id = ch.user_id
         WHERE u.is_active = TRUE AND u.streak_count > 0
         GROUP BY u.id, u.user_id
         HAVING MAX(ch.created_at) IS NULL OR MAX(ch.created_at) < NOW() - INTERVAL '2 days'
         LIMIT 100`
      );

      for (const user of result.rows) {
        // Check if already notified in last 24 hours
        const recentNotif = await pool.query(
          `SELECT id FROM notifications 
           WHERE user_id = $1 AND type = 'conversation_ready' 
           AND created_at > NOW() - INTERVAL '24 hours'`,
          [user.id]
        );

        if (recentNotif.rows.length === 0) {
          await this.createNotification({
            user_id: user.id,
            type: 'conversation_ready',
            title: `🗣️ Ready for Conversation Practice?`,
            message: `You've been doing great with your studies! Time to practice your speaking skills?`,
            action_url: '/kaiwa-hub',
            action_type: 'navigate_to_page',
          });
        }
      }

      console.log(`✅ Conversation Ready check completed`);
    } catch (error) {
      console.error(`❌ Error checking Conversation Ready notifications: ${error.message}`);
    }
  }

  // ==================== CRON JOBS ====================

  /**
   * Initialize all notification cron jobs
   */
  static initializeCronJobs() {
    console.log('⏰ Initializing notification cron jobs...');

    // Review Due: Check every 6 hours
    cron.schedule('0 */6 * * *', () => {
      this.checkReviewDueNotifications();
    });

    // Achievement Check: Check every hour
    cron.schedule('0 * * * *', () => {
      this.checkAchievementNotifications();
    });

    // Weekly Summary: Every Sunday at 6 PM
    cron.schedule('0 18 * * 0', () => {
      this.checkWeeklySummaryNotifications();
    });

    // Conversation Ready: Check every 12 hours
    cron.schedule('0 */12 * * *', () => {
      this.checkConversationReadyNotifications();
    });

    // New Content: Check every 24 hours (disabled until schema updated)
    // cron.schedule('0 9 * * *', () => {
    //   this.checkNewContentNotifications();
    // });

    console.log('✅ Notification cron jobs initialized');
  }

  /**
   * Helper: Get badge name from milestone type
   */
  static _getBadgeName(milestone) {
    const badges = {
      streak_7: '🥋 Samurai',
      streak_14: '⚔️ Warrior',
      streak_30: '🗡️ Legend',
      streak_100: '👑 Immortal',
    };
    return badges[milestone] || 'Achievement';
  }
}

export default NotificationService;
