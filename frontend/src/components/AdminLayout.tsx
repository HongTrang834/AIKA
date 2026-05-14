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

  const menuItems = [
    { path: '/admin/vocabulary', label: 'Từ Vựng', icon: BookOpen },
    { path: '/admin/grammar', label: 'Ngữ Pháp', icon: BookMarked },
    { path: '/admin/tests', label: 'Tests Mini', icon: ClipboardList },
    { path: '/admin/decks', label: 'Decks', icon: Folder },
    { path: '/kaiwa', label: 'AI Chat', icon: Bot },
    { path: '/', label: 'Quay lại App', icon: Layout },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <h1 className="text-3xl font-bold mb-8">AIKa Admin</h1>
        <nav className="space-y-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600' : 'hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
