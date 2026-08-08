import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Auth from './components/Auth';
import BusinessChooser from './pages/BusinessChooser';
import BusinessDashboard from './pages/BusinessDashboard';
import PersonaDetail from './pages/PersonaDetail';
import PersonaWizard from './pages/PersonaWizard';
import Strategies from './pages/Strategies';
import Queue from './pages/Queue';
import CalendarPage from './pages/Calendar';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import FileManager from './pages/FileManager';
import Drafting from './pages/Drafting';
import { BusinessProvider } from './components/BusinessContext';
import BusinessTopbar from './components/BusinessTopbar';
import LogsPanel from './components/LogsPanel';
import BackgroundJobQueue from './components/BackgroundJobQueue';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

// Wrapper for business-scoped routes
const BusinessLayout = ({ onToggleLogs, setQueueOpen }) => {
  const { businessId } = useParams();

  // We need to pass personaId to the Topbar if we are on a persona page
  // A simple hack is to match the URL
  const pathParts = window.location.pathname.split('/');
  const personaIdIndex = pathParts.indexOf('p') + 1;
  const personaId = personaIdIndex > 0 && personaIdIndex < pathParts.length ? pathParts[personaIdIndex] : null;

  return (
    <BusinessProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
        <BusinessTopbar businessId={businessId} personaId={personaId} onToggleLogs={onToggleLogs} onOpenQueue={() => setQueueOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<BusinessDashboard />} />
            <Route path="/p/:personaId/*" element={<PersonaDetail />} />
            <Route path="/personas/new" element={<PersonaWizard />} />
            <Route path="/personas/:id/edit" element={<PersonaWizard />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/files" element={<FileManager />} />
            <Route path="/drafting" element={<Drafting />} />
          </Routes>
        </main>
      </div>
    </BusinessProvider>
  );
};

export default function App() {
  const [logsOpen, setLogsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  return (
    <BrowserRouter>
      <Auth>
        <Routes>
          <Route path="/" element={<Navigate to="/choose-account" replace />} />
          <Route path="/choose-account" element={<BusinessChooser />} />
          <Route path="/b/:businessId/*" element={<BusinessLayout onToggleLogs={() => setLogsOpen(prev => !prev)} setQueueOpen={setQueueOpen} />} />
        </Routes>

        {logsOpen && <LogsPanel onClose={() => setLogsOpen(false)} />}
        {queueOpen && <BackgroundJobQueue onClose={() => setQueueOpen(false)} />}
      </Auth>
    </BrowserRouter>
  );
}
