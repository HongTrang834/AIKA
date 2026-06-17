import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, BookMarked, ClipboardList, LogOut, Folder, Bot, Layout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { logout } = useAuth();
  const location = useLocation();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const menuItems = [
    { path: '/admin/vocabulary', label: 'Vocabulary', icon: BookOpen },
    { path: '/admin/grammar', label: 'Grammar', icon: BookMarked },
    { path: '/admin/tests', label: 'Mini Tests', icon: ClipboardList },
    { path: '/admin/decks', label: 'Decks', icon: Folder },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-snow-white">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r-2 border-cloud-gray flex flex-col relative z-10">
        <div className="p-6">
          <h1 className="h1-feather text-almost-black mb-8 text-[32px]">AIKa Admin</h1>
          <nav className="space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 transition-all font-bold ${
                    isActive 
                      ? 'bg-sky-blue/10 border-sky-blue text-sky-blue' 
                      : 'bg-white border-transparent text-graphite hover:bg-gray-50 hover:border-cloud-gray'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[17px]">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="w-full btn-3d-red px-5 py-4 flex items-center justify-center gap-3 text-[17px] border-b-4 active:border-b-0 active:translate-y-1"
          >
            <LogOut className="w-6 h-6" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-snow-white">
        <div ref={contentRef} className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
