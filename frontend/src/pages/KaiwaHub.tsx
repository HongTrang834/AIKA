import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, Trash2, AlertCircle, Mic, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
    <div className="flex-1 flex flex-col h-full w-full max-w-[1140px] mx-auto py-6">
      {/* Main Content */}
      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Sidebar - Mode & Scenario Selection */}
        <div className="w-72 card-duo p-6 overflow-y-auto flex flex-col gap-6">
          {/* Mode Selection */}
          <div>
            <h2 className="text-[19px] font-bold text-almost-black mb-4">Chế Độ Học</h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                mode === 'study' ? 'border-sky-blue bg-sky-blue/10' : 'border-cloud-gray bg-white hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  value="study"
                  checked={mode === 'study'}
                  onChange={() => setMode('study')}
                  className="hidden"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${mode === 'study' ? 'border-sky-blue' : 'border-silver'}`}>
                  {mode === 'study' && <div className="w-2.5 h-2.5 rounded-full bg-sky-blue" />}
                </div>
                <div>
                  <p className="font-bold text-[15px] text-almost-black">Học Từ Vựng & Ngữ Pháp</p>
                  <p className="text-[13px] text-graphite font-medium">Giải thích và ví dụ</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                mode === 'kaiwa' ? 'border-sky-blue bg-sky-blue-light' : 'border-cloud-gray bg-white hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  value="kaiwa"
                  checked={mode === 'kaiwa'}
                  onChange={() => setMode('kaiwa')}
                  className="hidden"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${mode === 'kaiwa' ? 'border-sky-blue' : 'border-silver'}`}>
                  {mode === 'kaiwa' && <div className="w-2.5 h-2.5 rounded-full bg-sky-blue" />}
                </div>
                <div>
                  <p className="font-bold text-[15px] text-almost-black">Luyện Tập Kaiwa</p>
                  <p className="text-[13px] text-graphite font-medium">Giao tiếp tự nhiên</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                mode === 'n2' ? 'border-grape-soda bg-grape-soda/10' : 'border-cloud-gray bg-white hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  value="n2"
                  checked={mode === 'n2'}
                  onChange={() => setMode('n2')}
                  className="hidden"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${mode === 'n2' ? 'border-grape-soda' : 'border-silver'}`}>
                  {mode === 'n2' && <div className="w-2.5 h-2.5 rounded-full bg-grape-soda" />}
                </div>
                <div>
                  <p className="font-bold text-[15px] text-almost-black">Kaiwa N2</p>
                  <p className="text-[13px] text-graphite font-medium">Hội thoại nâng cao</p>
                </div>
              </label>
            </div>
          </div>



          {/* Clear History Button */}
          <button
            onClick={handleClearHistory}
            className="w-full mt-auto flex items-center justify-center gap-2 text-bubblegum-pink py-3 rounded-xl hover:bg-pink-50 transition-colors font-bold text-[15px] border-2 border-transparent hover:border-pink-100"
          >
            <Trash2 className="w-5 h-5" />
            Xóa Lịch Sử
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col card-duo overflow-hidden relative">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-snow-white">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <p className="text-6xl mb-4">🎌</p>
                  <p className="text-[19px] font-bold text-graphite">日本語でチャットを始めましょう！</p>
                  <p className="text-[15px] text-silver font-bold mt-2">Bắt đầu trò chuyện bằng tiếng Nhật</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-xl px-5 py-4 font-bold text-[15px] ${message.role === 'user'
                      ? 'bg-sky-blue text-white rounded-3xl rounded-tr-sm'
                      : 'bg-cloud-gray text-almost-black rounded-3xl rounded-tl-sm'
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
                        className="mt-3 text-silver hover:text-sky-blue transition-colors flex items-center gap-1 font-bold"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-5 h-5" />
                        <span className="text-[13px]">Phát âm</span>
                      </button>
                    )}

                    {/* Error Display */}
                    {message.errors && message.errors.length > 0 && (
                      <div className="mt-4 pt-4 border-t-2 border-white/20 space-y-3">
                        {message.errors.map((error, idx) => (
                          <div
                            key={idx}
                            className={`text-[13px] p-3 rounded-xl border-2 ${message.role === 'user'
                              ? 'bg-sunshine-yellow/20 border-sunshine-yellow/50 text-[#cc9f00]'
                              : 'bg-white border-sunshine-yellow text-almost-black'
                              }`}
                          >
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#cc9f00]" />
                              <div>
                                <p className="font-extrabold line-through text-bubblegum-pink">{error.original}</p>
                                <p className="text-sky-blue font-extrabold mt-1">✅ {error.correction}</p>
                                <p className="font-bold mt-1 opacity-80">{error.explanation}</p>
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
                <div className="bg-cloud-gray text-almost-black px-5 py-4 rounded-3xl rounded-tl-sm flex items-center gap-2 font-bold text-[15px]">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>AI đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-cloud-gray p-6 bg-white shrink-0">
            <div className="flex gap-3">
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
                className="flex-1 px-5 py-3 border-2 border-cloud-gray rounded-2xl focus:outline-none focus:border-sky-blue focus:bg-sky-blue/5 text-[15px] font-bold text-almost-black placeholder-silver transition-all"
                disabled={loading || isListening}
              />
              <button
                onClick={() => setMicLang(prev => prev === 'ja-JP' ? 'vi-VN' : 'ja-JP')}
                disabled={loading || isListening}
                className="px-4 py-3 rounded-2xl border-2 border-cloud-gray bg-white text-graphite hover:bg-gray-50 hover:border-silver font-extrabold text-[15px] transition-all"
                title={micLang === 'ja-JP' ? "Đang thu âm tiếng Nhật (nhấn để đổi tiếng Việt)" : "Đang thu âm tiếng Việt (nhấn để đổi tiếng Nhật)"}
              >
                {micLang === 'ja-JP' ? 'JA' : 'VI'}
              </button>
              <button
                onClick={toggleListening}
                disabled={loading}
                className={`px-4 py-3 rounded-2xl border-2 transition-all flex items-center justify-center ${isListening
                  ? 'bg-bubblegum-pink border-bubblegum-pink text-white animate-pulse'
                  : 'border-cloud-gray bg-white text-graphite hover:bg-gray-50 hover:border-silver'
                  }`}
                title="Nhấn để nói (Voice input)"
              >
                <Mic className="w-6 h-6" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={loading || !inputValue.trim()}
                className="px-8 btn-3d-blue text-[17px] flex items-center gap-2 disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4 disabled:active:mt-0"
              >
                {loading ? (
                  <Loader className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
              </button>
            </div>
            <p className="text-[13px] text-silver font-bold mt-3 text-center">AI sẽ chỉ ra lỗi ngữ pháp nếu có</p>
          </div>
        </div>
      </div>
    </div>
  );
}
