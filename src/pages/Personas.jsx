import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import PlatformBadge from '../components/PlatformBadge';
import StatusBadge from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import { Plus, ChevronDown, ChevronUp, Activity, BarChart3, TrendingUp, X, Key, ShieldCheck, User, Trash2, CheckCircle2, Loader2 } from 'lucide-react';

export default function Personas() {
  const [personas, setPersonas] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  const [addingAccountFor, setAddingAccountFor] = useState(null); // persona ID
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [accountUsername, setAccountUsername] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [account2FA, setAccount2FA] = useState('');
  const [show2FAInfo, setShow2FAInfo] = useState(false);
  const [loginMethod, setLoginMethod] = useState('direct'); // 'direct' | 'google'
  const [hoveredPlatform, setHoveredPlatform] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [hasExtension, setHasExtension] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // New Source State
  const [isAddingSource, setIsAddingSource] = useState(null); // stores persona_id
  const [newSourcePlatform, setNewSourcePlatform] = useState('pinterest');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceFrequency, setNewSourceFrequency] = useState('5min');
  const [newSourceExtractMode, setNewSourceExtractMode] = useState('latest');

  useEffect(() => {
    let pingInterval;
    const handleMessage = (event) => {
      if (event.source !== window) return;
      if (event.data.type === "PERSONA_HUB_PONG") {
        setHasExtension(true);
        if (pingInterval) clearInterval(pingInterval);
      }
      if (event.data.type === "PERSONA_HUB_COOKIE_RESULT") {
        setIsExtracting(false);
        if (event.data.data.success) {
          // (Not used in new implementation)
        } else {
          alert(event.data.data.error || "Failed to extract cookies. Are you logged in on that platform?");
        }
      }
    };
    window.addEventListener("message", handleMessage);
    
    // Initial ping
    window.postMessage({ type: "PERSONA_HUB_PING" }, "*");
    
    // Fallback loop if script injected slightly later
    pingInterval = setInterval(() => { 
      if (!hasExtension) window.postMessage({ type: "PERSONA_HUB_PING" }, "*"); 
    }, 1000);

    return () => {
      window.removeEventListener("message", handleMessage);
      if (pingInterval) clearInterval(pingInterval);
    };
  }, [hasExtension]);

  useEffect(() => {
    const fetchPersonas = async () => {
      const { data: bData } = await supabase.from('businesses').select('*');
      if (bData) setBusinesses(bData);

      const { data } = await supabase.from('personas').select('*, social_accounts(*, analytics_history(*)), scraping_sources(*)');
      if (data) setPersonas(data);
    };
    fetchPersonas();
  }, []);

  const calculateTrend = (accounts) => {
    if (!accounts || accounts.length === 0) return null;
    let todayTotal = 0;
    let lastWeekTotal = 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    accounts.forEach(acc => {
      todayTotal += acc.followers || 0;
      
      const history = acc.analytics_history || [];
      if (history.length > 0) {
        let closest = history[0];
        let minDiff = Math.abs(new Date(closest.date) - oneWeekAgo);
        for (const h of history) {
          const diff = Math.abs(new Date(h.date) - oneWeekAgo);
          if (diff < minDiff) {
            minDiff = diff;
            closest = h;
          }
        }
        lastWeekTotal += parseInt(closest.followers) || 0;
      } else {
        // If no history, assume followers were the same 7 days ago
        lastWeekTotal += acc.followers || 0;
      }
    });

    if (lastWeekTotal === 0 && todayTotal > 0) return "+100%";
    if (lastWeekTotal === 0 && todayTotal === 0) return "New";
    
    const diff = todayTotal - lastWeekTotal;
    const percent = ((diff / lastWeekTotal) * 100).toFixed(1);
    return percent > 0 ? `+${percent}%` : `${percent}%`;
  };

  const handleConnect = async () => {
    if (!accountUsername || !accountPassword) return;
    setIsValidating(true);
    
    try {
      const { error } = await supabase.from('social_accounts').insert({
        persona_id: addingAccountFor,
        platform: selectedPlatform,
        username: accountUsername,
        session_cookie: loginMethod === 'google' ? `google_auth:${accountPassword}${account2FA ? '|' + account2FA : ''}` : accountPassword, // storing password temporarily in session_cookie for the worker to read
        status: 'pending_login', // worker will pick this up
        followers: 0
      });
      if (error) throw error;
      
      setPersonas(prev => prev.map(p => p.id === addingAccountFor ? {
        ...p,
        social_accounts: [...(p.social_accounts || []), {
          id: Math.random(), platform: selectedPlatform, username: accountUsername, status: 'pending_login'
        }]
      } : p));
      
      setAddingAccountFor(null);
      setSelectedPlatform(null);
      setAccountPassword('');
      setAccountUsername('');
      setAccount2FA('');
      setShow2FAInfo(false);
      setLoginMethod('direct');
    } catch (err) {
      alert('Error saving account details: ' + err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleVerify = async (personaId, accountId) => {
    // Optimistically set to verifying
    setPersonas(prev => prev.map(p => p.id === personaId ? {
      ...p, 
      social_accounts: p.social_accounts.map(a => a.id === accountId ? { ...a, status: 'verifying' } : a)
    } : p));
    
    // In the future this will ping the Hetzner worker
    // For now we simulate a delay and mark as active
    setTimeout(async () => {
      await supabase.from('social_accounts').update({ status: 'active' }).eq('id', accountId);
      setPersonas(prev => prev.map(p => p.id === personaId ? {
        ...p, 
        social_accounts: p.social_accounts.map(a => a.id === accountId ? { ...a, status: 'active' } : a)
      } : p));
    }, 2500);
  };



  const handleDeletePersona = async (personaId) => {
    if (!window.confirm("Are you sure you want to permanently delete this persona? This will also remove all connected accounts and pipelines.")) return;
    try {
      // First, manually delete child records since we might not have ON DELETE CASCADE set up in Supabase
      await supabase.from('social_accounts').delete().eq('persona_id', personaId);
      await supabase.from('scraping_sources').delete().eq('persona_id', personaId);
      
      const { error } = await supabase.from('personas').delete().eq('id', personaId);
      if (error) throw error;
      
      setPersonas(prev => prev.filter(p => p.id !== personaId));
      setExpanded(null);
    } catch (err) {
      alert('Error deleting persona: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '28px 24px', width: '100%', maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>Personas</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>Manage identities, networks, and performance.</p>
        </div>
        <button 
          onClick={() => navigate('/personas/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--text)', color: 'var(--bg)',
            padding: '10px 20px', borderRadius: 'var(--radius)',
            fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer'
          }}
        >
          <Plus size={18} /> New Persona
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {personas.map(p => (
          <Card key={p.id} className="glass" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header row */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 28px', cursor: 'pointer' }}
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: p.color + '22',
                border: `1px solid ${p.color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, fontWeight: 700, color: p.color, flexShrink: 0,
              }}>
                {p.avatar}
              </div>

              <div style={{ flex: 1.5, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{p.name}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>{p.handle}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, fontWeight: 500 }}>
                  Promoting: {businesses.find(b => b.id === p.business_id)?.name || 'Unknown'} {p.niche && `· ${p.niche}`}
                </div>
              </div>

              {/* Health Score Widget */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: (p.social_accounts || []).length > 0 ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={16} color={(p.social_accounts || []).length > 0 ? "var(--green)" : "var(--text-3)"} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Pipeline Health</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: (p.social_accounts || []).length > 0 ? 'var(--green)' : 'var(--text-3)' }}>
                    {(p.social_accounts || []).length > 0 ? 'Online' : 'Setup Required'}
                  </div>
                </div>
              </div>

              {/* Trend Widget */}
              {calculateTrend(p.social_accounts) && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={16} color="var(--text)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Weekly Trend</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: calculateTrend(p.social_accounts).startsWith('-') ? 'var(--red)' : 'var(--text)' }}>
                      {calculateTrend(p.social_accounts)}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexShrink: 0 }}>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  {(p.social_accounts || []).length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', maxWidth: 260 }}>
                      {p.social_accounts.map(acc => (
                         <div key={acc.id} title={acc.username} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-4)', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <PlatformBadge platform={acc.platform} size="sm" />
                            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.username}</span>
                         </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>0</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>ACCOUNTS</div>
                    </>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>active</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>STATUS</div>
                </div>
                {expanded === p.id ? <ChevronUp size={20} color="var(--text-3)" /> : <ChevronDown size={20} color="var(--text-3)" />}
              </div>
            </div>

            {/* Expanded accounts */}
            {expanded === p.id && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '24px 28px', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Network Accounts</div>
                  <button onClick={() => setAddingAccountFor(p.id)} style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}><Plus size={14}/> Add Account</button>
                </div>
                <div style={{ position: 'relative', marginTop: 16 }}>
                  <div style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12
                  }}>
                    {(p.social_accounts || []).map((acc, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)',
                        padding: '12px 16px',
                        border: '1px solid var(--border)',
                      }}>
                        <PlatformBadge platform={acc.platform} size="lg" />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.username}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            {acc.status === 'verifying' ? (
                              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><Loader2 size={12} className="spin" /> Verifying...</span>
                            ) : (
                              <StatusBadge status={acc.status} />
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!window.confirm(`Remove ${acc.username}?`)) return;
                              await supabase.from('social_accounts').delete().eq('id', acc.id);
                              setPersonas(prev => prev.map(p2 => p2.id === p.id ? { ...p2, social_accounts: p2.social_accounts.filter(a => a.id !== acc.id) } : p2));
                            }}
                            title="Remove Account"
                            style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4, opacity: 0.8 }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {(!p.social_accounts || p.social_accounts.length === 0) && (
                      <div style={{ padding: '24px', textAlign: 'center', gridColumn: '1 / -1', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No accounts linked yet.</p>
                      </div>
                    )}
                  </div>
                </div>



                <div style={{ marginTop: 32, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => navigate(`/personas/${p.id}/edit`)} style={{
                      padding: '8px 20px', borderRadius: '20px',
                      background: 'var(--text)', color: 'var(--bg)',
                      fontSize: 13, fontWeight: 600,
                    }}>Edit Persona</button>
                    <button style={{
                      padding: '8px 20px', borderRadius: '20px',
                      background: 'transparent', color: 'var(--text-2)',
                      border: '1px solid var(--border)',
                      fontSize: 13, fontWeight: 600,
                    }}>{p.status === 'active' ? 'Pause Automation' : 'Activate'}</button>
                  </div>
                  <button 
                    onClick={() => handleDeletePersona(p.id)}
                    style={{
                      padding: '8px 20px', borderRadius: '20px',
                      background: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)',
                      border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer'
                    }}>
                    Delete Persona
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add Account Modal (Headless Login) */}
      {addingAccountFor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(8px)' }}>
          <Card className="glass" style={{ width: 480, padding: 32, position: 'relative' }}>
            <button onClick={() => { setAddingAccountFor(null); setSelectedPlatform(null); setAccountPassword(''); setAccountUsername(''); setAccount2FA(''); setLoginMethod('direct'); }} style={{ position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Connect Account</h2>
            
            {!selectedPlatform ? (
              <>
                <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
                  Select a platform to connect. Our infrastructure spins up an isolated, dedicated proxy and headless session to operate this account 24/7 without risking bans.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { id: 'tiktok', name: 'TikTok', color: '#00F2FE', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.97-1.561 4.795 4.795 0 0 1-1.238-3.184h-3.66v14.4c-.015 1.543-1.077 3.037-2.613 3.513a3.67 3.67 0 0 1-3.832-1.072 3.655 3.655 0 0 1-.822-3.418 3.656 3.656 0 0 1 2.502-2.585 3.674 3.674 0 0 1 3.899.988v-3.79a7.332 7.332 0 0 0-4.041-.837 7.319 7.319 0 0 0-5.71 4.09 7.324 7.324 0 0 0 1.258 8.163 7.317 7.317 0 0 0 8.01 1.706 7.308 7.308 0 0 0 4.542-5.712V10.231a8.471 8.471 0 0 0 5.674 2.181V8.675a4.78 4.78 0 0 1-3.32-.97v-.004c-.381-.309-.707-.68-.962-1.096v.081Z"/></svg> },
                    { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
                    { id: 'instagram', name: 'Instagram', color: '#E1306C', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
                    { id: 'twitter', name: 'X (Twitter)', color: '#FFFFFF', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                    { id: 'pinterest', name: 'Pinterest', color: '#E60023', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.172 0 7.41 2.967 7.41 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.624 0 12.017 0z"/></svg> }
                  ].map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => setSelectedPlatform(p.id)} 
                      onMouseEnter={() => setHoveredPlatform(p.id)}
                      onMouseLeave={() => setHoveredPlatform(null)}
                      style={{ 
                        background: hoveredPlatform === p.id ? `color-mix(in srgb, ${p.color} 15%, var(--bg-3))` : 'var(--bg-3)', 
                        border: `1px solid ${hoveredPlatform === p.id ? p.color : 'var(--border)'}`, 
                        padding: '24px 20px', 
                        borderRadius: 'var(--radius)', 
                        color: hoveredPlatform === p.id ? p.color : 'var(--text)', 
                        fontSize: 15, 
                        fontWeight: 700, 
                        cursor: 'pointer', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: 16,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: hoveredPlatform === p.id ? 'translateY(-2px)' : 'translateY(0)',
                        boxShadow: hoveredPlatform === p.id ? `0 8px 24px -8px ${p.color}66` : 'none'
                      }}
                    >
                      <div style={{ transition: 'transform 0.2s', transform: hoveredPlatform === p.id ? 'scale(1.1)' : 'scale(1)' }}>
                        {p.icon}
                      </div>
                      {p.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>
                  Provide the credentials for your {selectedPlatform} account. The background worker will automatically login and maintain the session 24/7.
                </p>

                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  <button 
                    onClick={() => setLoginMethod('direct')}
                    style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', border: `1px solid ${loginMethod === 'direct' ? 'var(--text)' : 'var(--border)'}`, background: loginMethod === 'direct' ? 'rgba(255,255,255,0.05)' : 'transparent', color: loginMethod === 'direct' ? 'var(--text)' : 'var(--text-3)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Direct Login
                  </button>
                  <button 
                    onClick={() => setLoginMethod('google')}
                    style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', border: `1px solid ${loginMethod === 'google' ? '#4285F4' : 'var(--border)'}`, background: loginMethod === 'google' ? 'rgba(66, 133, 244, 0.1)' : 'transparent', color: loginMethod === 'google' ? '#4285F4' : 'var(--text-3)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google Auth
                  </button>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                    <User size={14} /> {loginMethod === 'google' ? 'Google Email' : 'Account Username / Email'}
                  </label>
                  <input 
                    value={accountUsername}
                    onChange={(e) => setAccountUsername(e.target.value)}
                    placeholder={loginMethod === 'google' ? 'you@gmail.com' : `e.g. my_${selectedPlatform}_handle`}
                    style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13 }}
                  />
                </div>
                
                <div style={{ marginBottom: loginMethod === 'google' ? 16 : 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                    <Key size={14} /> {loginMethod === 'google' ? 'Google Password' : 'Password'}
                  </label>
                  <input 
                    type="password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder={loginMethod === 'google' ? 'Your Google password' : 'Account password'}
                    style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13 }}
                  />
                </div>

                {loginMethod === 'google' && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>
                        <ShieldCheck size={14} /> 2FA Backup Code (Optional)
                      </label>
                      <button 
                        onClick={() => setShow2FAInfo(!show2FAInfo)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {show2FAInfo ? 'Hide Info' : 'How to get this?'}
                      </button>
                    </div>

                    {show2FAInfo && (
                      <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 12, color: 'var(--text)' }}>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>How to generate a Google Backup Code:</h4>
                        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.6, color: 'var(--text-2)' }}>
                          <li>Go to <strong>myaccount.google.com</strong> &gt; <strong>Security</strong>.</li>
                          <li>Under "How you sign in to Google", click <strong>2-Step Verification</strong>.</li>
                          <li>Scroll to <strong>Backup codes</strong> and click it.</li>
                          <li>Copy <strong>one</strong> of the 8-digit codes and paste it below.</li>
                        </ol>
                        <p style={{ margin: '8px 0 0 0', fontSize: 11, color: 'var(--accent)', opacity: 0.8 }}>This allows the autonomous worker to bypass phone prompts.</p>
                      </div>
                    )}

                    <input 
                      value={account2FA}
                      onChange={(e) => setAccount2FA(e.target.value)}
                      placeholder="e.g. 12345678"
                      style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13 }}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>If your Google account has 2FA enabled, provide a backup code here.</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 16 }}>
                  <button onClick={() => { setSelectedPlatform(null); setAccountPassword(''); setAccountUsername(''); setAccount2FA(''); setLoginMethod('direct'); }} disabled={isValidating} style={{ flex: 1, background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', padding: '14px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: isValidating ? 'not-allowed' : 'pointer', opacity: isValidating ? 0.5 : 1 }}>Back</button>
                  <button onClick={handleConnect} disabled={isValidating || !accountPassword || !accountUsername} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--text)', color: 'var(--bg)', border: 'none', padding: '14px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: isValidating || !accountPassword || !accountUsername ? 'not-allowed' : 'pointer', opacity: isValidating || !accountPassword || !accountUsername ? 0.5 : 1 }}>
                    {isValidating ? 'Saving...' : <><ShieldCheck size={18} /> Deploy Headless Login</>}
                  </button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}


    </div>
  );
}
