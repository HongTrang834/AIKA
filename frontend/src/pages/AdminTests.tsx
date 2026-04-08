import React, { useState, useEffect } from 'react';
import { Plus, Loader, Trash2, Edit2, X, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

export default function AdminTests() {
  const { token } = useAuth();
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
      const vocabResponse = await fetch(`${import.meta.env.VITE_API_URL}/vocabulary`);
      const vocabData = await vocabResponse.json();
      const vocabCats = [...new Set(vocabData.rows?.map((v: any) => v.category))].filter(Boolean);

      // Fetch grammar categories
      const grammarResponse = await fetch(`${import.meta.env.VITE_API_URL}/grammar`);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tests?category=${cat}&type=${typ}`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tests/${testId}/questions`, {
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
      alert('Hãy điền tất cả các trường');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tests`, {
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
        alert('Test tạo thành công! Đang sinh câu hỏi...');
        
        // Auto-generate questions
        const genResponse = await fetch(`${import.meta.env.VITE_API_URL}/admin/tests/${newTest.id}/auto-generate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (genResponse.ok) {
          alert('Câu hỏi đã sinh xong!');
          setSelectedTest(newTest);
          fetchQuestions(newTest.id);
        }
      }
    } catch (error) {
      console.error('Error creating test:', error);
      alert('Lỗi khi tạo test');
    } finally {
      setCreating(false);
    }
  };

  const handleAutoGenerate = async (testId: number) => {
    if (!window.confirm('Tái tạo tất cả câu hỏi cho test này?')) return;

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tests/${testId}/auto-generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Câu hỏi đã tái tạo!');
        fetchQuestions(testId);
      }
    } catch (error) {
      console.error('Error regenerating questions:', error);
      alert('Lỗi khi tái tạo câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId: number) => {
    if (!window.confirm('Xóa test này?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tests/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setTests(tests.filter(t => t.id !== testId));
        if (selectedTest?.id === testId) {
          setSelectedTest(null);
          setQuestions([]);
        }
        alert('Test đã xóa');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Lỗi khi xóa test');
    }
  };

  const handleDeleteQuestion = async (testId: number, questionId: number) => {
    if (!window.confirm('Xóa câu hỏi này?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tests/${testId}/questions/${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== questionId));
        alert('Câu hỏi đã xóa');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Lỗi khi xóa câu hỏi');
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editForm || !selectedTest) return;

    if (!editForm.question_text || !editForm.correct_answer || !editForm.options || editForm.options.length !== 4) {
      alert('Điền tất cả trường và đảm bảo có 4 tùy chọn');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/tests/${selectedTest.id}/questions/${editForm.id}`,
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
        alert('Câu hỏi đã cập nhật');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Lỗi khi cập nhật câu hỏi');
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

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">📝 Quản Lý Bài Test</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel: Create Test */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Tạo Bài Test Mới</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Loại</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="vocabulary">📚 Từ Vựng</option>
                <option value="grammar">📖 Ngữ Pháp</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Category</label>
              <select
                value={formData.category || selectedCategory}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Chọn Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Tên Test</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ví dụ Business Vocabulary Test"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Số Câu</label>
              <input
                type="number"
                value={formData.total_questions}
                onChange={(e) => setFormData({ ...formData, total_questions: parseInt(e.target.value) })}
                min="1"
                max="50"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <button
              onClick={handleCreateTest}
              disabled={creating}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tạo Test
            </button>
          </div>
        </div>

        {/* Middle Panel: Tests List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Danh Sách Tests</h2>

          <div className="space-y-2" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader className="w-6 h-6 animate-spin" />
              </div>
            ) : tests.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có test</p>
            ) : (
              tests.map(test => (
                <div
                  key={test.id}
                  onClick={() => {
                    setSelectedTest(test);
                    fetchQuestions(test.id);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedTest?.id === test.id
                      ? 'bg-blue-100 border-2 border-blue-600'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-semibold text-sm">{test.name}</p>
                  <p className="text-xs text-gray-600">{test.category}</p>
                  <p className="text-xs text-gray-500">{test.total_questions} câu</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Questions & Edit */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {selectedTest ? (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedTest.name}</h2>
                  <p className="text-sm text-gray-600">{selectedTest.category}</p>
                </div>
                <button
                  onClick={() => handleDeleteTest(selectedTest.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleAutoGenerate(selectedTest.id)}
                className="w-full bg-green-600 text-white py-2 rounded-lg mb-4 font-semibold hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tái tạo Câu Hỏi
              </button>

              <h3 className="font-semibold mb-3">Câu Hỏi ({questions.length})</h3>

              <div style={{ maxHeight: '500px', overflowY: 'auto' }} className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-gray-50 rounded-lg border">
                    {editingQuestion === q.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.question_text}
                          onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="text"
                          value={editForm.correct_answer}
                          onChange={(e) => setEditForm({ ...editForm, correct_answer: e.target.value })}
                          placeholder="Đáp án đúng"
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                        <div className="space-y-1">
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
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdateQuestion}
                            className="flex-1 bg-green-600 text-white py-1 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Lưu
                          </button>
                          <button
                            onClick={() => {
                              setEditingQuestion(null);
                              setEditForm(null);
                            }}
                            className="flex-1 bg-gray-400 text-white py-1 rounded text-sm hover:bg-gray-500 flex items-center justify-center gap-1"
                          >
                            <X className="w-3 h-3" /> Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-semibold mb-1">Q{idx + 1}: {q.question_text}</p>
                        <p className="text-xs text-gray-600 mb-2">
                          <span className="font-semibold">✓ Đúng:</span> {q.correct_answer}
                        </p>
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => startEditQuestion(q)}
                            className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(selectedTest.id, q.id)}
                            className="text-red-600 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">Chọn một test để xem câu hỏi</p>
          )}
        </div>
      </div>
    </div>
  );
}
