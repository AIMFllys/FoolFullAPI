import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import ApiDocsPage from './pages/ApiDocsPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import EventEndedPage from './pages/EventEndedPage';

function AppLayout() {
  const location = useLocation();
  const isChat = location.pathname === '/chat';
  const isApiDocs = location.pathname === '/api-docs';
  const hideNav = isChat || isApiDocs;

  return (
    <>
      {!hideNav && <Navbar />}
      <main className={hideNav ? '' : 'main-content'}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/ended" element={<EventEndedPage />} />
          {/* Redirect legacy auth/select routes */}
          <Route path="/auth" element={<Navigate to="/chat" replace />} />
          <Route path="/select" element={<Navigate to="/chat" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
