import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Personas from './pages/Personas';
import Strategies from './pages/Strategies';
import Queue from './pages/Queue';
import CalendarPage from './pages/Calendar';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import FileManager from './pages/FileManager';
import PersonaWizard from './pages/PersonaWizard';
import Onboarding from './pages/Onboarding';
import Editor from './pages/Editor';
import Auth from './components/Auth';
import LogsPanel from './components/LogsPanel';
import { supabase } from './lib/supabase';
import BackgroundJobQueue from './components/BackgroundJobQueue';
import { LayoutDashboard, Users, Calendar, CalendarDays, BarChart2, Settings as SettingsIcon, Bell, Search, UserCircle, Folder, Save, Menu, X, Loader2, MessageSquare, List, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';

const TopNavLink = ({ to, label }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      color: isActive ? 'var(--text)' : 'var(--text-3)',
      textDecoration: 'none',
      fontWeight: 600,
      fontSize: 13,
      padding: '6px 12px',
      borderRadius: 'var(--radius-sm)',
      background: isActive ? 'var(--bg-3)' : 'transparent',
      transition: 'all 0.2s',
    })}
    onMouseEnter={(e) => {
      if (e.currentTarget.style.background === 'transparent') {
         e.currentTarget.style.color = 'var(--text)';
      }
    }}
    onMouseLeave={(e) => {
      if (e.currentTarget.style.background === 'transparent') {
         e.currentTarget.style.color = 'var(--text-3)';
      }
    }}
  >
    {label}
  </NavLink>
);

