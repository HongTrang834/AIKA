import React from 'react';
import { PlayCircle, Flame, TrendingUp, BookOpen, Compass, MessageSquare, AlarmClock, Award } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 relative overflow-hidden bg-gradient-to-br from-primary to-primary-container p-10 rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl shadow-primary/20 min-h-[360px]"
        >
          <div className="relative z-10 max-w-md">
            <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-white/10">
              Current Unit: Business Ethics
            </span>
            <h2 className="text-4xl font-extrabold font-headline mb-4 leading-tight">
              Ready to master <br/>Keigo Honorifics?
            </h2>
            <p className="text-white/80 mb-8 text-lg leading-relaxed">
              Lesson 4.2 focuses on formal humble forms used in corporate presentations.
            </p>
            <button className="bg-white text-primary px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl">
              Resume Learning
              <PlayCircle className="w-6 h-6" />
            </button>
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
              <h3 className="text-3xl font-black text-slate-900">12 Days</h3>
            </div>
            <div className="w-14 h-14 bg-tertiary/10 rounded-2xl flex items-center justify-center text-tertiary shadow-lg shadow-tertiary/5">
              <Flame className="w-8 h-8 fill-current" />
            </div>
          </div>
          
          <div className="flex justify-between items-end gap-2 mt-8 h-32">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-3">
                <div className="w-full bg-slate-50 rounded-t-xl relative overflow-hidden flex-1">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${[40, 70, 100, 85, 0, 0][i]}%` }}
                    className="absolute bottom-0 w-full bg-secondary rounded-t-lg"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{day}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500 italic">2 days away from "The Samurai" badge!</p>
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
            { label: 'Vocab', value: '1,240 / 6,000', progress: 76, color: 'primary', icon: BookOpen },
            { label: 'Grammar', value: '88 / 200 items', progress: 44, color: 'secondary', icon: Compass },
            { label: 'Kaiwa', value: '18.5 hrs logged', progress: 92, color: 'tertiary', icon: MessageSquare },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 flex items-center gap-6 border border-slate-100">
              <div className="relative flex-shrink-0">
                <svg className="w-24 h-24">
                  <circle className="text-slate-100" cx="48" cy="48" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" />
                  <motion.circle 
                    initial={{ strokeDashoffset: 251.2 }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * stat.progress) / 100 }}
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
                <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-slate-900">{stat.progress}%</div>
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
                <p className="text-sm text-slate-500 font-medium">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-2xl font-extrabold font-headline text-slate-900 tracking-tight">Recently Learned</h3>
          <div className="space-y-4">
            {[
              { kanji: '捗', word: '捗る (はかどる)', meaning: 'To make progress / move smoothly', status: 'Mastered', time: '2 hours ago' },
              { kanji: '至', word: '～に至って (にいたって)', meaning: 'Grammar: Until / Arrive at a state', status: 'Review Soon', time: 'Yesterday' },
              { kanji: '巧', word: '巧妙 (こうみょう)', meaning: 'Ingenious / Skillful', status: 'Mastered', time: 'Yesterday' },
            ].map((item) => (
              <div key={item.word} className="bg-white p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-all group cursor-pointer border border-slate-100">
                <div className="flex items-center gap-6">
                  <div className="text-4xl font-black text-primary kanji-display w-16 h-16 bg-primary/5 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                    {item.kanji}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-900">{item.word}</h4>
                    <p className="text-sm text-slate-500">{item.meaning}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter",
                    item.status === 'Mastered' ? "bg-secondary/10 text-secondary" : "bg-tertiary/10 text-tertiary"
                  )}>
                    {item.status}
                  </span>
                  <span className="text-xs text-slate-400">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-extrabold font-headline text-slate-900 tracking-tight">Review Center</h3>
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="w-16 h-16 bg-tertiary text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-tertiary/20">
              <AlarmClock className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-black mb-2 text-slate-900">SRS Critical Review</h4>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              You have <span className="font-bold text-tertiary">24 cards</span> waiting for review. Tackle them now to maintain your memory strength.
            </p>
            <div className="space-y-4">
              <button className="w-full bg-tertiary text-white py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all">
                Start Flashcards
              </button>
              <button className="w-full bg-slate-50 text-slate-900 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all">
                View All Deck
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-secondary/5 to-secondary-container/10 p-6 rounded-2xl border border-secondary/10 flex items-center gap-4">
            <div className="w-12 h-12 flex-shrink-0 bg-white rounded-full flex items-center justify-center text-secondary shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Next Achievement</p>
              <p className="text-sm font-bold text-slate-900">50 Kanji in a Day</p>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2">
                <div className="w-4/5 h-full bg-secondary rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
