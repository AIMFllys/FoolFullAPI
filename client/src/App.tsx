import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import SelectPage from './pages/SelectPage';
import ChatPage from './pages/ChatPage';
import ApiDocsPage from './pages/ApiDocsPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import EventEndedPage from './pages/EventEndedPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/ended" element={<EventEndedPage />} />
            <Route path="/select" element={<ProtectedRoute><SelectPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/api-docs" element={<ProtectedRoute><ApiDocsPage /></ProtectedRoute>} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}
