import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = 'http://localhost:3000/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  errors?: Array<{
    type: string;
    original: string;
    correction: string;
    explanation: string;
  }>;
}

interface ChatResponse {
  response: string;
  errors?: Array<{
    type: string;
    original: string;
    correction: string;
    explanation: string;
  }>;
  mode: string;
  scenario?: string;
}

const SCENARIOS = [
  { id: 'restaurant', label: 'レストラン (Restaurant)', description: 'Đặt bàn, gọi đồ ăn' },
  { id: 'taxi', label: 'タクシー (Taxi)', description: 'Hỏi đường, đi taxi' },
  { id: 'hotel', label: 'ホテル (Hotel)', description: 'Đặt phòng, check-in' },
  { id: 'interview', label: '面接 (Interview)', description: 'Phỏng vấn xin việc' },
  { id: 'coffee', label: 'カフェ (Cafe)', description: 'Gọi cà phê, trò chuyện' },
  { id: 'shopping', label: 'ショッピング (Shopping)', description: 'Mua sắm tại cửa hàng' },
];

export default function KaiwaHub() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'free' | 'scenario' | 'n2'>('free');
  const [selectedScenario, setSelectedScenario] = useState('restaurant');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/kaiwa/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: inputValue,
          mode,
          scenario: mode === 'scenario' ? selectedScenario : null,
        }),
      });

      if (response.ok) {
        const data: ChatResponse = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          errors: data.errors,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Show toast if there are errors
        if (data.errors && data.errors.length > 0) {
          showToast(`Found ${data.errors.length} error(s)`, 'info');
        }
      } else {
        showToast('Lỗi khi gửi tin nhắn', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Lỗi kết nối với AI', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Xóa toàn bộ lịch sử trò chuyện?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/kaiwa/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMessages([]);
        showToast('Đã xóa lịch sử', 'success');
      } else {
        showToast('Lỗi khi xóa lịch sử', 'error');
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      showToast('Lỗi', 'error');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      {/* <div className="bg-white border-b border-gray-200 shadow-sm p-6"> */}
        {/* <h1 className="text-3xl font-bold text-gray-900">Kaiwa Hub</h1> */}
        {/* <p className="text-gray-600 mt-1">会話練習 - Learn Japanese through AI conversations</p>
      </div> */}

      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Sidebar - Mode & Scenario Selection */}
        <div className="w-72 bg-white rounded-lg shadow-md p-6 overflow-y-auto flex flex-col gap-6">
          {/* Mode Selection */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Chế Độ</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                     style={{ borderColor: mode === 'free' ? '#3b82f6' : '#e5e7eb', backgroundColor: mode === 'free' ? '#eff6ff' : '#fff' }}>
                <input
                  type="radio"
                  name="mode"
                  value="free"
                  checked={mode === 'free'}
                  onChange={() => setMode('free')}
                  className="w-4 h-4 cursor-pointer"
                />
                <div>
                  <p className="font-semibold text-gray-900">Tự Do</p>
                  <p className="text-xs text-gray-600">Trò chuyện tự do</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                     style={{ borderColor: mode === 'scenario' ? '#3b82f6' : '#e5e7eb', backgroundColor: mode === 'scenario' ? '#eff6ff' : '#fff' }}>
                <input
                  type="radio"
                  name="mode"
                  value="scenario"
                  checked={mode === 'scenario'}
                  onChange={() => setMode('scenario')}
                  className="w-4 h-4 cursor-pointer"
                />
                <div>
                  <p className="font-semibold text-gray-900">Tình Huống</p>
                  <p className="text-xs text-gray-600">Theo chủ đề cụ thể</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                     style={{ borderColor: mode === 'n2' ? '#3b82f6' : '#e5e7eb', backgroundColor: mode === 'n2' ? '#eff6ff' : '#fff' }}>
                <input
                  type="radio"
                  name="mode"
                  value="n2"
                  checked={mode === 'n2'}
                  onChange={() => setMode('n2')}
                  className="w-4 h-4 cursor-pointer"
                />
                <div>
                  <p className="font-semibold text-gray-900">N2 Mastery</p>
                  <p className="text-xs text-gray-600">Hội thoại tích hợp RAG N2</p>
                </div>
              </label>
            </div>
          </div>

          {/* Scenario Selection */}
          {mode === 'scenario' && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Chọn Tình Huống</h2>
              <div className="space-y-2">
                {SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedScenario === scenario.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm">{scenario.label}</p>
                    <p className="text-xs text-gray-600">{scenario.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear History Button */}
          <button
            onClick={handleClearHistory}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Xóa Lịch Sử
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <p className="text-2xl mb-2">🎌</p>
                  <p className="text-gray-600">日本語でチャットを始めましょう！</p>
                  <p className="text-sm text-gray-500 mt-2">Bắt đầu trò chuyện bằng tiếng Nhật</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>

                    {/* Error Display */}
                    {message.errors && message.errors.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
                        {message.errors.map((error, idx) => (
                          <div
                            key={idx}
                            className={`text-xs p-2 rounded ${
                              message.role === 'user'
                                ? 'bg-yellow-600 bg-opacity-30'
                                : 'bg-yellow-100'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold">❌ {error.original}</p>
                                <p className="text-green-700 mt-1">✅ {error.correction}</p>
                                <p className="text-gray-700 mt-1 italic">{error.explanation}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 px-4 py-3 rounded-lg flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">AI đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleSendMessage();
                  }
                }}
                placeholder="日本語で話してください... / Nhập bằng tiếng Nhật"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !inputValue.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">AI sẽ chỉ ra lỗi ngữ pháp nếu có</p>
          </div>
        </div>
      </div>
    </div>
  );
}
