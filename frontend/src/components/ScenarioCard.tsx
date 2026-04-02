import React from 'react';
import { PlayCircle, Clock } from 'lucide-react';

interface ScenarioCardProps {
  title: string;
  description: string;
  image: string;
  tag: string;
  duration: string;
  level: string;
}

export function ScenarioCard({ title, description, image, tag, duration, level }: ScenarioCardProps) {
  return (
    <div className="group relative flex flex-col bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 border border-slate-100">
      <div className="h-56 relative overflow-hidden bg-slate-100">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-6">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
            {tag}
          </span>
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col">
        <h3 className="text-2xl font-bold font-headline mb-3 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          {description}
        </p>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary">
                {level}
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-secondary">
                {duration}
              </div>
            </div>
          </div>
          
          <button className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex items-center gap-2">
            Start
            <PlayCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
