import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options: string[];
}

interface Test {
  id: number;
  name: string;
  category: string;
  description?: string;
  total_questions: number;
}

export default function TestTaker({ testId, onBack }: { testId: number; onBack: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  const fetchTest = async () => {
    if (!token) return;
    try {
      const data = await api.getTest(testId, token);
      setTest(data.test);
      // Parse options from JSON strings
      const parsedQuestions = data.questions.map((q: any) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      }));
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error('Error fetching test:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (answer: string) => {
    setAnswers({
      ...answers,
      [questions[currentQuestionIndex].id]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const submitAnswers = questions.map(q => ({
        question_id: q.id,
        answer: answers[q.id] || '',
      }));

      const result = await api.submitTest(token!, testId, submitAnswers);
      setResult(result);
      setSubmitted(true);
      showToast('Test submitted successfully', 'success');
    } catch (error) {
      console.error('Error submitting test:', error);
      showToast('Error submitting test', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="w-full p-8">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <p className="text-gray-500">Test not found or no questions available</p>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Results Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-4">Test Result</h1>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-3xl font-bold text-blue-600">{result.score.toFixed(1)}%</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Correct</p>
              <p className="text-3xl font-bold text-blue-600">{result.correctCount}/{result.totalQuestions}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-3xl font-bold text-purple-600">{result.totalQuestions}</p>
            </div>
          </div>
        </div>

        {/* Review Answers */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Review Answers</h2>
          {questions.map((q, idx) => {
            const userAnswer = result.answers.find((a: any) => a.question_id === q.id);
            const isCorrect = userAnswer?.is_correct;

            return (
              <div key={q.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Question {idx + 1}: {q.question_text}</p>
                  </div>
                </div>
                <div className="ml-9 space-y-2">
                  <p className="text-sm"><span className="font-semibold text-gray-700">Your choice:</span> <span className="text-gray-900">{userAnswer?.answer || '(no answer)'}</span></p>
                  <p className="text-sm"><span className="font-semibold text-blue-700">Correct answer:</span> <span className="text-blue-900">{result.answers.find((a: any) => a.question_id === q.id)?.correct_answer || 'N/A'}</span></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const userAnswer = answers[currentQuestion.id];

  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8">
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      {/* Test Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{test.name}</h1>
        <p className="text-gray-600 mb-4">{test.category}</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Question {currentQuestionIndex + 1}/{questions.length}
        </p>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8 flex flex-col min-h-[480px]">
        <div className="min-h-[100px] flex items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 w-full">{currentQuestion.question_text}</h2>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8 flex-1">
          {currentQuestion.options.map((option: string, idx: number) => (
            <button
              key={idx}
              onClick={() => handleSelectAnswer(option)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                userAnswer === option
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  userAnswer === option
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-300'
                }`}>
                  {userAnswer === option && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="font-medium text-gray-900 break-words">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
          >
            ← Prev
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader className="w-4 h-4 animate-spin" /> : null}
              Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Question List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="font-bold text-gray-900 mb-4">Questions List</h3>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`p-3 rounded-lg font-semibold transition-all ${
                idx === currentQuestionIndex
                  ? 'bg-blue-600 text-white'
                  : answers[q.id]
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
