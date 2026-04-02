import React from 'react';
import { ScenarioCard } from '@/src/components/ScenarioCard';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';

export default function Scenarios() {
  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      <section className="mb-16 relative">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold mb-4">
              SCENARIO-BASED LEARNING
            </span>
            <h1 className="text-4xl md:text-6xl font-black font-headline text-slate-900 leading-tight tracking-tight mb-6">
              Master N2 Japanese <br/>
              <span className="text-primary italic">Through Reality.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed">
              Step into curated 3D environments and practice high-stakes conversations. Our AI Sensei provides real-time feedback on politeness levels (Keigo) and natural phrasing.
            </p>
          </div>
          <div className="hidden lg:flex gap-4">
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-w-[140px]">
              <span className="text-3xl font-black text-primary">24</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Available</span>
            </div>
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-w-[140px]">
              <span className="text-3xl font-black text-secondary">12</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Mastered</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ScenarioCard 
          title="Job Interview"
          description="Practice your self-introduction (Jiko PR) and master the art of humble language (Kenjougo) in a corporate Tokyo setting."
          image="https://picsum.photos/seed/interview/600/400"
          tag="Business Keigo"
          duration="15m"
          level="N2"
        />
        <ScenarioCard 
          title="IT Project Discussion"
          description="Navigate a sprint planning session. Learn to express technical blockers and deadline concerns using polite disagreement."
          image="https://picsum.photos/seed/tech/600/400"
          tag="Technical Jargon"
          duration="20m"
          level="N2"
        />
        <ScenarioCard 
          title="Doctor Appointment"
          description="Describe symptoms accurately and understand complex medical instructions. Vital for long-term residents in Japan."
          image="https://picsum.photos/seed/medical/600/400"
          tag="Daily Survival"
          duration="30m"
          level="N2"
        />
        <ScenarioCard 
          title="Apartment Rental"
          description="Talk to a real estate agent. Understand 'key money' (reikin) and negotiate contract renewal terms like a pro."
          image="https://picsum.photos/seed/apartment/600/400"
          tag="Negotiation"
          duration="12m"
          level="N2"
        />
        <ScenarioCard 
          title="Izakaya Night"
          description="Master casual speech patterns (Tame-guchi) and cultural etiquette while bonding with colleagues after work."
          image="https://picsum.photos/seed/izakaya/600/400"
          tag="Casual Fluency"
          duration="25m"
          level="N2"
        />
      </div>

      <section className="mt-20">
        <div className="bg-white/40 border-slate-200 border p-10 rounded-[3rem] flex flex-col lg:flex-row items-center gap-12 backdrop-blur-sm">
          <div className="lg:w-1/3 relative">
            <div className="w-48 h-48 bg-primary rounded-full absolute -top-10 -left-10 blur-3xl opacity-20" />
            <div className="relative z-10 p-4 bg-white rounded-3xl shadow-xl rotate-3 border border-slate-100">
              <img 
                src="https://picsum.photos/seed/sensei/400/500" 
                alt="Sensei" 
                className="w-full h-56 object-cover rounded-2xl mb-4"
                referrerPolicy="no-referrer"
              />
              <div className="text-center">
                <p className="text-sm font-black text-slate-900">AI Sensei Hana</p>
                <p className="text-[10px] text-primary font-bold uppercase">Personal Tutor</p>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-black font-headline mb-4 text-slate-900">Recommended for You</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Based on your recent progress in "Honorifics" and "Business Vocab," Hana suggests the **"Client Dinner Negotiation"** scenario to solidify your N2 grammar in high-pressure situations.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/kaiwa/chat"
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-primary transition-colors"
              >
                <PlayCircle className="w-5 h-5" />
                Start Lesson
              </Link>
              <button className="px-8 py-4 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 hover:bg-slate-50 transition-colors">
                View Curriculum
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
