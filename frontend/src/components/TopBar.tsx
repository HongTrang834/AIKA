import React, { useState } from 'react';
import { Search, Bell, Flame, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function TopBar() {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 px-8 py-4 flex justify-between items-center w-full">
      <div className="flex items-center gap-8">
        <div className="hidden lg:flex items-center bg-slate-100 px-4 py-2 rounded-full gap-3 group focus-within:ring-2 ring-primary/20 transition-all">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search lessons..." 
            className="bg-transparent border-none focus:ring-0 text-sm w-48 font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full text-primary font-bold">
          <Flame className="w-4 h-4 fill-current" />
          <span className="text-sm">12 Day Streak</span>
        </div>
        
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

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
              src={user?.avatar_url || 'https://picsum.photos/seed/user123/100/100'} 
              alt="User" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>

          {showLogout && (
            <div className="absolute right-0 top-16 bg-white shadow-lg rounded-lg p-2 z-50">
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