const Topbar = ({ onOpenMenu, onToggleLogs }) => {
  const [authAlert, setAuthAlert] = useState(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [reauthStatus, setReauthStatus] = useState('idle'); // 'idle' | 'loading' | 'success'

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.from('social_accounts').select('*').eq('status', 'error').limit(1);
      if (data && data.length > 0) {
        setAuthAlert(data[0]);
      } else {
        setAuthAlert(null);
      }
    };
    checkAuth();

    const sub = supabase.channel('topbar-auth')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_accounts' }, checkAuth)
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  // Automatically fetch from extension when alert appears
  useEffect(() => {
    if (authAlert && reauthStatus === 'idle') {
      const handleMessage = async (event) => {
        if (event.source !== window) return;
        if (event.data.type === "PERSONA_HUB_COOKIE_RESULT") {
          window.removeEventListener("message", handleMessage);
          
          const response = event.data.data; // { success: true, cookieString: "..." }
          if (response && response.success && response.cookieString) {
            setReauthStatus('success');
            await supabase.from('social_accounts').update({ session_cookie: response.cookieString, status: 'active' }).eq('id', authAlert.id);
            setTimeout(() => setReauthStatus('idle'), 2000);
          } else {
            setReauthStatus('idle');
          }
        }
      };

      setReauthStatus('loading');
      window.addEventListener("message", handleMessage);
      window.postMessage({ type: "PERSONA_HUB_EXTRACT", platform: authAlert.platform }, "*");

      // Fallback if extension doesn't respond quickly
      setTimeout(() => {
        setReauthStatus(current => {
          if (current === 'loading') {
            window.removeEventListener("message", handleMessage);
            return 'idle';
          }
          return current;
        });
      }, 3000);
    }
  }, [authAlert]);

  const handleManualReauth = () => {
    const manualCookie = prompt(`Extension not detected or failed. Enter new cookie for ${authAlert.platform}:`);
    if (manualCookie) {
      setReauthStatus('loading');
      supabase.from('social_accounts').update({ session_cookie: manualCookie, status: 'active' }).eq('id', authAlert.id).then(() => {
        setReauthStatus('success');
        setTimeout(() => setReauthStatus('idle'), 2000);
      });
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 32px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <button className="mobile-menu-btn" onClick={onOpenMenu} style={{ background: 'transparent', border: 'none', color: 'var(--text)', display: 'none', cursor: 'pointer' }}>
          <Menu size={24} />
        </button>
        <div className="topbar-search" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-3)', background: 'var(--bg-2)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <Search size={16} />
          <input 
            placeholder="Search personas or accounts..." 
            style={{ background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', fontSize: 13, width: 250 }} 
          />
        </div>
        <div className="topbar-links" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TopNavLink to="/calendar" label="Planner" />
          <TopNavLink to="/queue" label="Timeline" />
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {authAlert && (
          <button 
            onClick={handleManualReauth} 
            title={`Re-authenticate ${authAlert.platform}`}
            disabled={reauthStatus === 'success'}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: reauthStatus === 'success' ? 'default' : 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            {reauthStatus === 'idle' && <AlertTriangle size={20} color="#eab308" />}
            {reauthStatus === 'loading' && <RefreshCw size={20} color="var(--text-2)" className="spin" />}
            {reauthStatus === 'success' && <CheckCircle size={20} color="var(--green)" />}
          </button>
        )}
        <button onClick={onToggleLogs} style={{ background: 'transparent', color: 'var(--text-2)', position: 'relative', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <MessageSquare size={20} />
        </button>
        <NavLink to="/files" style={({isActive}) => ({ color: isActive ? 'var(--text)' : 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
          <Folder size={20} />
        </NavLink>
        <button style={{ background: 'transparent', color: 'var(--text-2)', position: 'relative', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Bell size={20} />
          <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />
        </button>
        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
        <button onClick={() => setQueueOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.05)', color: 'var(--accent)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer' }}>
          <List size={16} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px' }}>QUEUE</span>
          <span style={{ background: 'var(--accent)', color: 'var(--bg)', fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: '10px' }}>0</span>
        </button>
        <NavLink to="/editor" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--text)', color: 'var(--bg)', border: 'none', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', textDecoration: 'none' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px' }}>EDITOR</span>
        </NavLink>
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'var(--text)' }}>
          <UserCircle size={24} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Admin</span>
        </button>
      </div>

      {queueOpen && <BackgroundJobQueue onClose={() => setQueueOpen(false)} />}
    </div>
  );
};

const mobileNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dash' },
  { to: '/personas', icon: Users, label: 'Personas' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/queue', icon: Calendar, label: 'Queue' },
  { to: '/analytics', icon: BarChart2, label: 'Stats' },
];

import { useLocation } from 'react-router-dom';

const AppContent = ({ businesses, setBusinesses, onOpenMenu, onToggleLogs, mobileMenuOpen, setMobileMenuOpen, logsOpen, setLogsOpen, mobileNav }) => {
  const location = useLocation();
  const isEditor = location.pathname.startsWith('/editor');

  if (isEditor) {
    return (
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
        <Routes>
          <Route path="/editor" element={<Editor />} />
          <Route path="/editor/:projectId" element={<Editor />} />
        </Routes>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <div className="desktop-sidebar">
        <Sidebar mobile={false} />
      </div>

      {/* Main content */}
      <main className="main-content" style={{
        flex: 1,
        marginLeft: 'var(--sidebar)',
        height: '100%',
        overflowY: 'hidden',
        paddingBottom: '80px', // Extra padding for mobile bottom nav
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Topbar onOpenMenu={onOpenMenu} onToggleLogs={onToggleLogs} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/files" element={<FileManager />} />
            <Route path="/personas" element={<Personas />} />
            <Route path="/personas/new" element={<PersonaWizard />} />
            <Route path="/personas/:id/edit" element={<PersonaWizard />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Full Screen Menu Overlay */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--bg)', zIndex: 500, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '24px' }}>
            <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
              <X size={28} />
            </button>
          </div>
          
          <div style={{ padding: '0 24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-3)', background: 'var(--bg-2)', padding: '12px 16px', borderRadius: '20px', border: '1px solid var(--border)', width: '100%' }}>
              <Search size={16} />
              <input 
                placeholder="Search personas or accounts..." 
                style={{ background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', fontSize: 16, width: '100%' }} 
              />
            </div>
          </div>

          <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TopNavLink to="/personas" label="Personas" />
            <TopNavLink to="/calendar" label="Planner" />
            <TopNavLink to="/queue" label="Timeline" />
          </div>

          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)' }}>
            <Sidebar mobile={true} onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '12px 8px 24px', // Extra padding for safe area
        borderTop: '1px solid var(--border)',
        borderRadius: '24px 24px 0 0',
        background: 'var(--bg)',
      }}>
        {mobileNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: isActive ? 'var(--accent)' : 'var(--text-3)',
              textDecoration: 'none',
              flex: 1,
            })}
          >
            {({ isActive }) => (
              <>
                <div style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  transition: 'all 0.2s',
                }}>
                  <Icon size={20} color={isActive ? 'var(--accent)' : 'currentColor'} />
                </div>
                <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500 }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logs Panel */}
      {logsOpen && <LogsPanel onClose={() => setLogsOpen(false)} />}
    </div>
  );
};

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinesses = async () => {
      const { data } = await supabase.from('businesses').select('*');
      if (data) setBusinesses(data);
      setLoading(false);
    };
    fetchBusinesses();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Loader2 size={32} className="spin" />
    </div>
  );

  return (
    <BrowserRouter>
      <Auth>
        {businesses.length === 0 ? (
          <Onboarding onComplete={() => {
            supabase.from('businesses').select('*').then(({ data }) => setBusinesses(data || []));
          }} />
        ) : (
          <AppContent 
            businesses={businesses} 
            setBusinesses={setBusinesses} 
            mobileMenuOpen={mobileMenuOpen} 
            setMobileMenuOpen={setMobileMenuOpen}
            logsOpen={logsOpen}
            setLogsOpen={setLogsOpen}
            onOpenMenu={() => setMobileMenuOpen(true)}
            onToggleLogs={() => setLogsOpen(prev => !prev)}
            mobileNav={mobileNav}
          />
        )}

        <style>{`
          .desktop-sidebar { display: block; }
          .mobile-bottom-nav { display: none !important; }
          .main-content { margin-left: var(--sidebar); padding-bottom: 0 !important; }
          
          @media (max-width: 768px) {
            .desktop-sidebar { display: none; }
            .mobile-bottom-nav { display: flex !important; }
            .main-content { margin-left: 0 !important; padding-bottom: 90px !important; }
            .topbar-search { display: none !important; }
            .topbar-links { display: none !important; }
            .mobile-menu-btn { display: block !important; }
          }
        `}</style>
      </Auth>
    </BrowserRouter>
  );
}
