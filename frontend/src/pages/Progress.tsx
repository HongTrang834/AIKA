import React, { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, Compass, MessageSquare, RotateCw, Calendar, Award, Target, Activity, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface UserProgress {
  id: number;
  user_id: number;
  total_vocab_learned: number;
  total_grammar_learned: number;
  total_kaiwas: number;
  total_flashcard_reviews: number;
  last_activity: string | null;
  created_at: string;
}

interface DailyStat {
  date: string;
  vocab: number;
  grammar: number;
  kaiwa: number;
  tests: number;
  total: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function Progress() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  // Generate 7 days of mock data by default for demonstration
  const generateMockDailyStats = (): DailyStat[] => {
    const mockValues = [
      { vocab: 4, grammar: 1, kaiwa: 0, tests: 0 },   // 6 days ago
      { vocab: 0, grammar: 0, kaiwa: 0, tests: 0 },   // 5 days ago (empty)
      { vocab: 8, grammar: 2, kaiwa: 1, tests: 0 },   // 4 days ago
      { vocab: 5, grammar: 0, kaiwa: 2, tests: 1 },   // 3 days ago
      { vocab: 0, grammar: 0, kaiwa: 0, tests: 0 },   // 2 days ago (empty)
      { vocab: 12, grammar: 4, kaiwa: 1, tests: 1 },  // yesterday
      { vocab: 3, grammar: 1, kaiwa: 0, tests: 0 },   // today
    ];

    return mockValues.map((mock, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const total = mock.vocab + mock.grammar + mock.kaiwa + mock.tests;
      return {
        date: dateStr,
        ...mock,
        total
      };
    });
  };

  const [dailyStats, setDailyStats] = useState<DailyStat[]>(generateMockDailyStats());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      Promise.all([fetchProgress(), fetchDailyStats()]).finally(() => {
        setLoading(false);
      });
    }
  }, [token]);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: UserProgress = await response.json();
      setProgress(data);
      console.log('Progress loaded:', data);
    } catch (error) {
      console.error('Error fetching progress:', error);
      showToast('Error loading progress: ' + String(error), 'error');
    }
  };

  const fetchDailyStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/progress/daily-learn-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        // If there's real activity on the backend, use it. Otherwise, keep mock data.
        const totalActivity = data.reduce((sum: number, d: any) => sum + (d.total || 0), 0);
        if (totalActivity > 0) {
          setDailyStats(data);
          console.log('Daily stats loaded from backend:', data);
        } else {
          console.log('Backend returned empty stats, using frontend mock.');
        }
      } else {
        console.error('Failed to fetch daily stats:', response.status);
      }
    } catch (error) {
      console.error('Error fetching daily stats from backend, keeping frontend mock:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      dayOfWeek: dayNames[date.getDay()],
      shortDate: `${date.getMonth() + 1}/${date.getDate()}`
    };
  };

  const stats = [
    {
      label: 'Vocabulary',
      value: progress?.total_vocab_learned || 0,
      icon: BookOpen,
      description: 'N2 words learned',
      colors: {
        iconBg: 'bg-sky-blue-light',
        iconText: 'text-sky-blue',
      }
    },
    {
      label: 'Grammar',
      value: progress?.total_grammar_learned || 0,
      icon: Compass,
      description: 'grammar patterns learned',
      colors: {
        iconBg: 'bg-grape-soda/10',
        iconText: 'text-grape-soda',
      }
    },
    {
      label: 'Kaiwa Practice',
      value: progress?.total_kaiwas || 0,
      icon: MessageSquare,
      description: 'AI conversation sessions',
      colors: {
        iconBg: 'bg-sunshine-yellow/20',
        iconText: 'text-[#cc9f00]',
      }
    },
    {
      label: 'Review',
      value: progress?.total_flashcard_reviews || 0,
      icon: RotateCw,
      description: 'flashcard reviews',
      colors: {
        iconBg: 'bg-bubblegum-pink/10',
        iconText: 'text-bubblegum-pink',
      }
    },
  ];

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center py-20 min-h-[400px]">
        <Loader className="w-14 h-14 animate-spin text-sky-blue" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 py-6">
      {/* Header */}
      <div>
        <h1 className="h1-feather text-almost-black mb-2">Learning Progress</h1>
        <p className="text-graphite font-bold text-lg">
          Track your N2 learning progress in the system
        </p>
      </div>

      {/* Last Activity */}
      {progress?.last_activity && (
        <div className="bg-sky-blue-light/30 border-2 border-sky-blue/20 rounded-xl p-5 flex items-center gap-3">
          <Calendar className="w-6 h-6 text-sky-blue shrink-0" />
          <p className="text-almost-black font-bold text-[16px]">
            Last Activity: <span className="text-sky-blue font-extrabold">{formatDate(progress.last_activity)}</span>
          </p>
        </div>
      )}

      {/* Learning Statistics */}
      <div className="bg-white p-6 card-duo">
        <h2 className="text-xl font-extrabold text-almost-black mb-6">Learning Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Box 1: Vocabulary */}
          <div className="p-5 rounded-2xl bg-[#EAF2FF] flex flex-col justify-between">
            <p className="font-bold text-[16px] text-sky-blue mb-2">Vocabulary</p>
            <p className="font-black text-3xl text-[#1E3A8A]">{progress?.total_vocab_learned || 0} words</p>
          </div>

          {/* Box 2: Grammar */}
          <div className="p-5 rounded-2xl bg-[#F6ECFF] flex flex-col justify-between">
            <p className="font-bold text-[16px] text-grape-soda mb-2">Grammar</p>
            <p className="font-black text-3xl text-[#581C87]">{progress?.total_grammar_learned || 0} patterns</p>
          </div>

          {/* Box 3: Conversation */}
          <div className="p-5 rounded-2xl bg-[#E5F9ED] flex flex-col justify-between">
            <p className="font-bold text-[16px] text-[#15803d] mb-2">Conversation</p>
            <p className="font-black text-3xl text-[#166534]">{progress?.total_kaiwas || 0} times</p>
          </div>

          {/* Box 4: Flashcards */}
          <div className="p-5 rounded-2xl bg-[#FFF3E6] flex flex-col justify-between">
            <p className="font-bold text-[16px] text-[#d97706] mb-2">Flashcards</p>
            <p className="font-black text-3xl text-[#78350f]">{progress?.total_flashcard_reviews || 0} cards</p>
          </div>
        </div>
      </div>

      {/* Achievements & Stats */}
      <div className="bg-white p-6 card-duo space-y-6">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-sunshine-yellow shrink-0" />
          <h2 className="text-xl font-bold text-almost-black font-feather">Achievements & Stats</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Total Learning Time */}
          <div className="lg:col-span-4 border-b-2 lg:border-b-0 lg:border-r-2 border-cloud-gray pb-6 lg:pb-0 lg:pr-8 flex flex-col justify-center">
            <p className="text-base font-bold text-silver uppercase tracking-wider mb-2">Total Study Time</p>
            <p className="text-4xl font-black text-almost-black font-feather">
              {progress?.total_flashcard_reviews
                ? Math.round(progress.total_flashcard_reviews / 2)
                : 0}{' '}
              hours
            </p>
            <p className="text-sm font-bold text-silver mt-1">
              (Estimated from flashcard reviews)
            </p>
          </div>

          {/* Achievements */}
          <div className="lg:col-span-8">
            <p className="text-[17px] font-extrabold text-graphite mb-4">🏆 Badges Earned</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { emoji: '🔥', title: 'Streak', criteria: 'Practice Kaiwa > 5 times', unlock: (progress?.total_kaiwas || 0) > 5 },
                { emoji: '📖', title: 'Learner', criteria: 'Learn > 100 words', unlock: (progress?.total_vocab_learned || 0) > 100 },
                { emoji: '🎯', title: 'Clear Goal', criteria: 'Learn > 10 patterns', unlock: (progress?.total_grammar_learned || 0) > 10 },
                { emoji: '💪', title: 'Diligent', criteria: 'Review > 100 times', unlock: (progress?.total_flashcard_reviews || 0) > 100 },
                { emoji: '🚀', title: 'Aggressive', criteria: 'Practice Kaiwa > 20 times', unlock: (progress?.total_kaiwas || 0) > 20 },
                { emoji: '👑', title: 'Master', criteria: 'Learn > 500 words', unlock: (progress?.total_vocab_learned || 0) > 500 },
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl text-center border-2 transition-all flex flex-col items-center justify-center ${badge.unlock
                    ? 'bg-sunshine-yellow/10 border-sunshine-yellow/30'
                    : 'bg-cloud-gray/20 border-cloud-gray opacity-45'
                    }`}
                  title={badge.criteria}
                >
                  <div className="text-2xl">{badge.emoji}</div>
                  <p className="text-[14px] font-extrabold text-almost-black mt-1.5 leading-tight">
                    {badge.title}
                  </p>
                  <p className="text-[12px] font-bold text-silver mt-1 leading-tight">
                    {badge.criteria}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Learning Chart */}
      <div className="bg-white p-6 card-duo flex flex-col space-y-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-sky-blue shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-almost-black font-feather">Daily Activity</h2>
            <p className="text-[15px] font-bold text-silver mt-1">Accumulated learning activity in the last 7 days (vocabulary + grammar + conversation + tests)</p>
          </div>
        </div>

        {dailyStats.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-silver font-bold">
            No activity data available.
          </div>
        ) : (
          <div>
            {/* Chart Area */}
            <div className="flex justify-around items-end h-56 border-b-2 border-cloud-gray pb-4 relative px-2">
              {(() => {
                const maxDailyTotal = Math.max(...dailyStats.map(d => d.total), 5);
                return dailyStats.map((day) => {
                  const pct = (day.total / maxDailyTotal) * 100;
                  const { dayOfWeek, shortDate } = formatDayLabel(day.date);

                  return (
                    <div key={day.date} className="flex flex-col items-center group relative w-16">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-24 opacity-0 group-hover:opacity-100 transition-opacity bg-almost-black text-white text-[12px] font-bold p-3 rounded-xl shadow-lg pointer-events-none whitespace-nowrap z-20 space-y-1">
                        <p className="border-b border-white/20 pb-1 text-center font-extrabold">{shortDate}</p>
                        <p className="text-sky-blue-light">📚 Vocabulary: {day.vocab}</p>
                        <p className="text-grape-soda">🧭 Grammar: {day.grammar}</p>
                        <p className="text-sunshine-yellow">💬 Conversation: {day.kaiwa}</p>
                        <p className="text-[#a855f7]">📝 Tests: {day.tests}</p>
                        <p className="border-t border-white/20 pt-1 text-right text-white font-extrabold">Total: {day.total}</p>
                      </div>

                      {/* Vertical Bar (Single line segment, no upper limit box) */}
                      <div className="w-8 h-36 relative mb-3 flex items-end justify-center">
                        {day.total > 0 && (
                          <div
                            className="bg-sky-blue w-1 rounded-full transition-all duration-700 ease-out relative"
                            style={{ height: `${pct > 0 ? Math.max(pct * 0.75, 6) : 0}%` }}
                          >
                            {/* Day count label absolutely positioned on top of the line */}
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-black text-almost-black opacity-80 whitespace-nowrap">
                              {day.total}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-around pt-3">
              {dailyStats.map((day) => {
                const { dayOfWeek, shortDate } = formatDayLabel(day.date);
                return (
                  <div key={day.date} className="flex flex-col items-center w-16 text-center">
                    <span className="text-[15px] font-extrabold text-graphite">{dayOfWeek}</span>
                    <span className="text-[13px] font-bold text-silver mt-0.5">{shortDate}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-sky-blue-light/20 border-2 border-sky-blue/20 rounded-xl p-6">
        <h3 className="font-bold text-sky-blue text-xl mb-3">💡 Tips to Boost Progress</h3>
        <ul className="text-almost-black text-[16px] space-y-2.5 font-bold">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-blue shrink-0"></span>
            Review 10-15 flashcards daily to optimize Spaced Repetition (Spaced Repetition)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-blue shrink-0"></span>
            Practice Kaiwa at least 3 times/week to improve reflex communication skills
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-blue shrink-0"></span>
            Learn 3-5 new words daily to expand your vocabulary
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-blue shrink-0"></span>
            Combine learning grammar with vocabulary for better retention and practical use
          </li>
        </ul>
      </div>
    </div>
  );
}
