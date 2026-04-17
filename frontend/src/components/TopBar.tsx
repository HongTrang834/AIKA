import React, { useState, useEffect } from 'react';
import { Flame, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export function TopBar() {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch streak data
  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // First: Record daily check-in (login activity)
        console.log('📝 Recording daily check-in...');
        const checkInResponse = await fetch('/api/progress/daily-check-in', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!checkInResponse.ok) {
          console.warn('❌ Check-in failed:', checkInResponse.statusText);
        } else {
          console.log('✅ Daily check-in recorded');
        }

        // Second: Fetch streak data
        console.log('📊 Fetching streak...');
        const streakResponse = await fetch('/api/progress/streak', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (streakResponse.ok) {
          const data = await streakResponse.json();
          console.log('✅ Streak data:', data);
          setStreak(data.current_streak || 0);
        } else {
          console.error('❌ Streak fetch failed:', streakResponse.statusText);
          setStreak(0);
        }
      } catch (error) {
        console.error('❌ Error in streak fetch:', error);
        setStreak(0);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStreakData();
    }
  }, [user]);

  // Watch for avatar changes and update local state to force re-render
  useEffect(() => {
    const newAvatarUrl = user?.avatar_url || `https://picsum.photos/seed/${user?.username || 'user'}/100/100`;
    setAvatarUrl(newAvatarUrl);
    console.log('TopBar avatar updated:', newAvatarUrl ? newAvatarUrl.substring(0, 50) + '...' : 'null');
  }, [user?.avatar_url, user?.username]);

  return (
    <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 px-8 py-4 flex justify-between items-center w-full">
      <div className="flex items-center gap-8">
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full text-primary font-bold hover:bg-indigo-100 transition-colors cursor-default">
          <Flame className="w-4 h-4 fill-current animate-pulse" />
          <span className="text-sm">
            {loading ? 'Loading...' : `${streak} Day${streak !== 1 ? 's' : ''} Streak`}
          </span>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 relative">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-primary tracking-tight">{user?.full_name || user?.username}</p>
            <p className="text-[10px] text-slate-500 font-medium">{user?.email}</p>
          </div>
          
          <button
            onClick={() => setShowLogout(!showLogout)}
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-200 hover:ring-2 ring-indigo-300 transition-all"
          >
            <img 
              key={avatarUrl}
              src={avatarUrl} 
              alt="User" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>

          {showLogout && (
            <div className="absolute right-0 top-16 bg-white shadow-lg rounded-lg p-2 z-50">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg w-full transition-colors"
                onClick={() => setShowLogout(false)}
              >
                <User className="w-4 h-4" />
                <span>Hồ Sơ Cá Nhân</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  setShowLogout(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
