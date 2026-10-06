import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ScenarioPage from './pages/ScenarioPage';
import LawsSearchPage from './pages/LawsSearchPage';
import QuizPage from './pages/QuizPage';
import QuizResultsPage from './pages/QuizResultsPage';
import LoginPage from './pages/LoginPage';
import AdminDocumentsPage from './pages/AdminDocumentsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/adjudication" element={<ChatPage />} />
          <Route path="/scenarios" element={<ScenarioPage />} />
          <Route path="/search" element={<LawsSearchPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/quiz/:quizId/results" element={<QuizResultsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/documents" element={<AdminDocumentsPage />} />
          <Route path="/codex" element={<AdminDocumentsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
