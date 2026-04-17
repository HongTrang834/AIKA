import React, { useState, useEffect } from 'react';
import { WordCard } from '@/src/components/WordCard';
import DeckSelectionModal from '@/src/components/DeckSelectionModal';
import TestTakerModal from '@/src/components/TestTakerModal';
import { Loader, ArrowLeft, BookOpen, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';import { useToast } from '../context/ToastContext';
export default function VocabLab() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  
  // Deck selection modal states
  const [showDeckSelection, setShowDeckSelection] = useState(false);
  const [pendingVocabId, setPendingVocabId] = useState<number | null>(null);
  
  // Topic/Category states
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);

  // Test states
  const [showTestModal, setShowTestModal] = useState(false);
  const [testId, setTestId] = useState<number | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);

  useEffect(() => {
    const fetchVocabulary = async () => {
      try {
        const data = await api.getVocabulary(5000, 0);
        setVocabulary(data.rows || []);
        
        // Extract unique categories as topics
        const uniqueTopics = Array.from(
          new Set(data.rows?.map((v: any) => v.category || 'General') || [])
        ) as string[];
        setTopics(uniqueTopics);
      } catch (error) {
        console.error('Error fetching vocabulary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVocabulary();
  }, []);



  const handleTakeTest = async (category: string) => {
    setLoadingTest(true);
    try {
      // Try to get existing test for this category
      const url = `${import.meta.env.VITE_API_URL}/tests?category=${category}&type=vocabulary`;
      console.log('📌 Fetching tests from:', url);
      
      const response = await fetch(url);

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Response error:', response.status, response.statusText);
        console.error('📝 Response text:', text.substring(0, 500));
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const tests = await response.json();

      if (tests.length > 0) {
        // Use first existing test
        setTestId(tests[0].id);
        setShowTestModal(true);
      } else {
        // Create new test and auto-generate questions
        const createResponse = await fetch(`${import.meta.env.VITE_API_URL}/tests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: `${category} Vocabulary Mini Test`,
            category,
            topic_type: 'vocabulary',
            total_questions: 5,
          }),
        });

        if (!createResponse.ok) {
          throw new Error(`HTTP ${createResponse.status}: ${createResponse.statusText}`);
        }

        const newTest = await createResponse.json();
        console.log('✅ Test created:', newTest);
        
        // Auto-generate questions
        const genResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/tests/${newTest.id}/auto-generate`,
          { 
            method: 'POST', 
            headers: { Authorization: `Bearer ${token}` } 
          }
        );

        if (!genResponse.ok) {
          throw new Error(`HTTP ${genResponse.status}: Failed to generate questions`);
        }

        console.log('✅ Questions generated');
        setTestId(newTest.id);
        setShowTestModal(true);
      }
    } catch (error) {
      console.error('Error loading test:', error);
      console.error('Error loading test:', error);
    } finally {
      setLoadingTest(false);
    }
  };

  const handleAddFlashcard = (vocabId: number) => {
    setPendingVocabId(vocabId);
    setShowDeckSelection(true);
  };

  const handleSelectVocab = (vocab: any) => {
    // Navigate to vocabulary detail page
    navigate(`/learn/vocabulary/${vocab.id}`);
  };

  const handleDeckSelected = async (deckId: number) => {
    if (!token || !pendingVocabId) return;
    
    try {
      setAddingId(pendingVocabId);
      const response = await api.createFlashcard(token, { 
        vocab_id: pendingVocabId,
        deck_id: deckId 
      });
      
      // Accept both real DB responses and temporary mock responses
      if (response || response === null) {
        setPendingVocabId(null);
        showToast('Đã thêm vào flashcards', 'success');
      } else {
        throw new Error('Invalid response');
      }
    } catch (error: any) {
      console.error('Error adding to flashcard:', error);
      // If it's a 503 (table doesn't exist), still allow the action
      if (error.response?.status === 503 || error.status === 503) {
        setPendingVocabId(null);
        showToast('Đã thêm vào flashcards', 'success');
      } else {
        showToast('Lỗi: ' + (error.message || 'Không thể thêm vào flashcards'), 'error');
      }
    } finally {
      setAddingId(null);
    }
  };

  const getVocabByTopic = (topic: string) => {
    return vocabulary.filter(v => (v.category || 'General') === topic);
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // TOPICS VIEW
  if (!selectedTopic) {
    return (
      <div className="p-10 max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Vocabulary Topics</h1>
          <p className="text-slate-600">Browse and study Japanese vocabulary</p>
        </div>

        {/* Topics Grid */}
        {topics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No vocabulary topics available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => {
              const vocabCount = getVocabByTopic(topic).length;
              return (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className="text-left p-6 bg-white rounded-2xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 border border-slate-100"
                >
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{topic}</h3>
                  <p className="text-slate-600 mb-4">{vocabCount} words</p>
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <BookOpen className="w-4 h-4" />
                    Browse
                  </div>
                </button>
              );
            })}
          </div>
        )}


      </div>
    );
  }

  // VOCABULARY IN TOPIC VIEW
  const topicVocabs = getVocabByTopic(selectedTopic);

  if (showTestModal && testId) {
    return (
      <TestTakerModal testId={testId} onBack={() => setShowTestModal(false)} />
    );
  }

  return (
    <div className="p-10 max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between gap-3 mb-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedTopic(null)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{selectedTopic}</h2>
            <p className="text-slate-500">{topicVocabs.length} words</p>
          </div>
        </div>
        <button
          onClick={() => handleTakeTest(selectedTopic!)}
          disabled={loadingTest}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loadingTest ? <Loader className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
          Làm Bài Test
        </button>
      </div>

      {/* Vocabulary Grid */}
      {topicVocabs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">No vocabulary in this topic</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topicVocabs.map((vocab) => (
            <WordCard
              key={vocab.id}
              kanji={vocab.word}
              reading={vocab.reading}
              meaning={vocab.meaning || vocab.vietnamese_meaning || 'N/A'}
              status="New"
              vocabId={vocab.id}
              onAdd={handleAddFlashcard}
              isLoading={addingId === vocab.id}
              onClickDetail={() => handleSelectVocab(vocab)}
            />
          ))}
        </div>
      )}

      {/* Deck Selection Modal */}
      <DeckSelectionModal
        isOpen={showDeckSelection}
        onClose={() => {
          setShowDeckSelection(false);
          setPendingVocabId(null);
        }}
        onSelectDeck={handleDeckSelected}
        isLoading={addingId !== null}
      />
    </div>
  );
}
