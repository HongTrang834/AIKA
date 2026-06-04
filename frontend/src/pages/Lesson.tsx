import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Zap, MessageSquare, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface LessonContent {
  lesson_id: number;
  unit: string;
  title: string;
  lesson_number: number;
  type: string;
  description: string;
  vocabulary_count: number;
  grammar_count: number;
}

export default function Lesson() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const res = await fetch(`/api/progress/current-lesson`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setLesson(data);
          // Simulate progress
          setProgress(Math.random() * 100);
        }
      } catch (error) {
        console.error('Error fetching lesson:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <p className="text-slate-600 font-semibold mb-4">Lesson not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:scale-105 transition-transform"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-primary font-semibold hover:scale-105 transition-transform mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
              {lesson.unit} • Lesson {lesson.lesson_number}
            </p>
            <h1 className="text-4xl font-black text-slate-900">{lesson.title}</h1>
            <p className="text-lg text-slate-600 mt-2">{lesson.description}</p>
          </div>

          {/* Progress Bar */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-slate-900">Lesson Progress</p>
              <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
              className="h-2 bg-gradient-to-r from-primary to-secondary rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Lesson Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Content Sections */}
          {lesson.type === 'grammar' && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Grammar Patterns</h2>
              </div>
              <div className="space-y-4">
                {Array(lesson.grammar_count).fill(0).map((_, i) => (
                  <div key={i} className="p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
                    <p className="font-bold text-slate-900 mb-2">Pattern {i + 1}</p>
                    <p className="text-slate-600 text-sm mb-2">Example sentence with this pattern in context</p>
                    <p className="text-sm text-slate-500 italic">English meaning and explanation</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lesson.type === 'vocabulary' && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                  <Zap className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Vocabulary</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array(lesson.vocabulary_count).fill(0).map((_, i) => (
                  <div key={i} className="p-4 bg-gradient-to-r from-secondary/5 to-transparent rounded-xl border border-secondary/10">
                    <p className="text-2xl font-bold text-slate-900 mb-1">単語</p>
                    <p className="text-sm text-slate-600 mb-2">Reading: たんご</p>
                    <p className="text-sm text-slate-500">English meaning of the word</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lesson.type === 'scenario' && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-tertiary/10 rounded-xl flex items-center justify-center text-tertiary">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Conversation Scenario</h2>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm font-semibold text-blue-900 mb-1">You (Student)</p>
                  <p className="text-slate-700">こんにちは。今日は何ですか？</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm font-semibold text-blue-900 mb-1">AI Tutor</p>
                  <p className="text-slate-700">こんにちは。今日は会議についてお話しします。</p>
                </div>
              </div>
            </div>
          )}

          {/* Practice Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-primary to-primary-container p-8 rounded-2xl text-white shadow-lg"
          >
            <h3 className="text-2xl font-black mb-4">📝 Practice</h3>
            <p className="mb-6 text-white/90">Ready to test your knowledge? Click below to start the interactive practice session.</p>
            <button className="px-8 py-3 bg-white text-primary rounded-xl font-bold hover:scale-105 transition-transform">
              Start Practice
            </button>
          </motion.div>
        </motion.div>

        {/* Right: Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Stats Card */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
            <h3 className="font-black text-slate-900 mb-4">Lesson Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Type</span>
                <span className="font-semibold text-slate-900 capitalize">{lesson.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Vocabulary</span>
                <span className="font-semibold text-slate-900">{lesson.vocabulary_count} words</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Grammar</span>
                <span className="font-semibold text-slate-900">{lesson.grammar_count} patterns</span>
              </div>
            </div>
          </div>

          {/* Complete Lesson Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-secondary to-secondary-container text-white p-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <CheckCircle className="w-5 h-5" />
            Mark as Complete
          </motion.button>

          {/* Next Lesson Button */}
          <button className="w-full bg-slate-900 text-white p-4 rounded-xl font-semibold hover:scale-105 transition-transform">
            Continue to Next Lesson
          </button>
        </motion.div>
      </div>
    </div>
  );
}
