import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface WordCardProps {
  kanji: string;
  reading: string;
  meaning: string;
  status?: 'Mastered' | 'Reviewing' | 'New';
  isCore?: boolean;
  vocabId?: number;
  onAdd?: (vocabId: number) => void;
  isLoading?: boolean;
  onClickDetail?: () => void;
}

export function WordCard({ kanji, reading, meaning, status, isCore, vocabId, onAdd, isLoading, onClickDetail }: WordCardProps) {
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vocabId && onAdd && !isLoading) {
      onAdd(vocabId);
    }
  };
  return (
    <div 
      onClick={onClickDetail}
      className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden border border-slate-100 cursor-pointer"
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150" />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xs text-slate-400 font-medium mb-1">{reading}</div>
          <div className="text-4xl font-headline font-bold text-slate-900 tracking-wide">{kanji}</div>
        </div>
        <button 
          onClick={handleAdd}
          disabled={isLoading}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            isLoading 
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-slate-50 text-slate-400 group-hover:bg-primary group-hover:text-white"
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-slate-600 font-medium">{meaning}</p>
        <div className="flex gap-2">
          {status && (
            <span className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
              status === 'Mastered' && "bg-secondary/10 text-secondary",
              status === 'Reviewing' && "bg-tertiary/10 text-tertiary",
              status === 'New' && "bg-slate-100 text-slate-500"
            )}>
              {status}
            </span>
          )}
          {isCore && (
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              CORE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
