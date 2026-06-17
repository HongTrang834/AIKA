import React, { useState, useEffect } from 'react';
import { PlayCircle, Flame, TrendingUp, BookOpen, Compass, MessageSquare, AlarmClock, Award, Search, X, SlidersHorizontal, Calendar, Trophy } from 'lucide-react';
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
  const [searchFilter, setSearchFilter] = useState<'all' | 'vocabulary' | 'grammar'>('all');
  const [showSearchFilters, setShowSearchFilters] = useState(false);

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
  const handleSearch = async (query: string, filterStr = searchFilter) => {
    setSearchQuery(query);

    if (!query || query.length < 1) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const results: any[] = [];

      if (filterStr === 'all' || filterStr === 'vocabulary') {
        const vocabRes = await fetch(`/api/vocabulary/search/query?q=${encodeURIComponent(query)}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (vocabRes.ok) {
          const vocabData = await vocabRes.json();
          results.push(...vocabData.results.map((v: any) => ({ ...v, type: 'vocabulary' })));
        }
      }

      if (filterStr === 'all' || filterStr === 'grammar') {
        const grammarRes = await fetch(`/api/grammar/search/query?q=${encodeURIComponent(query)}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (grammarRes.ok) {
          const grammarData = await grammarRes.json();
          results.push(...grammarData.results.map((g: any) => ({ ...g, type: 'grammar' })));
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterSelect = (filter: 'all' | 'vocabulary' | 'grammar') => {
    setSearchFilter(filter);
    setShowSearchFilters(false);
    if (searchQuery) {
      handleSearch(searchQuery, filter);
    }
  };

  const handleResultClick = (result: any) => {
    if (result.type === 'vocabulary') {
      navigate(`/learn/vocabulary/${result.id}`);
    } else if (result.type === 'grammar') {
      navigate(`/learn/grammar/${result.id}`);
    }
  };

  return (
    <div className="p-24">
      {/* Search Bar (appears at top, always) */}
      <section className="relative mb-24">
        <div className="relative">
          <Search className="absolute left-16 top-1/2 -translate-y-1/2 w-24 h-24 text-silver" />
          <input
            type="text"
            placeholder="Search vocabulary or grammar..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-48 pr-16 py-12 border-2 border-cloud-gray rounded-2xl focus:outline-none focus:border-sky-blue focus:bg-sky-blue/5 font-bold text-[15px] text-almost-black placeholder:text-silver transition-colors"
          />
          <button
            onClick={() => setShowSearchFilters(!showSearchFilters)}
            className={cn(
              "absolute right-5 top-1/2 -translate-y-1/2 rounded-xl transition-colors",
              showSearchFilters || searchFilter !== 'all' ? "text-sky-blue" : "text-silver hover:text-sky-blue"
            )}
          >
            <SlidersHorizontal className="w-6 h-6" />
          </button>

          {/* Filter Dropdown */}
          {showSearchFilters && (
            <div className="absolute right-0 top-16 w-[180px] bg-white border-2 border-cloud-gray rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-2 space-y-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'vocabulary', label: 'Vocabulary' },
                  { id: 'grammar', label: 'Grammar' }
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleFilterSelect(option.id as any)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg text-[15px] font-bold transition-colors whitespace-nowrap",
                      searchFilter === option.id
                        ? "bg-sky-blue/10 text-sky-blue"
                        : "text-graphite hover:bg-cloud-gray/30"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results Dropdown */}
          {searchQuery && (
            <div className="absolute top-[110%] left-0 right-0 z-50 bg-white rounded-2xl shadow-xl border-2 border-cloud-gray overflow-hidden">
              {isSearching ? (
                <div className="p-4 text-center text-silver font-bold">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                  {searchResults.map((result, idx) => (
                    <div
                      key={`${result.type}-${result.id}-${idx}`}
                      onClick={() => handleResultClick(result)}
                      className="px-6 py-4 hover:bg-sky-blue/5 cursor-pointer border-b-2 border-cloud-gray last:border-b-0 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-[19px] text-almost-black">
                          {result.word}
                          {result.furigana && <span className="text-silver text-[15px] ml-2 font-normal">({result.furigana})</span>}
                        </h4>
                        <p className="text-graphite font-bold">{result.meaning}</p>
                      </div>
                      <span className="px-3 py-1 bg-cloud-gray text-graphite rounded-xl text-xs font-bold uppercase tracking-wider">
                        {result.type === 'vocabulary' ? 'Vocabulary' : 'Grammar'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-silver font-bold">No results found</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch min-h-[300px] mb-24">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 flex flex-col justify-center bg-sky-blue-light/30 border-2 border-sky-blue rounded-[32px] p-32 h-full"
        >
          <h2 className="font-feather text-4xl md:text-5xl font-black tracking-heading text-sky-blue mb-16 leading-[1.15]">
            Ready to master {currentLesson?.title || 'Company Culture'}?
          </h2>
          <p className="text-graphite font-bold text-[17px] leading-relaxed">
            {currentLesson?.description || 'Understanding Japanese business values'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 flex justify-center items-center h-full"
        >
          <div className="w-full max-w-md bg-sky-blue/5 border-2 border-sky-blue/20 rounded-3xl flex flex-col items-center justify-center p-24 text-center h-full relative">
            {/* Speech bubble */}
            <div className="relative bg-white border-2 border-cloud-gray rounded-2xl p-16 mb-16 shadow-sm max-w-[280px]">
              <p className="text-almost-black text-[15px] font-bold leading-snug">
                Let's practice daily to keep up your learning streak!
              </p>
              {/* Tail pointing down */}
              <div className="absolute bottom-[-9px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-cloud-gray rotate-45"></div>
            </div>

            {/* Character Illustration Lottie */}
            {/* @ts-ignore */}
            <dotlottie-wc
              src="https://lottie.host/3f3dc821-c71c-4e89-86e8-0e84ec318e4b/7v2ezoKhLz.lottie"
              style={{ width: '180px', height: '180px' }}
              autoplay
              loop
            ></dotlottie-wc>

            {/* Streak Counter Box */}
            <div className="mt-16 flex items-center gap-3 bg-sunshine-yellow/10 border-2 border-sunshine-yellow/30 rounded-2xl px-16 py-8 shadow-sm">
              <Flame className="w-6 h-6 text-sunshine-yellow fill-sunshine-yellow animate-pulse" />
              <span className="font-feather text-[17px] font-bold text-almost-black">
                {streak.current_streak} days streak
              </span>
            </div>
          </div>
        </motion.div>
      </section>
      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 md:gap-24 mb-24">
        {/* Vocabulary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sky-blue/5 border-2 border-sky-blue/20 rounded-3xl shadow-sm flex flex-col justify-between"
          style={{ padding: '24px' }}
        >
          <p className="font-bold text-[15px] mb-4 text-sky-blue uppercase tracking-wider">Vocabulary</p>
          <p className="font-black text-[32px] leading-none text-sky-blue">
            {loading ? '...' : progress.total_vocab_learned} <span className="text-[17px] font-bold text-sky-blue/70">words</span>
          </p>
        </motion.div>

        {/* Grammar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-grape-soda/5 border-2 border-grape-soda/20 rounded-3xl shadow-sm flex flex-col justify-between"
          style={{ padding: '24px' }}
        >
          <p className="font-bold text-[15px] mb-4 text-grape-soda uppercase tracking-wider">Grammar</p>
          <p className="font-black text-[32px] leading-none text-grape-soda">
            {loading ? '...' : progress.total_grammar_learned} <span className="text-[17px] font-bold text-grape-soda/70">patterns</span>
          </p>
        </motion.div>

        {/* Kaiwa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-emerald-500/5 border-2 border-emerald-500/20 rounded-3xl shadow-sm flex flex-col justify-between"
          style={{ padding: '24px' }}
        >
          <p className="font-bold text-[15px] mb-4 text-emerald-600 uppercase tracking-wider">Conversation</p>
          <p className="font-black text-[32px] leading-none text-emerald-600">
            {loading ? '...' : progress.total_kaiwas} <span className="text-[17px] font-bold text-emerald-600/70">times</span>
          </p>
        </motion.div>

        {/* Flashcards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-orange-500/5 border-2 border-orange-500/20 rounded-3xl shadow-sm flex flex-col justify-between"
          style={{ padding: '24px' }}
        >
          <p className="font-bold text-[15px] mb-4 text-orange-600 uppercase tracking-wider">Flashcards</p>
          <p className="font-black text-[32px] leading-none text-orange-600">
            {loading ? '...' : progress.total_flashcard_reviews} <span className="text-[17px] font-bold text-orange-600/70">cards</span>
          </p>
        </motion.div>
      </section>

      {/* Two-Column Bottom Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-32 mb-32 items-start">

        {/* Left Column: Review Center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-duo rounded-3xl flex flex-col justify-between"
          style={{ padding: '24px' }}
        >
          <div>
            <div className="flex items-center gap-4 mb-24">
              <div className="w-40 h-40 bg-sky-blue/20 text-sky-blue rounded-xl flex items-center justify-center shadow-sm">
                <AlarmClock className="w-24 h-24" />
              </div>
              <h3 className="font-feather text-2xl font-bold tracking-heading text-almost-black leading-none">
                Review Center
              </h3>
            </div>

            <div className="bg-sky-blue/10 border-2 border-sky-blue/20 rounded-2xl p-16 mb-24 inline-block w-max">
              <span className="font-black text-3xl text-sky-blue">{loading ? '...' : progress.total_flashcard_reviews + 24}</span>
              <span className="text-sky-blue font-bold ml-2">cards</span>
              <p className="text-sky-blue/70 font-bold text-sm mt-1">Waiting for review</p>
            </div>
          </div>

          <div className="space-y-16 mt-auto">
            <NavLink
              to="/flashcards"
              className="w-full btn-3d-blue py-12 flex items-center justify-center text-[17px]"
            >
              Start Review
            </NavLink>
            <NavLink
              to="/flashcards"
              className="w-full btn-outline-gray py-12 flex items-center justify-center text-[17px] hover:bg-cloud-gray/20 border-cloud-gray border-2 rounded-xl text-graphite font-bold"
            >
              View All Decks
            </NavLink>
          </div>
        </motion.div>

        {/* Right Column: Weekly Activity & Achievement */}
        <div className="space-y-24 flex flex-col">

          {/* Weekly Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-duo rounded-3xl flex-shrink-0"
            style={{ padding: '24px' }}
          >
            <div className="flex items-center gap-4 mb-24">
              <div className="w-40 h-40 bg-sky-blue/20 text-sky-blue rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="w-24 h-24" />
              </div>
              <h3 className="font-feather text-2xl font-bold tracking-heading text-almost-black leading-none">
                Weekly Activity
              </h3>
            </div>

            <div className="flex justify-between items-center px-8 pb-32">
              {(() => {
                const today = new Date();
                const dates = [];
                for (let i = 6; i >= 0; i--) {
                  const date = new Date(today);
                  date.setDate(date.getDate() - i);
                  dates.push(date);
                }
                const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return dates.map((date, i) => {
                  const dayName = EN_WEEKDAYS[date.getDay()];
                  const dayNum = date.getDate();
                  const total = activityData[i] || 0;
                  const isActive = total > 0;
                  const isToday = i === 6;

                  return (
                    <div key={i} className="flex flex-col items-center gap-12">
                      <span className="text-sm font-bold text-silver">{dayName}</span>
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center font-bold text-[17px] border-2 transition-all",
                        isActive
                          ? "bg-sky-blue text-white border-sky-blue shadow-sm"
                          : isToday
                            ? "bg-white border-2 border-sky-blue text-sky-blue"
                            : "bg-cloud-gray/40 border-2 border-cloud-gray/60 text-silver"
                      )}>
                        {dayNum}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </motion.div>

          {/* Next Achievement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-duo rounded-3xl bg-sunshine-yellow/5 border-2 border-sunshine-yellow/20 flex flex-col flex-shrink-0 gap-24"
            style={{ padding: '24px' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-40 h-40 bg-sunshine-yellow/20 text-sunshine-yellow rounded-xl flex items-center justify-center shadow-sm">
                <Trophy className="w-24 h-24" />
              </div>
              <h3 className="font-feather text-2xl font-bold tracking-heading text-almost-black leading-none">
                Next Achievement
              </h3>
            </div>

            <div className="flex items-center gap-24">
              <div className="w-80 h-80 flex-shrink-0 bg-white border-2 border-sunshine-yellow rounded-2xl flex items-center justify-center text-4xl shadow-sm">
                {loading ? '🏆' : nextBadge?.emoji || '🏆'}
              </div>
              <div>
                <h4 className="text-[20px] font-bold text-almost-black leading-tight mb-8">
                  {loading ? 'Loading...' : `${nextBadge?.name || 'Starter'}`}
                </h4>
                <p className="text-[15px] text-sunshine-yellow font-bold">
                  {loading ? 'Loading...' : `${nextBadge?.daysAway || 7} days left`}
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </section>
    </div>
  );
}

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
