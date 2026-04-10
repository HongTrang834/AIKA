import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Compass, 
  Layers, 
  TrendingUp,
  Bot,
  User
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: BookOpen, label: 'Vocab', path: '/vocab' },
  { icon: Compass, label: 'Grammar', path: '/grammar' },
  { icon: Layers, label: 'Flashcards', path: '/flashcards' },
  { icon: TrendingUp, label: 'Progress', path: '/progress' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-slate-50 border-r border-slate-200 flex flex-col py-8 rounded-r-[3rem] shadow-xl shadow-indigo-500/5 z-50">
      <div className="px-8 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-indigo-600 tracking-tight font-headline">AIKa</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">N2 Mastery Path</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 font-medium group",
              isActive 
                ? "bg-white text-primary shadow-sm font-bold" 
                : "text-slate-500 hover:text-primary hover:bg-white/50"
            )}
          >
            <item.icon className={cn("w-5 h-5", "group-hover:scale-110 transition-transform")} />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-6 mt-auto w-full">
        <NavLink
          to="/kaiwa"
          className={({ isActive }) => cn(
            "w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all",
            isActive && "ring-2 ring-primary ring-offset-2"
          )}
        >
          <Bot className="w-5 h-5" />
          AI Sensei
        </NavLink>
      </div>
    </aside>
  );
}
