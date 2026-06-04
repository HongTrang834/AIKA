import React, { useState, useEffect } from 'react';
import { PlayCircle, Flame, TrendingUp, BookOpen, Compass, MessageSquare, AlarmClock, Award, Search, X, SlidersHorizontal } from 'lucide-react';
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
    <div className="p-8">
      {/* Search Bar (appears at top, always) */}
      <section className="relative mb-20">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-silver" />
          <input
            type="text"
            placeholder="Search vocabulary or grammar..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-14 pr-14 py-4 border-2 border-cloud-gray rounded-2xl focus:outline-none focus:border-sky-blue focus:bg-sky-blue/5 font-bold text-[15px] text-almost-black placeholder:text-silver transition-colors"
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
                  { id: 'all', label: 'Tất cả' },
                  { id: 'vocabulary', label: 'Từ vựng' },
                  { id: 'grammar', label: 'Ngữ pháp' }
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
                        {result.type}
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
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch min-h-[300px] mb-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 flex flex-col justify-center bg-sky-blue/10 border-4 border-dashed border-sky-blue rounded-[3rem] p-8 md:p-12 h-full"
        >
          <span className="inline-block px-4 py-2 bg-sky-blue-light text-sky-blue font-bold rounded-full text-sm uppercase tracking-widest mb-6 border-2 border-transparent w-max">
            Current Unit: {loading ? 'Loading...' : currentLesson?.unit || 'Loading'}
          </span>
          <h2 className="h1-feather text-sky-blue mb-6 leading-[1.1]">
            Ready to master
            <br />
            {loading ? 'Japanese?' : `${currentLesson?.title}?`}
          </h2>
          <p className="text-graphite text-lg leading-relaxed max-w-lg font-bold">
            {loading ? 'Loading lesson details...' : currentLesson?.description || 'Start your next lesson now.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 flex justify-center items-center h-full"
        >
          {/* Character Illustration Lottie */}
          <div className="w-full max-w-sm aspect-square bg-sky-blue/10 border-4 border-dashed border-sky-blue rounded-[3rem] flex flex-col items-center justify-center text-sky-blue p-8 text-center h-full">
            {/* @ts-ignore */}
            <dotlottie-wc
              src="https://lottie.host/3f3dc821-c71c-4e89-86e8-0e84ec318e4b/7v2ezoKhLz.lottie"
              style={{ width: '250px', height: '250px' }}
              autoplay
              loop
            ></dotlottie-wc>
          </div>
        </motion.div>
      </section>
      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-28">
        {/* Vocabulary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{ backgroundColor: '#EAF2FF' }}
        >
          <p className="font-bold text-[15px] mb-4" style={{ color: '#3B82F6' }}>Từ Vựng</p>
          <p className="font-black text-[32px] leading-none" style={{ color: '#1E3A8A' }}>
            {loading ? '...' : progress.total_vocab_learned} <span className="text-[17px] font-bold">từ</span>
          </p>
        </motion.div>

        {/* Grammar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6"
          style={{ backgroundColor: '#F6ECFF' }}
        >
          <p className="font-bold text-[15px] mb-4" style={{ color: '#9333EA' }}>Ngữ Pháp</p>
          <p className="font-black text-[32px] leading-none" style={{ color: '#581C87' }}>
            {loading ? '...' : progress.total_grammar_learned} <span className="text-[17px] font-bold">mẫu</span>
          </p>
        </motion.div>

        {/* Kaiwa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6"
          style={{ backgroundColor: '#E5F9ED' }}
        >
          <p className="font-bold text-[15px] mb-4" style={{ color: '#3B82F6' }}>Hội Thoại</p>
          <p className="font-black text-[32px] leading-none" style={{ color: '#1E3A8A' }}>
            {loading ? '...' : progress.total_kaiwas} <span className="text-[17px] font-bold">lần</span>
          </p>
        </motion.div>

        {/* Flashcards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-6"
          style={{ backgroundColor: '#FFF3E6' }}
        >
          <p className="font-bold text-[15px] mb-4" style={{ color: '#D97706' }}>Flash Card</p>
          <p className="font-black text-[32px] leading-none" style={{ color: '#78350F' }}>
            {loading ? '...' : progress.total_flashcard_reviews} <span className="text-[17px] font-bold">thẻ</span>
          </p>
        </motion.div>
      </section>

      {/* Two-Column Bottom Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-28">

        {/* Left Column: Review Center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-duo p-8 md:p-12 flex flex-col justify-between"
        >
          <div>
            <div className="w-20 h-20 bg-sky-blue/20 text-sky-blue rounded-2xl flex items-center justify-center mb-8 shadow-sm">
              <AlarmClock className="w-10 h-10" />
            </div>
            <h3 className="h2-feather text-almost-black mb-4">Review Center</h3>

            <div className="bg-sky-blue/10 border-2 border-sky-blue/20 rounded-2xl p-6 mb-8 inline-block w-max">
              <span className="font-black text-3xl text-sky-blue">{loading ? '...' : progress.total_flashcard_reviews + 24}</span>
              <span className="text-sky-blue font-bold ml-2">cards</span>
              <p className="text-sky-blue/70 font-bold text-sm mt-1">Waiting for review</p>
            </div>
          </div>

          <div className="space-y-4 mt-auto">
            <NavLink
              to="/flashcards"
              className="w-full btn-3d-blue py-4 flex items-center justify-center text-[17px]"
            >
              Start Flashcards
            </NavLink>
            <NavLink
              to="/flashcards"
              className="w-full btn-outline-gray py-4 flex items-center justify-center text-[17px] hover:bg-cloud-gray/20 border-cloud-gray border-2 rounded-xl text-graphite font-bold"
            >
              View All Decks
            </NavLink>
          </div>
        </motion.div>

        {/* Right Column: Weekly Activity & Achievement */}
        <div className="space-y-8 flex flex-col">

          {/* Weekly Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-duo p-8 md:p-12 flex-1"
          >
            <h3 className="h2-feather text-almost-black mb-8">Weekly Activity</h3>
            <div className="flex justify-between items-center px-2">
              {(() => {
                const today = new Date();
                const dates = [];
                for (let i = 6; i >= 0; i--) {
                  const date = new Date(today);
                  date.setDate(date.getDate() - i);
                  dates.push(date);
                }
                return dates.map((date, i) => {
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'narrow' });
                  const dayNum = date.getDate();
                  const isActive = (activityData[i] || 0) > 0;
                  const isToday = i === 6;

                  return (
                    <div key={i} className="flex flex-col items-center gap-3">
                      <span className="text-sm font-bold text-silver">{dayName}</span>
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center font-bold text-[17px] border-2 transition-all",
                        isToday
                          ? "bg-sky-blue/20 text-sky-blue border-sky-blue/30"
                          : isActive
                            ? "bg-sky-blue text-white border-sky-blue shadow-sm"
                            : "bg-cloud-gray text-silver border-transparent"
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
            className="card-duo p-6 md:p-8 bg-sunshine-yellow/10 border-sunshine-yellow/30 flex items-center gap-6"
          >
            <div className="w-20 h-20 flex-shrink-0 bg-white border-2 border-sunshine-yellow rounded-2xl flex items-center justify-center text-4xl shadow-sm">
              {loading ? '🏆' : nextBadge?.emoji || '🏆'}
            </div>
            <div>
              <p className="text-xs font-bold text-sunshine-yellow uppercase tracking-widest mb-1">Next Achievement</p>
              <h4 className="text-[20px] font-bold text-almost-black leading-tight mb-2">
                {loading ? 'Loading...' : `${nextBadge?.name || 'Starter'}`}
              </h4>
              <p className="text-[15px] text-sunshine-yellow font-bold">
                {loading ? 'Loading...' : `${nextBadge?.daysAway || 7} days away`}
              </p>
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
