import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, Trash2, AlertCircle, Mic, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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



export default function KaiwaHub() {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'study' | 'kaiwa' | 'n2'>('study');

  const [modeMessages, setModeMessages] = useState<Record<'study' | 'kaiwa' | 'n2', Message[]>>(() => {
    const saved = localStorage.getItem('kaiwaHubMessages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved messages', e);
      }
    }
    return {
      study: [],
      kaiwa: [],
      n2: []
    };
  });

  useEffect(() => {
    localStorage.setItem('kaiwaHubMessages', JSON.stringify(modeMessages));
  }, [modeMessages]);
  const messages = modeMessages[mode];

  const [inputValue, setInputValue] = useState('');
  const [modeLoading, setModeLoading] = useState<Record<'study' | 'kaiwa' | 'n2', boolean>>({
    study: false,
    kaiwa: false,
    n2: false
  });
  const loading = modeLoading[mode];

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const useVoiceRef = useRef(false);
  const initialInputValueRef = useRef('');
  const [micLang, setMicLang] = useState<'ja-JP' | 'vi-VN'>('ja-JP');


  useEffect(() => {
    // Tải danh sách giọng nói để tránh lỗi bị delay khi gọi lần đầu
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ja-JP';

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        // Nối kết quả nhận diện mới với phần text đã nhập trước khi bật mic
        setInputValue(initialInputValueRef.current + currentTranscript);
        useVoiceRef.current = true; // Đánh dấu là nhập bằng giọng nói
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showToast('Trình duyệt không hỗ trợ nhận diện giọng nói', 'error');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        // Lưu lại nội dung hiện tại để nối thêm khi nói
        initialInputValueRef.current = inputValue ? inputValue + ' ' : '';
        recognitionRef.current.lang = micLang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Dừng nếu đang đọc
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';

    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang === 'ja-JP');
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    window.speechSynthesis.speak(utterance);
  };


  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : inputValue;
    if (!textToSend.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
    };

    setModeMessages((prev) => ({
      ...prev,
      [mode]: [...prev[mode], userMessage]
    }));
    setInputValue('');
    setModeLoading((prev) => ({ ...prev, [mode]: true }));

    const currentMode = mode; // Lưu lại mode lúc gửi để dùng trong finally
    const shouldSpeak = useVoiceRef.current; // Nếu user dùng mic thì AI sẽ tự động trả lời bằng voice
    useVoiceRef.current = false; // Reset lại cho lần sau

    try {
      // Gọi trực tiếp đến ngrok API từ Colab
      const response = await fetch('https://quickness-spoiler-underfeed.ngrok-free.dev/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          message: textToSend,
          mode: mode,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply || 'Không có phản hồi từ AI.',
          errors: data.errors,
        };

        setModeMessages((prev) => ({
          ...prev,
          [mode]: [...prev[mode], assistantMessage]
        }));

        if (shouldSpeak && (mode === 'kaiwa' || mode === 'n2')) {
          speakText(data.reply);
        }
      } else {
        showToast('Lỗi khi gửi tin nhắn lên API Colab', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Lỗi kết nối với AI ngrok', 'error');
    } finally {
      setModeLoading((prev) => ({ ...prev, [currentMode]: false }));
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Xóa toàn bộ lịch sử trò chuyện?')) return;
    setModeMessages((prev) => ({
      ...prev,
      [mode]: []
    }));
    showToast('Đã xóa lịch sử', 'success');
  };

  return (
    <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/20 shadow-xl">
      {/* Main Content */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Sidebar - Mode & Scenario Selection */}
        <div className="w-72 bg-white rounded-lg shadow-md p-6 overflow-y-auto flex flex-col gap-6">
          {/* Mode Selection */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Chế Độ</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                style={{ borderColor: mode === 'study' ? '#3b82f6' : '#e5e7eb', backgroundColor: mode === 'study' ? '#eff6ff' : '#fff' }}>
                <input
                  type="radio"
                  name="mode"
                  value="study"
                  checked={mode === 'study'}
                  onChange={() => setMode('study')}
                  className="w-4 h-4 cursor-pointer"
                />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Học Từ Vựng & Ngữ Pháp</p>
                  <p className="text-xs text-gray-600">Giải thích và ví dụ</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                style={{ borderColor: mode === 'kaiwa' ? '#3b82f6' : '#e5e7eb', backgroundColor: mode === 'kaiwa' ? '#eff6ff' : '#fff' }}>
                <input
                  type="radio"
                  name="mode"
                  value="kaiwa"
                  checked={mode === 'kaiwa'}
                  onChange={() => setMode('kaiwa')}
                  className="w-4 h-4 cursor-pointer"
                />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Luyện Tập Kaiwa</p>
                  <p className="text-xs text-gray-600">Giao tiếp tự nhiên</p>
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
                  <p className="font-semibold text-gray-900 text-sm">Kaiwa Mức Độ N2</p>
                  <p className="text-xs text-gray-600">Hội thoại nâng cao và sửa lỗi</p>
                </div>
              </label>
            </div>
          </div>



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
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                      }`}
                  >
                    <div className="text-sm leading-relaxed markdown-container">
                      <ReactMarkdown
                        components={{
                          h1: ({ ...props }) => <h1 className="text-lg font-bold mb-2 border-b border-current pb-1" {...props} />,
                          h2: ({ ...props }) => <h2 className="text-md font-bold mb-2" {...props} />,
                          h3: ({ ...props }) => <h3 className="text-sm font-bold mb-1" {...props} />,
                          p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({ ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                          ol: ({ ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                          li: ({ ...props }) => <li className="mb-0.5" {...props} />,
                          code: ({ ...props }) => <code className="bg-black/10 rounded px-1 font-mono text-xs" {...props} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* Volume Button for Assistant */}
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => speakText(message.content)}
                        className="mt-2 text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span className="text-xs">Phát âm</span>
                      </button>
                    )}

                    {/* Error Display */}
                    {message.errors && message.errors.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
                        {message.errors.map((error, idx) => (
                          <div
                            key={idx}
                            className={`text-xs p-2 rounded ${message.role === 'user'
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
                disabled={loading || isListening}
              />
              <button
                onClick={() => setMicLang(prev => prev === 'ja-JP' ? 'vi-VN' : 'ja-JP')}
                disabled={loading || isListening}
                className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-sm transition-colors border border-gray-200"
                title={micLang === 'ja-JP' ? "Đang thu âm tiếng Nhật (nhấn để đổi tiếng Việt)" : "Đang thu âm tiếng Việt (nhấn để đổi tiếng Nhật)"}
              >
                {micLang === 'ja-JP' ? 'JA' : 'VI'}
              </button>
              <button
                onClick={toggleListening}
                disabled={loading}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                title="Nhấn để nói (Voice input)"
              >
                <Mic className="w-5 h-5" />
              </button>
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
