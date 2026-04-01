import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import ApiDocsPage from './pages/ApiDocsPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import EventEndedPage from './pages/EventEndedPage';

import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import BottomNav from './components/BottomNav';

function AppLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isChat = location.pathname === '/chat';
  const isApiDocs = location.pathname === '/api-docs';
  const hideNav = isChat || isApiDocs;
  const useFullWidth = isLanding || hideNav;

  return (
    <div className="relative min-h-screen bg-black overflow-hidden pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-0">
      {!hideNav && <Navbar />}
      <main className={useFullWidth ? '' : 'main-content'}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
            <Route path="/chat" element={<PageTransition><ChatPage /></PageTransition>} />
            <Route path="/api-docs" element={<PageTransition><ApiDocsPage /></PageTransition>} />
            <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
            <Route path="/ended" element={<PageTransition><EventEndedPage /></PageTransition>} />
            {/* Redirect legacy auth/select routes */}
            <Route path="/auth" element={<Navigate to="/chat" replace />} />
            <Route path="/select" element={<Navigate to="/chat" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
