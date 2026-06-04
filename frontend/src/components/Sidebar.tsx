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
    <aside className="fixed left-0 top-0 h-screen w-72 bg-snow-white border-r-2 border-cloud-gray flex flex-col py-8 z-50">
      <div className="px-8 mb-10">
        <div className="flex items-center gap-2">
          {/* @ts-ignore */}
          <dotlottie-wc
            src="https://lottie.host/9a9472ef-1df0-434f-afdc-11ec34966890/IfbINdkg8R.lottie"
            style={{ width: '100px', height: '100px' }}
            autoplay
            loop
          ></dotlottie-wc>
          <h1 className="text-3xl font-feather font-bold text-sky-blue tracking-tight">AIKa</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 font-extrabold text-[15px] tracking-wide uppercase group border-2 border-transparent",
              isActive
                ? "bg-sky-blue/10 text-sky-blue"
                : "text-graphite hover:bg-gray-100"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-7 h-7", isActive ? "text-sky-blue" : "text-silver", "group-hover:scale-110 transition-transform")} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 mt-auto w-full">
        <NavLink
          to="/kaiwa"
          className={({ isActive }) => cn(
            "w-full btn-3d-blue py-3 flex items-center justify-center gap-3 text-[17px] relative overflow-hidden",
            isActive && "active:translate-y-1 active:border-b-0 active:mt-1"
          )}
        >
          {/* @ts-ignore */}
          <dotlottie-wc
            src="https://lottie.host/4153b2ba-cc99-4ea8-b02d-f9bd29cc1f24/gM5iDH7gP0.lottie"
            style={{ width: '40px', height: '40px' }}
            autoplay
            loop
          ></dotlottie-wc>
          AI Sensei
        </NavLink>
      </div>
    </aside>
  );
}
