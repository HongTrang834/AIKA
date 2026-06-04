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
      className="group bg-white p-6 card-duo hover:-translate-y-1 hover:border-silver transition-transform duration-300 relative overflow-hidden cursor-pointer flex flex-col"
    >
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-[13px] text-silver font-extrabold mb-1">{reading}</div>
          <div className="text-4xl font-feather font-bold text-almost-black tracking-wide">{kanji}</div>
        </div>
        <button 
          onClick={handleAdd}
          disabled={isLoading}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2",
            isLoading 
              ? "bg-cloud-gray border-cloud-gray text-silver cursor-not-allowed"
              : "bg-white border-cloud-gray text-silver hover:border-sky-blue hover:bg-sky-blue-light hover:text-sky-blue active:scale-95"
          )}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4 mt-auto">
        <p className="text-graphite font-bold text-[15px]">{meaning}</p>
        <div className="flex gap-2">
          {status && (
            <span className={cn(
              "px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border-2 border-transparent",
              status === 'Mastered' && "bg-sky-blue-light text-sky-blue",
              status === 'Reviewing' && "bg-sunshine-yellow/20 text-[#cc9f00]",
              status === 'New' && "bg-cloud-gray text-graphite"
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
