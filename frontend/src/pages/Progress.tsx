import React, { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, Compass, MessageSquare, RotateCw, Calendar, Award, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface UserProgress {
  id: number;
  user_id: number;
  total_vocab_learned: number;
  total_grammar_learned: number;
  total_kaiwas: number;
  total_flashcard_reviews: number;
  last_activity: string | null;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function Progress() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchProgress();
    }
  }, [token]);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: UserProgress = await response.json();
      setProgress(data);
      console.log('Progress loaded:', data);
    } catch (error) {
      console.error('Error fetching progress:', error);
      showToast('Lỗi tải tiến độ: ' + String(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = [
    {
      label: 'Từ Vựng Học',
      value: progress?.total_vocab_learned || 0,
      icon: BookOpen,
      color: 'primary',
      target: 1000,
      description: 'từ vựng N2 đã học',
    },
    {
      label: 'Ngữ Pháp Học',
      value: progress?.total_grammar_learned || 0,
      icon: Compass,
      color: 'secondary',
      target: 100,
      description: 'mẫu ngữ pháp đã học',
    },
    {
      label: 'Luyện Kaiwa',
      value: progress?.total_kaiwas || 0,
      icon: MessageSquare,
      color: 'tertiary',
      target: 50,
      description: 'lần hội thoại với AI',
    },
    {
      label: 'Ôn Tập',
      value: progress?.total_flashcard_reviews || 0,
      icon: RotateCw,
      color: 'accent',
      target: 500,
      description: 'lần ôn tập flashcard',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <TrendingUp className="w-12 h-12" />
          </div>
          <p className="text-gray-500">Đang tải tiến độ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="mb-4">
        <h1 className="h1-feather text-almost-black mb-2"> Tiến Độ Học Tập</h1>
        <p className="text-graphite font-bold text-lg">
          Theo dõi tiến độ học tập N2 của bạn trong hệ thống
        </p>
      </div>

      {/* Last Activity */}
      {progress?.last_activity && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <p className="text-blue-900">
            <strong>Hoạt động cuối cùng:</strong> {formatDate(progress.last_activity)}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const percentage = Math.min((stat.value / stat.target) * 100, 100);

          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700">{stat.label}</h3>
                <div className="p-2.5 bg-blue-100 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
              </div>

              {/* Value */}
              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Mục tiêu: {stat.target}</span>
                  <span className="text-xs font-bold text-blue-600">
                    {Math.round(percentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Breakdown by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Path */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Lộ Trình Học Tập</h2>
          </div>

          <div className="space-y-4">
            {[
              { name: 'Từ Vựng N2', current: progress?.total_vocab_learned || 0, max: 1000 },
              { name: 'Ngữ Pháp N2', current: progress?.total_grammar_learned || 0, max: 100 },
              { name: 'Hội Thoại (Kaiwa)', current: progress?.total_kaiwas || 0, max: 50 },
              { name: 'Ôn Tập', current: progress?.total_flashcard_reviews || 0, max: 500 },
            ].map((item) => {
              const pct = Math.min((item.current / item.max) * 100, 100);
              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {item.current} / {item.max}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements & Stats */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-900">Thành Tựu & Thống Kê</h2>
          </div>

          <div className="space-y-6">
            {/* Total Learning Time */}
            <div className="border-b pb-6">
              <p className="text-sm text-gray-600 mb-2">Tổng Thời Gian Học</p>
              <p className="text-2xl font-bold text-gray-900">
                {progress?.total_flashcard_reviews
                  ? Math.round(progress.total_flashcard_reviews / 2)
                  : 0}{' '}
                giờ
              </p>
              <p className="text-xs text-gray-500 mt-1">
                (Ước tính từ lượt ôn tập)
              </p>
            </div>

            {/* Achievements */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">🏆 Huy Hiệu Có Được</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { emoji: '🔥', title: 'Ngày Liên Tiếp', unlock: progress?.total_kaiwas! > 5 },
                  { emoji: '📖', title: 'Học Viên', unlock: progress?.total_vocab_learned! > 100 },
                  { emoji: '🎯', title: 'Mục Đích Rõ', unlock: progress?.total_grammar_learned! > 10 },
                  { emoji: '💪', title: 'Chăm Chỉ', unlock: progress?.total_flashcard_reviews! > 100 },
                  { emoji: '🚀', title: 'Tàn Công', unlock: progress?.total_kaiwas! > 20 },
                  { emoji: '👑', title: 'Master', unlock: progress?.total_vocab_learned! > 500 },
                ].map((badge, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-center ${badge.unlock
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-gray-50 border border-gray-200 opacity-50'
                      }`}
                  >
                    <div className="text-2xl">{badge.emoji}</div>
                    <p className="text-xs font-medium text-gray-700 mt-1">
                      {badge.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">Tóm Tắt Tiến Độ</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>Nghĩa
            <p className="text-blue-100 text-sm">Tổng Từ Vựng</p>
            <p className="text-4xl font-bold">{progress?.total_vocab_learned || 0}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Ngữ Pháp Đã Học</p>
            <p className="text-4xl font-bold">{progress?.total_grammar_learned || 0}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Lớp Kaiwa</p>
            <p className="text-4xl font-bold">{progress?.total_kaiwas || 0}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Lần Ôn Tập</p>
            <p className="text-4xl font-bold">{progress?.total_flashcard_reviews || 0}</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-3">💡 Mẹo Tăng Tiến Độ</h3>
        <ul className="text-blue-800 text-sm space-y-2">
          <li>Hàng ngày ôn tập 10-15 flashcard để tối ưu Spaced Repetition</li>
          <li>Luyện kaiwa ít nhất 3 lần/tuần để cải thiện giao tiếp</li>
          <li>Học 3-5 từ vựng mới mỗi ngày</li>
          <li>Kết hợp học ngữ pháp với từ vựng để nhớ lâu hơn</li>
        </ul>
      </div>
    </div>
  );
}
