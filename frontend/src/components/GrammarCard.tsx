import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface GrammarCardProps {
  pattern: string;
  meaning: string;
  status?: 'Mastered' | 'Reviewing' | 'New';
  grammarId?: number;
  onAdd?: (grammarId: number) => void;
  isLoading?: boolean;
  onClickDetail?: () => void;
}

export function GrammarCard({ pattern, meaning, status, grammarId, onAdd, isLoading, onClickDetail }: GrammarCardProps) {
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (grammarId && onAdd && !isLoading) {
      onAdd(grammarId);
    }
  };
  
  return (
    <div 
      onClick={onClickDetail}
      className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-secondary/5 transition-all duration-300 relative overflow-hidden border border-slate-100 cursor-pointer"
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150" />
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="text-xs text-slate-400 font-medium mb-2">Grammar Pattern</div>
          <div className="text-2xl font-bold text-slate-900 font-mono break-words pr-2">{pattern}</div>
        </div>
        <button 
          onClick={handleAdd}
          disabled={isLoading}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
            isLoading 
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-slate-50 text-slate-400 group-hover:bg-secondary group-hover:text-white"
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-slate-600 font-medium line-clamp-2">{meaning}</p>
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
        </div>
      </div>
    </div>
  );
}
