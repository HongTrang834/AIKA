import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VocabLab from './pages/VocabLab';
import Scenarios from './pages/Scenarios';
import KaiwaHub from './pages/KaiwaHub';
import Flashcards from './pages/Flashcards';
import AdminVocabulary from './pages/AdminVocabulary';
import AdminGrammar from './pages/AdminGrammar';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
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
                <Route path="/kaiwa" element={<Scenarios />} />
                <Route path="/kaiwa/chat" element={<KaiwaHub />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/progress" element={<Dashboard />} />
                <Route path="/grammar" element={<VocabLab />} />
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
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
