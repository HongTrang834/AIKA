import React, { useState, useEffect, useRef } from 'react';
import { Flame, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export function TopBar() {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setShowLogout(false);
  }, [location]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowLogout(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="sticky top-0 z-40 bg-transparent px-8 py-4 flex justify-between items-center w-full">
      <div className="flex items-center gap-8">
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-[#ffc700]/20 px-4 py-2 rounded-xl text-[#ff9600] font-bold hover:bg-[#ffc700]/30 transition-colors cursor-default border-2 border-transparent">
          <Flame className="w-5 h-5 fill-current animate-pulse" />
          <span className="text-[15px]">
            {loading ? 'Loading...' : `${streak} Day Streak`}
          </span>
        </div>

        <div className="flex items-center gap-3 pl-4 relative" ref={menuRef}>
          <div className="text-right hidden sm:block">
            <p className="text-[15px] font-bold text-sky-blue tracking-tight">{user?.full_name || user?.username}</p>
            <p className="text-[13px] text-silver font-medium">{user?.email}</p>
          </div>

          <button
            onClick={() => setShowLogout(!showLogout)}
            className="w-14 h-14 p-0 m-0 rounded-2xl border-2 border-cloud-gray shadow-sm overflow-hidden bg-white hover:ring-4 ring-sky-blue-light transition-all flex items-center justify-center"
          >
            <img
              key={avatarUrl}
              src={avatarUrl}
              alt="User"
              className="w-full h-full object-cover min-w-full min-h-full"
              referrerPolicy="no-referrer"
            />
          </button>

          {showLogout && (
            <div className="absolute right-0 top-[68px] bg-white shadow-lg border-2 border-cloud-gray rounded-2xl p-3 z-50 min-w-[220px] whitespace-nowrap origin-top-right animate-in fade-in zoom-in-95 duration-200">
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-3 text-almost-black hover:bg-gray-50 rounded-xl w-full transition-colors font-bold text-[15px]"
                onClick={() => setShowLogout(false)}
              >
                <User className="w-5 h-5 text-sky-blue" />
                <span>Profile</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  setShowLogout(false);
                }}
                className="flex items-center gap-3 px-4 py-3 text-bubblegum-pink hover:bg-pink-50 rounded-xl w-full transition-colors font-bold text-[15px] mt-1"
              >
                <LogOut className="w-5 h-5 text-bubblegum-pink" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
