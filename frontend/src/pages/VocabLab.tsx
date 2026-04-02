import React, { useState, useEffect } from 'react';
import { WordCard } from '@/src/components/WordCard';
import { Building2, Cpu, ArrowRight, FileQuestion, TrendingUp, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function VocabLab() {
  const { token } = useAuth();
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVocabulary = async () => {
      try {
        const data = await api.getVocabulary(20, 0);
        setVocabulary(data.rows || []);
      } catch (error) {
        console.error('Error fetching vocabulary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVocabulary();
  }, []);

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto flex gap-10">
      <div className="flex-1 space-y-12">
        {/* All Vocabulary */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-headline text-2xl font-extrabold tracking-tight">Vocabulary List</h2>
                <p className="text-slate-500 text-sm">Total Words • {vocabulary.length} Words</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vocabulary.map((vocab) => (
              <WordCard 
                key={vocab.id}
                kanji={vocab.word} 
                reading={vocab.reading} 
                meaning={vocab.vietnamese_meaning} 
                status="New" 
              />
            ))}
          </div>
        </section>
      </div>

      {/* Side Panel */}
      <aside className="w-96 space-y-6">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full" />
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-tertiary/10 p-2 rounded-xl text-tertiary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-headline font-bold text-lg">Daily Vocab Quiz</h3>
          </div>

          <div className="mb-10 text-center py-8 bg-slate-50 rounded-3xl">
            <div className="text-slate-400 text-[10px] mb-2 tracking-widest uppercase font-bold">Select Meaning</div>
            <div className="text-5xl font-headline font-bold text-primary mb-1">効率</div>
            <div className="text-slate-400 text-sm">こうりつ</div>
          </div>

          <div className="space-y-3">
            {[
              { id: 'A', text: 'Public institution' },
              { id: 'B', text: 'Efficiency, Utility', active: true },
              { id: 'C', text: 'Social standing' },
              { id: 'D', text: 'Reasonable price' },
            ].map((opt) => (
              <button 
                key={opt.id}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all group flex items-center justify-between",
                  opt.active 
                    ? "border-primary bg-primary/5" 
                    : "border-slate-100 hover:border-primary hover:bg-primary/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    opt.active ? "bg-primary text-white" : "bg-slate-100 group-hover:bg-primary group-hover:text-white"
                  )}>
                    {opt.id}
                  </span>
                  <span className={cn("font-medium", opt.active ? "text-primary font-bold" : "text-slate-600")}>
                    {opt.text}
                  </span>
                </div>
                {opt.active && <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>}
              </button>
            ))}
          </div>

          <button className="w-full mt-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors">
            Next Question
          </button>
        </div>

        <div className="bg-slate-50 rounded-[2.5rem] p-8">
          <h4 className="font-headline font-bold mb-6 text-xs uppercase tracking-wider text-slate-400">Cluster Progress</h4>
          <div className="space-y-6">
            {[
              { label: 'BUSINESS', progress: 82, color: 'secondary' },
              { label: 'ACADEMIC', progress: 45, color: 'tertiary' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-[10px] font-bold mb-2">
                  <span className="text-slate-500">{item.label}</span>
                  <span className={cn(item.color === 'secondary' ? "text-secondary" : "text-tertiary")}>
                    {item.progress}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    className={cn("h-full rounded-full", item.color === 'secondary' ? "bg-secondary" : "bg-tertiary")}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
