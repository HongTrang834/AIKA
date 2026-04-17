import React, { useState, useEffect } from 'react';
import { PlayCircle, Flame, TrendingUp, BookOpen, Compass, MessageSquare, AlarmClock, Award, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

interface ProgressData {
  total_vocab_learned: number;
  total_grammar_learned: number;
  total_kaiwas: number;
  total_flashcard_reviews: number;
}

interface CurrentLesson {
  lesson_id: number;
  unit: string;
  title: string;
  lesson_number: number;
  type: string;
  description: string;
  vocabulary_count: number;
  grammar_count: number;
}

interface RecentlyLearned {
  id: number;
  type: 'vocabulary' | 'grammar';
  word: string;
  furigana?: string;
  meaning: string;
  pronunciation?: string;
  status: 'NEW' | 'LEARNING' | 'MASTERED' | 'REVIEW SOON';
  learned_at: string;
  review_count: number;
  last_reviewed_at: string;
}

const BADGES = [
  { threshold: 7, name: 'Starter', emoji: '🌱' },
  { threshold: 14, name: 'The Samurai', emoji: '⚔️' },
  { threshold: 30, name: 'Legend', emoji: '👑' },
  { threshold: 100, name: 'Immortal', emoji: '🔥' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData>({ current_streak: 0, longest_streak: 0, last_activity_date: null });
  const [progress, setProgress] = useState<ProgressData>({ total_vocab_learned: 0, total_grammar_learned: 0, total_kaiwas: 0, total_flashcard_reviews: 0 });
  const [currentLesson, setCurrentLesson] = useState<CurrentLesson | null>(null);
  const [activityData, setActivityData] = useState<number[]>([]);
  const [nextBadge, setNextBadge] = useState<any>(null);
  const [recentlyLearned, setRecentlyLearned] = useState<RecentlyLearned[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const navigate = useNavigate();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch streak data
        const streakRes = await fetch('/api/progress/streak', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (streakRes.ok) {
          const streakData = await streakRes.json();
          setStreak(streakData);

          // Calculate next badge
          const nextBadgeInfo = BADGES.find(b => b.threshold > streakData.current_streak);
          if (nextBadgeInfo) {
            const daysUntilBadge = nextBadgeInfo.threshold - streakData.current_streak;
            setNextBadge({
              name: nextBadgeInfo.name,
              emoji: nextBadgeInfo.emoji,
              daysAway: daysUntilBadge,
              progress: (streakData.current_streak / nextBadgeInfo.threshold) * 100,
            });
          }
        }

        // Fetch progress data
        const progressRes = await fetch('/api/progress', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setProgress(progressData);
        }

        // Fetch real activity data for last 7 days
        const activityRes = await fetch('/api/progress/activity-history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivityData(activityData);
        } else {
          // Fallback to empty activity if fetch fails
          setActivityData([0, 0, 0, 0, 0, 0, 0]);
        }

        // Fetch current lesson
        const lessonRes = await fetch('/api/progress/current-lesson', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (lessonRes.ok) {
          const lessonData = await lessonRes.json();
          setCurrentLesson(lessonData);
        }

        // Fetch recently learned items
        const recentlyLearnedRes = await fetch('/api/progress/recently-learned?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (recentlyLearnedRes.ok) {
          const recentlyLearnedData = await recentlyLearnedRes.json();
          setRecentlyLearned(recentlyLearnedData);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Search handler
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query || query.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const results: any[] = [];

      // Search vocabulary
      const vocabRes = await fetch(`/api/vocabulary/search/query?q=${encodeURIComponent(query)}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('🔍 Vocab search:', { query, status: vocabRes.status, ok: vocabRes.ok });
      if (vocabRes.ok) {
        const vocabData = await vocabRes.json();
        console.log('✅ Vocab results:', vocabData.results?.length);
        results.push(...vocabData.results.map((v: any) => ({ ...v, type: 'vocabulary' })));
      } else {
        console.warn('❌ Vocab search failed:', vocabRes.status, await vocabRes.text());
      }

      // Search grammar
      const grammarRes = await fetch(`/api/grammar/search/query?q=${encodeURIComponent(query)}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('🔍 Grammar search:', { query, status: grammarRes.status, ok: grammarRes.ok });
      if (grammarRes.ok) {
        const grammarData = await grammarRes.json();
        console.log('✅ Grammar results:', grammarData.results?.length);
        results.push(...grammarData.results.map((g: any) => ({ ...g, type: 'grammar' })));
      } else {
        console.warn('❌ Grammar search failed:', grammarRes.status, await grammarRes.text());
      }

      console.log('📊 Total results:', results.length);
      setSearchResults(results);
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  // Handle search result click - navigate to the item
  const handleResultClick = (result: any) => {
    if (result.type === 'vocabulary') {
      navigate(`/learn/vocabulary/${result.id}`);
    } else if (result.type === 'grammar') {
      navigate(`/learn/grammar/${result.id}`);
    }
  };
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Search Section */}
      {searchQuery && (
        <section className="relative">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Search Results for "{searchQuery}"</h3>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSearching ? (
              <div className="text-center py-8">
                <p className="text-slate-500">Searching...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No results found</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {searchResults.map((result, idx) => (
                  <motion.div
                    key={`${result.type}-${result.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleResultClick(result)}
                    className={`p-4 rounded-xl border-l-4 ${
                      result.type === 'vocabulary'
                        ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                        : 'border-purple-500 bg-purple-50 hover:bg-purple-100'
                    } transition-colors cursor-pointer`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-white/50">
                            {result.type === 'vocabulary' ? 'VOCAB' : 'GRAMMAR'}
                          </span>
                          {result.type === 'vocabulary' ? (
                            <>
                              <p className="text-xl font-bold text-slate-900">{result.word}</p>
                              {result.reading && <p className="text-sm text-slate-600">{result.reading}</p>}
                            </>
                          ) : (
                            <p className="text-lg font-bold text-slate-900">{result.pattern}</p>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 mt-1">
                          {result.type === 'vocabulary' ? result.meaning : result.explanation || result.meaning}
                        </p>
                        {result.example_sentence && (
                          <p className="text-xs text-slate-600 mt-2 italic">例: {result.example_sentence}</p>
                        )}
                      </div>
                      {result.level && (
                        <span className="ml-4 px-3 py-1 bg-white rounded-full text-sm font-semibold text-slate-700">
                          Level {result.level}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Search Bar (appears at top, always) */}
      <section className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vocabulary or grammar..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 placeholder-slate-400"
          />
        </div>
      </section>

      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 relative overflow-hidden bg-gradient-to-br from-primary to-primary-container p-10 rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl shadow-primary/20 min-h-[360px]"
        >
          <div className="relative z-10 max-w-md">
            <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-white/10">
              Current Unit: {loading ? 'Loading...' : currentLesson?.unit || 'Loading'}
            </span>
            <h2 className="text-4xl font-extrabold font-headline mb-4 leading-tight">
              Ready to master
              <br/>
              {loading ? 'Japanese?' : `${currentLesson?.title}?`}
            </h2>
            <p className="text-white/80 mb-8 text-lg leading-relaxed">
              {loading ? 'Loading lesson details...' : currentLesson?.description || 'Start your next lesson now.'}
            </p>
            <NavLink 
              to={currentLesson ? `/learn/lesson/${currentLesson.lesson_id}` : '/'}
              className="bg-white text-primary px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl inline-block"
            >
              Resume Learning
              <PlayCircle className="w-6 h-6" />
            </NavLink>
          </div>
          
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden md:block">
            <div className="w-48 h-48 bg-white/10 rounded-3xl rotate-12 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <span className="text-8xl font-black text-white/40 kanji-display">敬</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-col justify-between border border-slate-100"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Daily Streak</p>
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-5xl font-black text-slate-900"
              >
                {loading ? '...' : streak.current_streak}
              </motion.h3>
              <p className="text-xs text-slate-400 mt-1">
                {loading ? 'Loading' : `Longest: ${streak.longest_streak} days`}
              </p>
            </div>
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-14 h-14 bg-tertiary/10 rounded-2xl flex items-center justify-center text-tertiary shadow-lg shadow-tertiary/5"
            >
              <Flame className="w-8 h-8 fill-current" />
            </motion.div>
          </div>
          
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity This Week</p>
            <div className="grid grid-cols-7 gap-2">
              {(() => {
                const today = new Date();
                const dates = [];
                for (let i = 6; i >= 0; i--) {
                  const date = new Date(today);
                  date.setDate(date.getDate() - i);
                  dates.push(date);
                }
                return dates.map((date, i) => {
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const isActive = (activityData[i] || 0) > 0;
                  
                  return (
                    <motion.div
                      key={`${dayName}-${dayNum}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`${
                        isActive ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-400'
                      } rounded-lg p-2 flex flex-col items-center justify-center h-16 cursor-pointer hover:ring-2 hover:ring-secondary transition-all group font-semibold`}
                      title={isActive ? `${dayName}, ${dayNum}: Active` : `${dayName}, ${dayNum}: No activity`}
                    >
                      <span className="text-[9px]">{dayName}</span>
                      <span className="text-sm">{dayNum}</span>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </div>

          {nextBadge && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-indigo-50/50 rounded-xl border border-indigo-100"
            >
              <p className="text-sm text-slate-600 italic mb-2">
                🎯 {nextBadge.daysAway} {nextBadge.daysAway === 1 ? 'day' : 'days'} away from "{nextBadge.name}" badge! {nextBadge.emoji}
              </p>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${nextBadge.progress}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500"
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-extrabold font-headline text-slate-900 tracking-tight">N2 Mastery Overview</h3>
          <button className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
            View detailed report <TrendingUp className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              label: 'Vocab', 
              value: `${progress.total_vocab_learned} learned`, 
              target: 2500,
              progress: Math.min((progress.total_vocab_learned / 2500) * 100, 100), 
              color: 'primary', 
              icon: BookOpen 
            },
            { 
              label: 'Grammar', 
              value: `${progress.total_grammar_learned} patterns`, 
              target: 200,
              progress: Math.min((progress.total_grammar_learned / 200) * 100, 100), 
              color: 'secondary', 
              icon: Compass 
            },
            { 
              label: 'Kaiwa', 
              value: `${progress.total_kaiwas} sessions`, 
              target: 365,
              progress: Math.min((progress.total_kaiwas / 365) * 100, 100), 
              color: 'tertiary', 
              icon: MessageSquare 
            },
          ].map((stat) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 flex items-center gap-6 border border-slate-100 hover:shadow-2xl transition-all"
            >
              <div className="relative flex-shrink-0">
                <svg className="w-24 h-24">
                  <circle className="text-slate-100" cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" />
                  <motion.circle 
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * stat.progress) / 100 }}
                    transition={{ duration: 1 }}
                    className={cn(
                      stat.color === 'primary' && "text-primary",
                      stat.color === 'secondary' && "text-secondary",
                      stat.color === 'tertiary' && "text-tertiary"
                    )}
                    cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" 
                    strokeDasharray="251.2" strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-slate-900">
                  {loading ? '...' : Math.round(stat.progress)}%
                </div>
              </div>
              <div>
                <div className={cn(
                  "w-10 h-10 mb-2 rounded-full flex items-center justify-center",
                  stat.color === 'primary' && "bg-primary/10 text-primary",
                  stat.color === 'secondary' && "bg-secondary/10 text-secondary",
                  stat.color === 'tertiary' && "bg-tertiary/10 text-tertiary"
                )}>
                  <stat.icon className="w-5 h-5 fill-current" />
                </div>
                <h4 className="font-black text-xl mb-1">{stat.label}</h4>
                <p className="text-sm text-slate-500 font-medium">{loading ? 'Loading...' : stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">Goal: {stat.target}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom Section - Recently Learned + Review Center */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-2xl font-extrabold font-headline text-slate-900 tracking-tight">Recently Learned</h3>
          
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : recentlyLearned.length > 0 ? (
              recentlyLearned.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-100/50 border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all flex items-center gap-6 justify-between"
                >
                  {/* Left: Character/Kanji */}
                  <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-primary/10 to-primary-container/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <span className="text-4xl font-black text-primary kanji-display">
                      {item.word.charAt(0)}
                    </span>
                  </div>

                  {/* Center: Content */}
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-900 mb-1">
                      {item.word}
                      <span className="text-sm text-slate-400 font-normal ml-2">
                        ({item.furigana || item.pronunciation})
                      </span>
                    </h4>
                    <p className="text-slate-600 text-sm mb-2">{item.meaning}</p>
                    <p className="text-xs text-slate-400">
                      {item.type === 'vocabulary' ? '📚 Vocabulary' : '📝 Grammar Pattern'} • Reviewed {item.review_count}x
                    </p>
                  </div>

                  {/* Right: Status & Time */}
                  <div className="flex flex-col items-end gap-3">
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                        item.status === 'MASTERED'
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'REVIEW SOON'
                          ? 'bg-amber-100 text-amber-700'
                          : item.status === 'LEARNING'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status}
                    </motion.span>
                    <p className="text-xs text-slate-400 text-right">
                      {new Date(item.learned_at).toLocaleDateString() === new Date().toLocaleDateString()
                        ? `${new Date(item.learned_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ago`
                        : new Date(item.learned_at).toLocaleDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString()
                        ? 'Yesterday'
                        : new Date(item.learned_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-slate-500">No learned vocabulary yet. Start learning to see your progress!</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-extrabold font-headline text-slate-900 tracking-tight">Review Center</h3>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100"
          >
            <div className="w-16 h-16 bg-tertiary text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-tertiary/20">
              <AlarmClock className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-black mb-2 text-slate-900">SRS Critical Review</h4>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              You have <span className="font-bold text-tertiary">{loading ? '...' : progress.total_flashcard_reviews + 24}</span> cards waiting for review. Tackle them now to maintain your memory strength.
            </p>
            <div className="space-y-4">
              <NavLink 
                to="/flashcards"
                className="w-full bg-tertiary text-white py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all inline-block text-center"
              >
                Start Flashcards
              </NavLink>
              <NavLink 
                to="/flashcards"
                className="w-full bg-slate-50 text-slate-900 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all inline-block text-center"
              >
                View All Deck
              </NavLink>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-secondary/5 to-secondary-container/10 p-6 rounded-2xl border border-secondary/10 flex items-center gap-4"
          >
            <div className="w-12 h-12 flex-shrink-0 bg-white rounded-full flex items-center justify-center text-secondary shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Next Achievement</p>
              <p className="text-sm font-bold text-slate-900">{loading ? 'Loading...' : `${nextBadge?.emoji} ${nextBadge?.name || 'Starter'}`}</p>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${loading ? 0 : (nextBadge?.progress || 0)}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-secondary rounded-full" 
                />
              </div>
              <p className="text-xs text-secondary font-semibold mt-1">{loading ? 'Loading...' : `${streak.current_streak} / ${BADGES.find(b => b.threshold > streak.current_streak)?.threshold || 365} days`}</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
