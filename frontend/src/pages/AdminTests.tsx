import React, { useState, useEffect } from 'react';
import { Plus, Loader, Trash2, Edit2, X, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface Test {
  id: number;
  name: string;
  category: string;
  topic_type: string;
  total_questions: number;
  description?: string;
}

interface Question {
  id: number;
  test_id: number;
  question_text: string;
  question_type: string;
  correct_answer: string;
  options: string | string[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function AdminTests() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('vocabulary');

  // Form state
  const [formData, setFormData] = useState({ name: '', category: '', total_questions: 5 });
  const [categories, setCategories] = useState<string[]>([]);

  // Edit question state
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchTests(selectedCategory, selectedType);
    }
  }, [selectedCategory, selectedType]);

  const fetchCategories = async () => {
    try {
      // Fetch vocabulary categories
      const vocabResponse = await fetch(`${API_BASE_URL}/vocabulary`);
      const vocabData = await vocabResponse.json();
      const vocabCats = [...new Set(vocabData.rows?.map((v: any) => v.category))].filter(Boolean);

      // Fetch grammar categories
      const grammarResponse = await fetch(`${API_BASE_URL}/grammar`);
      const grammarData = await grammarResponse.json();
      const grammarCats = [...new Set(grammarData.rows?.map((g: any) => g.category))].filter(Boolean);

      const allCats = [...new Set([...vocabCats, ...grammarCats])];
      setCategories(allCats as string[]);
      if (allCats.length > 0 && !selectedCategory) {
        setSelectedCategory(allCats[0] as string);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTests = async (category?: string, type?: string) => {
    setLoading(true);
    try {
      const cat = category || selectedCategory;
      const typ = type || selectedType;
      const response = await fetch(`${API_BASE_URL}/admin/tests?category=${cat}&type=${typ}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setTests(data);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (testId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tests/${testId}/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setQuestions(data.map((q: any) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      })));
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleCreateTest = async () => {
    if (!formData.name || !formData.category) {
      showToast('Hãy điền tất cả các trường', 'error');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          topic_type: selectedType,
          total_questions: formData.total_questions,
        }),
      });

      if (response.ok) {
        const newTest = await response.json();
        setTests([...tests, newTest]);
        setFormData({ name: '', category: '', total_questions: 5 });
        showToast('Test tạo thành công', 'success');

        // Auto-generate questions
        const genResponse = await fetch(`${API_BASE_URL}/admin/tests/${newTest.id}/auto-generate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (genResponse.ok) {
          setSelectedTest(newTest);
          fetchQuestions(newTest.id);
          showToast('Câu hỏi đã sinh xong', 'success');
        }
      } else {
        showToast('Lỗi khi tạo test', 'error');
      }
    } catch (error) {
      console.error('Error creating test:', error);
      showToast('Lỗi khi tạo test', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleAutoGenerate = async (testId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tests/${testId}/auto-generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchQuestions(testId);
        showToast('Câu hỏi đã tái tạo', 'success');
      } else {
        showToast('Lỗi khi tái tạo câu hỏi', 'error');
      }
    } catch (error) {
      console.error('Error regenerating questions:', error);
      showToast('Lỗi khi tái tạo câu hỏi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tests/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setTests(tests.filter(t => t.id !== testId));
        if (selectedTest?.id === testId) {
          setSelectedTest(null);
          setQuestions([]);
        }
        showToast('Test đã xóa', 'success');
      } else {
        showToast('Lỗi khi xóa test', 'error');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      showToast('Lỗi khi xóa test', 'error');
    }
  };

  const handleDeleteQuestion = async (testId: number, questionId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/tests/${testId}/questions/${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== questionId));
        showToast('Câu hỏi đã xóa', 'success');
      } else {
        showToast('Lỗi khi xóa câu hỏi', 'error');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      showToast('Lỗi khi xóa câu hỏi', 'error');
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editForm || !selectedTest) return;

    if (!editForm.question_text || !editForm.correct_answer || !editForm.options || editForm.options.length !== 4) {
      showToast('Điền tất cả trường và đảm bảo có 4 tùy chọn', 'error');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/tests/${selectedTest.id}/questions/${editForm.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question_text: editForm.question_text,
            question_type: editForm.question_type,
            correct_answer: editForm.correct_answer,
            options: editForm.options,
          }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setQuestions(questions.map(q => q.id === updated.id ? { ...updated, options: JSON.parse(updated.options) } : q));
        setEditingQuestion(null);
        setEditForm(null);
        showToast('Câu hỏi đã cập nhật', 'success');
      } else {
        showToast('Lỗi khi cập nhật câu hỏi', 'error');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      showToast('Lỗi khi cập nhật câu hỏi', 'error');
    }
  };

  const startEditQuestion = (question: Question) => {
    setEditingQuestion(question.id);
    setEditForm({
      id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      correct_answer: question.correct_answer,
      options: Array.isArray(question.options) ? question.options : JSON.parse(question.options),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 h-full">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="h1-feather text-almost-black mb-8">Quản Lý Bài Test</h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Panel: Tests List */}
        <div className="card-duo p-8 md:col-span-1">
          {/* <h2 className="h2-feather mb-6 text-almost-black">Danh Sách Tests</h2> */}

          <div className="space-y-3 pr-2 custom-scrollbar" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {tests.length === 0 ? (
              <p className="text-silver font-bold text-[15px] text-center mt-4">Chưa có test</p>
            ) : (
              tests.map(test => (
                <div
                  key={test.id}
                  onClick={() => {
                    setSelectedTest(test);
                    fetchQuestions(test.id);
                  }}
                  className={`p-4 rounded-2xl border-4 cursor-pointer transition-all hover:-translate-y-1 ${selectedTest?.id === test.id
                    ? 'bg-sky-blue/10 border-sky-blue'
                    : 'bg-white border-cloud-gray hover:border-silver hover:bg-gray-50'
                    }`}
                >
                  <p className="font-extrabold text-[17px] text-almost-black mb-1">{test.name}</p>
                  <p className="text-[13px] font-bold text-sky-blue uppercase tracking-wide mb-1">{test.category}</p>
                  <p className="text-[13px] font-bold text-silver bg-cloud-gray inline-block px-2 py-1 rounded-lg">{test.total_questions} câu</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Questions & Edit */}
        <div className="card-duo p-8 md:col-span-2">
          {selectedTest ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="h2-feather text-almost-black">{selectedTest.name}</h2>
                  <p className="text-[15px] font-bold text-sky-blue uppercase tracking-wide mt-1">{selectedTest.category}</p>
                </div>
                <button
                  onClick={() => handleDeleteTest(selectedTest.id)}
                  className="p-3 rounded-xl border-2 border-cloud-gray hover:border-bubblegum-pink text-bubblegum-pink transition-all"
                  title="Xóa Test"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => handleAutoGenerate(selectedTest.id)}
                className="w-full btn-3d-blue py-3 text-[15px] mb-6 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Tái tạo Câu Hỏi
              </button>

              <h3 className="h3-feather text-graphite mb-4">Câu Hỏi ({questions.length})</h3>

              <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="space-y-4 pr-2 custom-scrollbar">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-5 rounded-2xl border-4 border-cloud-gray bg-white hover:border-silver transition-colors">
                    {editingQuestion === q.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editForm.question_text}
                          onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-cloud-gray rounded-xl font-bold text-[15px] focus:border-sky-blue focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editForm.correct_answer}
                          onChange={(e) => setEditForm({ ...editForm, correct_answer: e.target.value })}
                          placeholder="Đáp án đúng"
                          className="w-full px-4 py-3 border-2 border-cloud-gray rounded-xl font-bold text-[15px] focus:border-sky-blue focus:outline-none text-sky-blue bg-sky-blue-light/30"
                        />
                        <div className="space-y-2 pl-4 border-l-4 border-cloud-gray">
                          {editForm.options?.map((opt: string, i: number) => (
                            <input
                              key={i}
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...editForm.options];
                                newOpts[i] = e.target.value;
                                setEditForm({ ...editForm, options: newOpts });
                              }}
                              className="w-full px-4 py-2 border-2 border-cloud-gray rounded-xl font-bold text-[15px] focus:border-sky-blue focus:outline-none"
                              placeholder={`Option ${i + 1}`}
                            />
                          ))}
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={handleUpdateQuestion}
                            className="flex-1 btn-3d-blue py-3 text-[15px] flex items-center justify-center gap-2"
                          >
                            <Check className="w-5 h-5" /> Lưu
                          </button>
                          <button
                            onClick={() => {
                              setEditingQuestion(null);
                              setEditForm(null);
                            }}
                            className="flex-1 btn-outline-gray py-3 text-[15px] text-graphite flex items-center justify-center gap-2"
                          >
                            <X className="w-5 h-5" /> Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[15px] font-extrabold text-almost-black mb-3 leading-relaxed">
                          <span className="text-sky-blue">Q{idx + 1}:</span> {q.question_text}
                        </p>
                        <div className="bg-sky-blue-light/50 border-2 border-sky-blue p-3 rounded-xl mb-4">
                          <p className="text-[13px] font-bold text-sky-blue">
                            <span className="font-extrabold">✓ Đáp án:</span> {q.correct_answer}
                          </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => startEditQuestion(q)}
                            className="p-2 rounded-xl border-2 border-transparent text-sky-blue hover:bg-sky-blue/10 hover:border-sky-blue transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(selectedTest.id, q.id)}
                            className="p-2 rounded-xl border-2 border-transparent text-bubblegum-pink hover:bg-pink-50 hover:border-bubblegum-pink transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-16 h-16 bg-cloud-gray rounded-full flex items-center justify-center mb-4 text-silver">
                <Check className="w-8 h-8" />
              </div>
              <p className="text-graphite font-bold text-[17px]">Chọn một test để xem câu hỏi</p>
              <p className="text-silver font-bold text-[13px] mt-2">Nội dung bài test sẽ hiển thị ở đây</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
