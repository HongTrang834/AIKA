import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VocabLab from './pages/VocabLab';
import GrammarLab from './pages/GrammarLab';
import KaiwaHub from './pages/KaiwaHub';
import Flashcards from './pages/Flashcards';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Lesson from './pages/Lesson';
import AdminVocabulary from './pages/AdminVocabulary';
import AdminGrammar from './pages/AdminGrammar';
import AdminTests from './pages/AdminTests';
import AdminDecks from './pages/AdminDecks';
import VocabularyDetail from './pages/VocabularyDetail';
import GrammarDetail from './pages/GrammarDetail';

function AppContent() {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-blue-light/20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-blue border-t-transparent"></div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Admin Routes */}
      {isAdmin && (
        <Route
          path="/admin/*"
          element={
            <AdminLayout>
              <Routes>
                <Route path="vocabulary" element={<AdminVocabulary />} />
                <Route path="grammar" element={<AdminGrammar />} />
                <Route path="tests" element={<AdminTests />} />
                <Route path="decks" element={<AdminDecks />} />
                <Route path="*" element={<Navigate to="/admin/vocabulary" />} />
              </Routes>
            </AdminLayout>
          }
        />
      )}

      {/* User Routes */}
      {isAuthenticated && !isAdmin && (
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/vocab" element={<VocabLab />} />
                <Route path="/learn/vocabulary/:id" element={<VocabularyDetail />} />
                <Route path="/kaiwa" element={<KaiwaHub />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/grammar" element={<GrammarLab />} />
                <Route path="/learn/grammar/:id" element={<GrammarDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/learn/lesson/:id" element={<Lesson />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </Layout>
          }
        />
      )}

      {/* Redirect based on auth status */}
      {isAuthenticated ? (
        isAdmin ? (
          <Route path="*" element={<Navigate to="/admin/vocabulary" />} />
        ) : (
          <Route path="*" element={<Navigate to="/" />} />
        )
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
