import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VocabLab from './pages/VocabLab';
import Scenarios from './pages/Scenarios';
import KaiwaHub from './pages/KaiwaHub';
import Flashcards from './pages/Flashcards';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {isAuthenticated ? (
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
