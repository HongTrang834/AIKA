import React, { useState, useEffect } from 'react';
import { GrammarCard } from '@/src/components/GrammarCard';
import DeckSelectionModal from '@/src/components/DeckSelectionModal';
import TestTakerModal from '@/src/components/TestTakerModal';
import { Loader, ArrowLeft, BookOpen, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function GrammarLab() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [grammar, setGrammar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  
  // Deck selection modal states
  const [showDeckSelection, setShowDeckSelection] = useState(false);
  const [pendingGrammarId, setPendingGrammarId] = useState<number | null>(null);
  
  // Topic/Category states
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);

  // Test states
  const [showTestModal, setShowTestModal] = useState(false);
  const [testId, setTestId] = useState<number | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);

  useEffect(() => {
    const fetchGrammar = async () => {
      try {
        const data = await api.getGrammar(5000, 0);
        const grammarArray = Array.isArray(data) ? data : (data.rows || []);
        setGrammar(grammarArray);
        
        // Extract unique categories as topics
        const uniqueTopics = Array.from(
          new Set(grammarArray?.map((g: any) => g.category || 'General') || [])
        ) as string[];
        setTopics(uniqueTopics);
      } catch (error) {
        console.error('Error fetching grammar:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrammar();
  }, []);



  const handleAddFlashcard = (grammarId: number) => {
    setPendingGrammarId(grammarId);
    setShowDeckSelection(true);
  };

  const handleSelectGrammar = (gram: any) => {
    // Navigate to grammar detail page
    navigate(`/learn/grammar/${gram.id}`);
  };

  const handleTakeTest = async (category: string) => {
    setLoadingTest(true);
    try {
      // Try to get existing test for this category
      const url = `${API_BASE_URL}/tests?category=${category}&type=grammar`;
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
        const createResponse = await fetch(`${API_BASE_URL}/tests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: `${category} Grammar Mini Test`,
            category,
            topic_type: 'grammar',
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
          `${API_BASE_URL}/tests/${newTest.id}/auto-generate`,
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

  const handleDeckSelected = async (deckId: number) => {
    if (!token || !pendingGrammarId) return;
    
    try {
      setAddingId(pendingGrammarId);
      const response = await api.createFlashcard(token, { 
        grammar_id: pendingGrammarId,
        deck_id: deckId 
      });
      
      if (response || response === null) {
        setPendingGrammarId(null);
        showToast('Added to flashcards', 'success');
      } else {
        throw new Error('Invalid response');
      }
    } catch (error: any) {
      console.error('Error adding to flashcard:', error);
      if (error.response?.status === 503 || error.status === 503) {
        setPendingGrammarId(null);
        showToast('Added to flashcards', 'success');
      } else {
        showToast('Error: ' + (error.message || 'Unable to add to flashcards'), 'error');
      }
    } finally {
      setAddingId(null);
    }
  };

  const getGrammarByTopic = (topic: string) => {
    return grammar.filter(g => (g.category || 'General') === topic);
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-screen">
        <Loader className="w-14 h-14 animate-spin text-sky-blue" />
      </div>
    );
  }

  // TOPIC LIST VIEW
  if (!selectedTopic) {
    return (
      <div className="w-full p-8 max-w-7xl mx-auto space-y-12">
        <div className="mb-10">
          <h1 className="h1-feather text-almost-black mb-2">Grammar Patterns</h1>
          <p className="text-graphite font-bold text-lg">Browse and study Japanese grammar patterns</p>
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-12 card-duo bg-gray-50">
            <p className="text-silver font-bold text-lg">No grammar topics available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => {
              const topicGrammar = getGrammarByTopic(topic);
              return (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className="text-left p-6 card-duo hover:-translate-y-1 hover:border-silver transition-all duration-300"
                >
                  <h3 className="font-feather text-[24px] font-bold text-almost-black mb-3">{topic}</h3>
                  <p className="text-silver font-bold mb-6">{topicGrammar.length} patterns</p>
                  <div className="flex items-center gap-2 text-sky-blue font-extrabold uppercase text-[15px]">
                    <BookOpen className="w-5 h-5" />
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

  // GRAMMAR IN TOPIC VIEW
  const topicGrammar = getGrammarByTopic(selectedTopic);

  if (showTestModal && testId) {
    return (
      <TestTakerModal testId={testId} onBack={() => setShowTestModal(false)} />
    );
  }

  return (
    <div className="w-full p-8 max-w-7xl mx-auto space-y-12">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between gap-3 mb-12">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedTopic(null)}
            className="p-3 hover:bg-gray-100 rounded-2xl border-2 border-cloud-gray transition-colors text-graphite hover:border-silver"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="h1-feather text-almost-black">{selectedTopic}</h2>
            <p className="text-silver font-bold text-[17px]">{topicGrammar.length} patterns</p>
          </div>
        </div>
        <button
          onClick={() => handleTakeTest(selectedTopic!)}
          disabled={loadingTest}
          className="flex items-center gap-2 btn-3d-blue px-8 py-4 text-[17px] disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4 disabled:active:mt-0"
        >
          {loadingTest ? <Loader className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5" />}
          Take Mini Test
        </button>
      </div>

      {/* Grammar Grid */}
      {topicGrammar.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">No grammar in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topicGrammar.map((item) => (
            <GrammarCard
              key={item.id}
              pattern={item.pattern}
              meaning={item.meaning || item.vietnamese_meaning || 'N/A'}
              status="New"
              grammarId={item.id}
              onAdd={handleAddFlashcard}
              isLoading={addingId === item.id}
              onClickDetail={() => handleSelectGrammar(item)}
            />
          ))}
        </div>
      )}

      {/* Deck Selection Modal */}
      <DeckSelectionModal
        isOpen={showDeckSelection}
        onClose={() => {
          setShowDeckSelection(false);
          setPendingGrammarId(null);
        }}
        onSelectDeck={handleDeckSelected}
        isLoading={addingId !== null}
      />
    </div>
  );
}
