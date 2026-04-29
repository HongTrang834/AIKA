import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const DECK_COLORS = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
    red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
    green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700' }
};

interface Deck {
    id: number;
    name: string;
    description?: string;
    color: string;
    card_count: number;
}

interface DeckSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDeck: (deckId: number) => Promise<void>;
    isLoading?: boolean;
}

export default function DeckSelectionModal({ isOpen, onClose, onSelectDeck, isLoading = false }: DeckSelectionModalProps) {
    const { token } = useAuth();
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');
    const [newDeckColor, setNewDeckColor] = useState<string>('blue');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchDecks();
        }
    }, [isOpen, token]);

    const fetchDecks = async () => {
        if (!token) return;
        try {
            setLoading(true);
            setError(null);
            const response = await api.getMyDecks(token);
            const decksData = response?.rows || [];

            setDecks(decksData);
            if (decksData.length > 0) {
                setSelectedDeckId(decksData[0].id);
            }
        } catch (err) {
            console.error('Error fetching decks:', err);
            setError('Failed to load decks');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDeck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeckName.trim()) {
            setError('Deck name cannot be empty');
            return;
        }

        if (!token) {
            setError('Not authenticated');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await api.createDeck(token, {
                name: newDeckName,
                color: newDeckColor,
                description: ''
            });

            const newDeck = response.deck;

            setDecks([newDeck, ...decks]);
            setSelectedDeckId(newDeck.id);
            setNewDeckName('');
            setShowCreateForm(false);
        } catch (err: any) {
            console.error('Error creating deck:', err);
            setError(err.message || 'Failed to create deck');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedDeckId) {
            setError('Please select a deck');
            return;
        }

        try {
            setLoading(true);
            console.log(`🎯 Adding to deck: ${selectedDeckId}`);
            await onSelectDeck(selectedDeckId);
            onClose();
        } catch (err: any) {
            console.error('Error selecting deck:', err);
            setError(err.message || 'Failed to add to deck');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Add to Deck</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {loading && decks.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin">
                                <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                            </div>
                            <p className="mt-3 text-gray-600">Loading decks...</p>
                        </div>
                    ) : (
                        <>
                            {/* Decks List */}
                            <div className="space-y-2 mb-6">
                                {decks && Array.isArray(decks) && decks.length > 0 ? (
                                    decks.filter(deck => deck && deck.id).map((deck) => {
                                        const colorClass = DECK_COLORS[(deck?.color || 'blue') as keyof typeof DECK_COLORS] || DECK_COLORS.blue;
                                        return (
                                            <button
                                                key={deck.id}
                                                onClick={() => setSelectedDeckId(deck.id)}
                                                className={`w-full p-3 rounded-lg border-2 text-left transition ${
                                                    selectedDeckId === deck.id
                                                        ? `${colorClass.bg} border-blue-500 bg-blue-100`
                                                        : `${colorClass.bg} border-gray-200 hover:border-gray-300`
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{deck.name || 'Untitled Deck'}</div>
                                                        <div className="text-sm text-gray-600">{deck.card_count || 0} cards</div>
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        checked={selectedDeckId === deck.id}
                                                        onChange={() => setSelectedDeckId(deck.id)}
                                                        className="w-5 h-5"
                                                    />
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-4 text-gray-500">
                                        No decks available. Create one below.
                                    </div>
                                )}
                            </div>

                            {/* Create New Deck Form */}
                            {!showCreateForm ? (
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="w-full py-2 px-4 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2 mb-6"
                                >
                                    <Plus size={18} />
                                    Create New Deck
                                </button>
                            ) : (
                                <form onSubmit={handleCreateDeck} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Deck Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newDeckName}
                                            onChange={(e) => setNewDeckName(e.target.value)}
                                            placeholder="Enter deck name"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Color
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {Object.keys(DECK_COLORS).map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setNewDeckColor(color)}
                                                    className={`py-2 rounded-lg border-2 transition capitalize text-sm font-medium ${
                                                        newDeckColor === color
                                                            ? 'border-gray-800 ring-2 ring-offset-1'
                                                            : 'border-gray-300 hover:border-gray-400'
                                                    } ${DECK_COLORS[color as keyof typeof DECK_COLORS].bg}`}
                                                >
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
                                        >
                                            Create
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateForm(false);
                                                setNewDeckName('');
                                                setNewDeckColor('blue');
                                            }}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading || !selectedDeckId}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
                                >
                                    {isLoading ? 'Adding...' : 'Add to Deck'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
