import React from 'react';
import { motion } from 'motion/react';
import { Send, Mic, MoreHorizontal, Lightbulb, TrendingUp } from 'lucide-react';

export default function KaiwaHub() {
  return (
    <div className="flex-1 p-8 grid grid-cols-12 gap-8 max-w-7xl mx-auto w-full h-[calc(100vh-80px)]">
      {/* Left Panel: Chat Interface */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        {/* Mode Toggles */}
        <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl w-fit">
          <button className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 bg-white text-primary shadow-sm">
            Free Chat
          </button>
          <button className="px-6 py-2.5 rounded-xl font-medium text-sm text-slate-500 hover:text-primary transition-all duration-300">
            Scenario-based
          </button>
        </div>

        {/* Chat Canvas */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden shadow-2xl shadow-primary/5">
          {/* Chat Header */}
          <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-container p-0.5">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    <img 
                      src="https://picsum.photos/seed/sensei-chan/100/100" 
                      alt="Sensei" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight text-slate-900">Sensei-chan</h3>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">N2 Advanced Guide</p>
              </div>
            </div>
            <button className="text-slate-400 hover:text-primary transition-colors">
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Sensei Message */}
            <div className="flex gap-4 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                <img src="https://picsum.photos/seed/sensei-chan/50/50" alt="S" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="bg-slate-50 rounded-3xl rounded-tl-none px-6 py-4 shadow-sm">
                <p className="text-slate-800 leading-relaxed">
                  こんにちは！今日はどんなことについて話しましょうか？<br/>
                  <span className="text-slate-400 text-sm mt-2 block italic">Hello! What should we talk about today?</span>
                </p>
              </div>
            </div>

            {/* User Message with Correction */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-4 max-w-[85%] flex-row-reverse">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">ME</div>
                <div className="bg-primary text-white rounded-3xl rounded-tr-none px-6 py-4 shadow-lg shadow-primary/10">
                  <p className="leading-relaxed">
                    最近、日本の文化に<span className="bg-red-500/30 rounded px-1 underline decoration-2 underline-offset-4">興味があるです</span>。特に歴史とか。
                  </p>
                </div>
              </div>
              
              {/* AI Feedback Box */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mr-12 max-w-[70%] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-tertiary mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-tertiary uppercase tracking-wider mb-1">N2 Insight</p>
                    <p className="text-sm text-slate-500">
                      Instead of <span className="text-red-500 font-medium">興味があるです</span>, use <span className="text-secondary font-bold">興味があります</span> or <span className="text-secondary font-bold">興味があるんです</span> for a more natural N2-level flow.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sensei Response */}
            <div className="flex gap-4 max-w-[85%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                <img src="https://picsum.photos/seed/sensei-chan/50/50" alt="S" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="bg-slate-50 rounded-3xl rounded-tl-none px-6 py-4 shadow-sm">
                <p className="text-slate-800 leading-relaxed">
                  歴史ですね！素晴らしい。特に江戸時代について<span className="text-secondary font-bold">造詣が深い</span>人が多いですが、興味のある時代はありますか？
                </p>
                <div className="mt-3">
                  <span className="px-2 py-1 bg-secondary/10 text-secondary text-[10px] font-bold rounded-lg uppercase">
                    Vocabulary: 造詣が深い (Zōkei ga fukai)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-8 border-t border-slate-50 bg-white">
            <div className="relative flex items-center gap-4">
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="Type your Japanese response..." 
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 pr-16 focus:ring-2 focus:ring-primary/20 text-slate-900 placeholder:text-slate-400"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                  <Send className="w-6 h-6" />
                </button>
              </div>
              <button className="relative w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/30 group">
                <Mic className="w-8 h-8" />
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Scenario Details */}
      <div className="col-span-12 lg:col-span-4 space-y-8">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Scenario</p>
              <h4 className="font-bold text-lg text-slate-900">Japanese History Seminar</h4>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Objective</p>
              <p className="text-sm text-slate-700">Discuss your interests in a formal seminar setting using N2 grammar.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">Key Grammar</p>
              <ul className="text-sm space-y-2 mt-2 text-slate-700">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>～に際して (On the occasion of)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>～のみならず (Not only...)</span>
                </li>
              </ul>
            </div>
          </div>
          
          <button className="w-full mt-8 py-4 border-2 border-primary text-primary rounded-2xl font-bold hover:bg-primary/5 transition-colors">
            Change Scenario
          </button>
        </div>

        <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
          <h4 className="font-bold text-primary mb-4">Session Stats</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <p className="text-2xl font-black text-primary">12</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Vocab Used</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <p className="text-2xl font-black text-secondary">92%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
