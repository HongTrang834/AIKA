import express from 'express';
import pool from '../db.js';
import { authMiddleware } from '../auth.js';

const router = express.Router();

// GET user progress
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get or create user_progress
    const result = await pool.query(
      `SELECT 
        id,
        user_id,
        total_vocab_learned,
        total_grammar_learned,
        total_kaiwas,
        total_flashcard_reviews,
        last_activity,
        created_at
      FROM user_progress
      WHERE user_id = $1`,
      [userId]
    );

    // Query actual count of cards waiting for review
    const reviewCountResult = await pool.query(
      `SELECT COUNT(*)::int as count 
       FROM flashcards 
       WHERE user_id = $1 AND next_review_date <= CURRENT_TIMESTAMP`,
      [userId]
    );
    const cardsWaitingForReview = reviewCountResult.rows[0]?.count || 0;

    if (result.rows.length === 0) {
      // Create default progress if doesn't exist
      const createResult = await pool.query(
        `INSERT INTO user_progress (user_id, total_vocab_learned, total_grammar_learned, total_kaiwas, total_flashcard_reviews)
        VALUES ($1, 0, 0, 0, 0)
        RETURNING id, user_id, total_vocab_learned, total_grammar_learned, total_kaiwas, total_flashcard_reviews, last_activity, created_at`,
        [userId]
      );
      const progress = createResult.rows[0];
      progress.cards_waiting_for_review = cardsWaitingForReview;
      return res.json(progress);
    }

    const progress = result.rows[0];
    progress.cards_waiting_for_review = cardsWaitingForReview;
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update vocab count
router.post('/vocab-add/:count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const count = parseInt(req.params.count) || 1;

    const result = await pool.query(
      `UPDATE user_progress
      SET total_vocab_learned = total_vocab_learned + $1,
          last_activity = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING total_vocab_learned`,
      [count, userId]
    );

    if (result.rows.length === 0) {
      // Create if not exists
      await pool.query(
        `INSERT INTO user_progress (user_id, total_vocab_learned) VALUES ($1, $2)`,
        [userId, count]
      );
    }

    res.json({ success: true, total_vocab_learned: result.rows[0]?.total_vocab_learned || count });
  } catch (error) {
    console.error('Error updating vocab progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update grammar count
router.post('/grammar-add/:count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const count = parseInt(req.params.count) || 1;

    const result = await pool.query(
      `UPDATE user_progress
      SET total_grammar_learned = total_grammar_learned + $1,
          last_activity = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING total_grammar_learned`,
      [count, userId]
    );

    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_progress (user_id, total_grammar_learned) VALUES ($1, $2)`,
        [userId, count]
      );
    }

    res.json({ success: true, total_grammar_learned: result.rows[0]?.total_grammar_learned || count });
  } catch (error) {
    console.error('Error updating grammar progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update kaiwa count
router.post('/kaiwa-add/:count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const count = parseInt(req.params.count) || 1;

    const result = await pool.query(
      `UPDATE user_progress
      SET total_kaiwas = total_kaiwas + $1,
          last_activity = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING total_kaiwas`,
      [count, userId]
    );

    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_progress (user_id, total_kaiwas) VALUES ($1, $2)`,
        [userId, count]
      );
    }

    res.json({ success: true, total_kaiwas: result.rows[0]?.total_kaiwas || count });
  } catch (error) {
    console.error('Error updating kaiwa progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update flashcard reviews count
router.post('/flashcard-review/:count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const count = parseInt(req.params.count) || 1;

    const result = await pool.query(
      `UPDATE user_progress
      SET total_flashcard_reviews = total_flashcard_reviews + $1,
          last_activity = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING total_flashcard_reviews`,
      [count, userId]
    );

    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO user_progress (user_id, total_flashcard_reviews) VALUES ($1, $2)`,
        [userId, count]
      );
    }

    res.json({ success: true, total_flashcard_reviews: result.rows[0]?.total_flashcard_reviews || count });
  } catch (error) {
    console.error('Error updating flashcard reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST daily check-in - record user login/activity for the day
router.post('/daily-check-in', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get or create user_progress
    let result = await pool.query(
      'SELECT id, last_activity FROM user_progress WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create if doesn't exist
      result = await pool.query(
        `INSERT INTO user_progress (user_id, last_activity)
         VALUES ($1, CURRENT_TIMESTAMP)
         RETURNING id, last_activity`,
        [userId]
      );
    } else {
      // Update last_activity to today
      result = await pool.query(
        `UPDATE user_progress
         SET last_activity = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING id, last_activity`,
        [userId]
      );
    }

    res.json({ success: true, last_activity: result.rows[0].last_activity });
  } catch (error) {
    console.error('Error in daily check-in:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET user streak - calculate from last_activity records
router.get('/streak', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get all user activities (conversation + check-ins)
    const conversationResult = await pool.query(
      `SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC') as activity_date
       FROM conversation_history
       WHERE user_id = $1
       UNION
       SELECT DATE(last_activity AT TIME ZONE 'UTC') as activity_date
       FROM user_progress
       WHERE user_id = $1 AND last_activity IS NOT NULL
       ORDER BY activity_date DESC`,
      [userId]
    );

    if (conversationResult.rows.length === 0) {
      return res.json({
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
      });
    }

    const activityDates = conversationResult.rows.map(row => new Date(row.activity_date));
    
    // Calculate current streak (check if today or yesterday had activity)
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

    // Calculate longest streak
    let longestStreak = 1;
    let tempStreak = 1;
    
    for (let i = 1; i < activityDates.length; i++) {
      const prevDate = new Date(activityDates[i - 1]);
      const currDate = new Date(activityDates[i]);
      prevDate.setUTCHours(0, 0, 0, 0);
      currDate.setUTCHours(0, 0, 0, 0);

      const dayDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    const lastActivityDate = activityDates.length > 0 ? activityDates[0] : null;

    res.json({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: lastActivityDate,
    });
  } catch (error) {
    console.error('Error calculating streak:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET activity history for last 7 days (for Dashboard calendar)
router.get('/activity-history', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get last 7 days activity from both conversations AND daily check-ins
    const result = await pool.query(
      `SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC') as activity_date
       FROM conversation_history
       WHERE user_id = $1 
         AND created_at AT TIME ZONE 'UTC' >= CURRENT_DATE - INTERVAL '7 days'
       UNION
       SELECT DISTINCT DATE(last_activity AT TIME ZONE 'UTC') as activity_date
       FROM user_progress
       WHERE user_id = $1 
         AND last_activity IS NOT NULL
         AND last_activity AT TIME ZONE 'UTC' >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY activity_date ASC`,
      [userId]
    );

    // Build 7-day array (binary: 0 or 100)
    const activitySet = new Set();
    result.rows.forEach(row => {
      const dateStr = row.activity_date.toISOString().split('T')[0];
      activitySet.add(dateStr);
    });

    // Generate last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(dateStr);
    }

    // Convert to binary (100 = has activity, 0 = no activity)
    const activityBinary = last7Days.map(dateStr => {
      return activitySet.has(dateStr) ? 100 : 0;
    });

    res.json(activityBinary);
  } catch (error) {
    console.error('Error fetching activity history:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET current lesson for dashboard
router.get('/current-lesson', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's current lesson
    const progressResult = await pool.query(
      `SELECT last_lesson_id FROM user_progress WHERE user_id = $1`,
      [userId]
    );

    let lessonId;
    if (progressResult.rows.length === 0) {
      // Create default progress if doesn't exist
      await pool.query(
        `INSERT INTO user_progress (user_id) VALUES ($1)`,
        [userId]
      );
      // Get first lesson as default
      lessonId = null;
    } else {
      lessonId = progressResult.rows[0].last_lesson_id;
    }

    // If no lesson set, get the first lesson
    if (!lessonId) {
      const firstLessonResult = await pool.query(
        `SELECT l.id, l.unit_id, l.title, l.lesson_number, l.type, l.description,
                l.vocabulary_count, l.grammar_count, u.title as unit_title
         FROM lessons l
         JOIN units u ON l.unit_id = u.id
         ORDER BY l.unit_id, l.sequence_number
         LIMIT 1`
      );
      if (firstLessonResult.rows.length === 0) {
        return res.status(404).json({ error: 'No lessons available' });
      }
      lessonId = firstLessonResult.rows[0].id;
    }

    // Get lesson details
    const lessonResult = await pool.query(
      `SELECT l.id, l.unit_id, l.title, l.lesson_number, l.type, l.description,
              l.vocabulary_count, l.grammar_count, u.title as unit_title
       FROM lessons l
       JOIN units u ON l.unit_id = u.id
       WHERE l.id = $1`,
      [lessonId]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const lesson = lessonResult.rows[0];
    res.json({
      lesson_id: lesson.id,
      unit: lesson.unit_title,
      title: lesson.title,
      lesson_number: lesson.lesson_number,
      type: lesson.type,
      description: lesson.description,
      vocabulary_count: lesson.vocabulary_count,
      grammar_count: lesson.grammar_count,
    });
  } catch (error) {
    console.error('Error fetching current lesson:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST update current lesson
router.post('/current-lesson/:lessonId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const lessonId = parseInt(req.params.lessonId);

    // Update last_lesson_id in user_progress
    const result = await pool.query(
      `UPDATE user_progress
       SET last_lesson_id = $1, last_activity = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING last_lesson_id`,
      [lessonId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User progress not found' });
    }

    res.json({ success: true, last_lesson_id: result.rows[0].last_lesson_id });
  } catch (error) {
    console.error('Error updating current lesson:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST mark vocabulary as learned
router.post('/vocab-learned/:vocabId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const vocabId = parseInt(req.params.vocabId);
    const status = req.body.status || 1; // 0=NEW, 1=LEARNING, 2=MASTERED

    // Check if vocabulary exists
    const vocabCheck = await pool.query(
      'SELECT id FROM vocabulary WHERE id = $1',
      [vocabId]
    );
    if (vocabCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    // Insert or update user_vocabulary_learned
    const result = await pool.query(
      `INSERT INTO user_vocabulary_learned (user_id, vocabulary_id, status, review_count, last_reviewed_at, learned_at)
       VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, vocabulary_id) DO UPDATE
       SET status = $3,
           review_count = user_vocabulary_learned.review_count + 1,
           last_reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, vocabulary_id, status, review_count, learned_at`,
      [userId, vocabId, status]
    );

    // Also increment total_vocab_learned in user_progress if this is first time (status was 0)
    if (status === 1) {
      await pool.query(
        `UPDATE user_progress 
         SET total_vocab_learned = total_vocab_learned + 1,
             last_activity = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [userId]
      );
    }

    res.json({ success: true, learning: result.rows[0] });
  } catch (error) {
    console.error('Error marking vocabulary as learned:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST mark grammar as learned
router.post('/grammar-learned/:grammarId', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const grammarId = parseInt(req.params.grammarId);
    const status = req.body.status || 1; // 0=NEW, 1=LEARNING, 2=MASTERED

    // Check if grammar exists
    const grammarCheck = await pool.query(
      'SELECT id FROM grammar WHERE id = $1',
      [grammarId]
    );
    if (grammarCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Grammar not found' });
    }

    // Insert or update user_grammar_learned
    const result = await pool.query(
      `INSERT INTO user_grammar_learned (user_id, grammar_id, status, review_count, last_reviewed_at, learned_at)
       VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, grammar_id) DO UPDATE
       SET status = $3,
           review_count = user_grammar_learned.review_count + 1,
           last_reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       RETURNING id, grammar_id, status, review_count, learned_at`,
      [userId, grammarId, status]
    );

    // Also increment total_grammar_learned in user_progress if this is first time (status was 0)
    if (status === 1) {
      await pool.query(
        `UPDATE user_progress 
         SET total_grammar_learned = total_grammar_learned + 1,
             last_activity = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [userId]
      );
    }

    res.json({ success: true, learning: result.rows[0] });
  } catch (error) {
    console.error('Error marking grammar as learned:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET recently learned vocabulary + grammar
router.get('/recently-learned', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 5; // Get last 5 items

    // Query from recently_learned_items view or direct from tables
    const result = await pool.query(
      `SELECT 
        type,
        word,
        pronunciation,
        meaning,
        level,
        user_id,
        learned_at,
        status,
        review_count,
        last_reviewed_at
      FROM recently_learned_items
      WHERE user_id = $1
      ORDER BY learned_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    // Format response with proper status labels
    const formattedResult = result.rows.map(row => ({
      type: row.type,
      word: row.word,
      meaning: row.meaning,
      pronunciation: row.pronunciation || row.word,
      status: row.status === 2 ? 'MASTERED' : row.status === 1 ? 'LEARNING' : 'NEW',
      learned_at: row.learned_at,
      review_count: row.review_count || 0,
      last_reviewed_at: row.last_reviewed_at,
    }));

    res.json(formattedResult);
  } catch (error) {
    console.error('Error fetching recently learned:', error);
    
    // Fallback to sample data if view doesn't exist yet
    const sampleData = [
      {
        type: 'vocabulary',
        word: '拯める',
        meaning: 'To make progress / move smoothly',
        pronunciation: 'はかどる',
        status: 'MASTERED',
        learned_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        review_count: 8,
        last_reviewed_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        type: 'grammar',
        word: '～に至って',
        meaning: 'Grammar: Until / Arrive at a state',
        pronunciation: 'にいたって',
        status: 'REVIEW SOON',
        learned_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
        review_count: 1,
        last_reviewed_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        type: 'vocabulary',
        word: '巧妙',
        meaning: 'Ingenious / Skillful',
        pronunciation: 'こうみょう',
        status: 'MASTERED',
        learned_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
        review_count: 5,
        last_reviewed_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ];
    
    res.json(sampleData);
  }
});

// ===== TODO: VOCABULARY & GRAMMAR ENDPOINTS =====
// Những endpoint này được thêm để chuẩn bị cho tính năng học lesson
// Cần được enable khi dataset N2 được import

/**
 * TODO: GET /api/progress/lessons/:lessonId/vocabulary
 * Lấy danh sách từ vựng của một lesson
 * 
 * Response:
 * [
 *   { id: 1, word: "敬語", meaning: "honorific language", pronunciation: "けいご", level: 5 },
 *   { id: 2, word: "失礼", meaning: "rude", pronunciation: "しつれい", level: 5 }
 * ]
 */
router.get('/lessons/:lessonId/vocabulary', authMiddleware, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);

    // TODO: Kiểm tra lesson tồn tại
    // const lessonCheck = await pool.query('SELECT id FROM lessons WHERE id = $1', [lessonId]);
    // if (lessonCheck.rows.length === 0) {
    //   return res.status(404).json({ error: 'Lesson not found' });
    // }

    // TODO: Query vocabulary từ database
    // const result = await pool.query(
    //   `SELECT id, word, meaning, pronunciation, level
    //    FROM vocabulary
    //    WHERE lesson_id = $1
    //    ORDER BY id ASC`,
    //   [lessonId]
    // );

    // TODO: Nếu chưa có dữ liệu, return empty array hoặc sample data
    // res.json(result.rows);

    res.json([
      { id: 1, word: "敬語", meaning: "honorific language", pronunciation: "けいご", level: 5 },
      { id: 2, word: "失礼", meaning: "rude, disrespectful", pronunciation: "しつれい", level: 5 },
      { id: 3, word: "了解", meaning: "acknowledge, understood", pronunciation: "りょうかい", level: 4 }
    ]);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * TODO: GET /api/progress/lessons/:lessonId/grammar
 * Lấy danh sách ngữ pháp của một lesson
 * 
 * Response:
 * [
 *   { id: 1, pattern: "~いただけますか", meaning: "can you please", example: "お手数ですが...", level: 5 },
 *   { id: 2, pattern: "~してしまう", meaning: "end up doing", example: "削除してしまった", level: 5 }
 * ]
 */
router.get('/lessons/:lessonId/grammar', authMiddleware, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);

    // TODO: Kiểm tra lesson tồn tại
    // const lessonCheck = await pool.query('SELECT id FROM lessons WHERE id = $1', [lessonId]);
    // if (lessonCheck.rows.length === 0) {
    //   return res.status(404).json({ error: 'Lesson not found' });
    // }

    // TODO: Query grammar từ database
    // const result = await pool.query(
    //   `SELECT id, pattern, meaning, example, level
    //    FROM grammar
    //    WHERE lesson_id = $1
    //    ORDER BY id ASC`,
    //   [lessonId]
    // );

    // TODO: Nếu chưa có dữ liệu, return empty array hoặc sample data
    // res.json(result.rows);

    res.json([
      { id: 1, pattern: "~いただけますか", meaning: "can you please", example: "お手数ですが、確認していただけますか", level: 5 },
      { id: 2, pattern: "~してしまう", meaning: "end up doing, accidentally", example: "大事なデータを削除してしまった", level: 5 },
      { id: 3, pattern: "~べきだ", meaning: "should, ought to", example: "その仕事は今日中に終わるべきだ", level: 5 }
    ]);
  } catch (error) {
    console.error('Error fetching grammar:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
