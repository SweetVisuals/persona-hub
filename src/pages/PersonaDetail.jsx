import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../components/BusinessContext';
import Card from '../components/Card';
import PlatformBadge from '../components/PlatformBadge';
import StatusBadge from '../components/StatusBadge';
import { 
  ChevronRight, Edit2, Power, Trash2, Plus, 
  Image as ImageIcon, Video, FileText, Music, 
  Link as LinkIcon, BarChart2, Activity, Play, XCircle 
} from 'lucide-react';
import LogsPanel from '../components/LogsPanel';

// === SUB-COMPONENTS ===

function OverviewTab({ personaId }) {
  const [stats, setStats] = useState({ reach: 0, accounts: 0, strategies: 0, files: 0 });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Parallel fetches for speed
      const [accsRes, stratsRes, filesRes, actsRes] = await Promise.all([
        supabase.from('social_accounts').select('id, platform, username, status, follower_count').eq('persona_id', personaId),
        supabase.from('strategies').select('*', { count: 'exact', head: true }).eq('persona_id', personaId),
        supabase.from('content_files').select('*', { count: 'exact', head: true }).eq('persona_id', personaId),
        supabase.from('automation_tasks').select('*').eq('persona_id', personaId).order('created_at', { ascending: false }).limit(5)
      ]);

      const accs = accsRes.data || [];
      setStats({
        reach: accs.reduce((sum, a) => sum + (a.follower_count || 0), 0),
        accounts: accs.length,
        strategies: stratsRes.count || 0,
        files: filesRes.count || 0,
        needsReviewAccounts: accs.filter(a => a.status === 'captcha_required' || a.status === 'error')
      });
      setActivities(actsRes.data || []);
      setLoading(false);
    }
    load();
  }, [personaId]);

  const handleReconnect = async (acc) => {
    const newPass = prompt(`Please enter the password for ${acc.platform} (@${acc.username}) to reconnect:`);
    if (!newPass) return;
    const { error } = await supabase.from('social_accounts').update({ session_cookie: newPass, status: 'pending_login' }).eq('id', acc.id);
    if (error) alert('Failed to update account: ' + error.message);
    else {
      alert('Account updated. The system will try to connect again.');
      setStats(prev => ({
        ...prev,
        needsReviewAccounts: prev.needsReviewAccounts.filter(a => a.id !== acc.id)
      }));
    }
  };

  if (loading) return <div style={{ color: 'var(--text-3)', fontSize: 12, padding: 16 }}>LOADING PERSONA METRICS...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* KPI Row: Ultra Compact */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        {[
          { label: 'Total Reach', value: stats.reach.toLocaleString() },
          { label: 'Linked Accounts', value: stats.accounts },
          { label: 'Active Strategies', value: stats.strategies },
          { label: 'Content Files', value: stats.files }
        ].map((s, i) => (
          <div key={i} style={{ padding: '12px 16px', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--text-3)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {s.label}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
        {/* Recent Activity */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-2)' }}>Recent Activity</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activities.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--text-3)', textAlign: 'center', fontSize: 11 }}>No recent activity.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activities.map((task, i) => (
                  <div key={task.id} style={{
                    padding: '8px 12px',
                    borderBottom: i < activities.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Activity size={14} color="var(--text-3)" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{task.type || 'Automation Task'}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{new Date(task.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: task.status === 'completed' ? 'var(--green)' : 'var(--text-2)', textTransform: 'uppercase' }}>
                      {task.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Needs Review Widget */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--amber)' }}>Action Center</div>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.needsReviewAccounts && stats.needsReviewAccounts.length > 0 ? (
              stats.needsReviewAccounts.map(acc => (
                <div key={acc.id} style={{ background: 'rgba(245,158,11,0.05)', padding: '12px', borderRadius: 4, border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}>Auth Required</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4, marginBottom: 8 }}>{acc.platform} connection for @{acc.username} needs re-auth.</div>
                  <button onClick={() => handleReconnect(acc)} style={{ width: '100%', fontSize: 11, background: 'var(--amber)', color: '#000', padding: '6px 0', borderRadius: 4, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Fix Connection</button>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-3)', fontSize: 11, textAlign: 'center', padding: '16px 0' }}>All systems nominal.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountsTab({ personaId }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ platform: 'tiktok', username: '', session_cookie: '' });
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('social_accounts').select('*').eq('persona_id', personaId);
    setAccounts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [personaId]);

  const handleSaveAccount = async () => {
    if (!form.username) return alert('Username is required');
    
    const { error } = await supabase.from('social_accounts').insert({
      persona_id: personaId,
      platform: form.platform,
      username: form.username,
      session_cookie: form.session_cookie,
      status: 'active'
    });
    
    if (error) {
      alert('Error saving account: ' + error.message);
    } else {
      setIsModalOpen(false);
      setForm({ platform: 'tiktok', username: '', session_cookie: '' });
      load();
    }
  };

  if (loading) return <div style={{ color: 'var(--text-3)' }}>Loading accounts...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {accounts.map(acc => (
          <div key={acc.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 16px', background: 'var(--bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <PlatformBadge platform={acc.platform} size="sm" />
              <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: acc.status === 'active' ? 'rgba(34,197,94,0.1)' : 'var(--bg-3)', color: acc.status === 'active' ? 'var(--green)' : 'var(--text-3)', textTransform: 'uppercase' }}>
                {acc.status}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>@{acc.username || acc.handle || 'unknown'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                {(acc.follower_count || 0).toLocaleString()} followers
              </div>
            </div>
            <button style={{
              background: 'transparent', border: 'none', color: 'var(--red)',
              padding: '0', alignSelf: 'flex-end', cursor: 'pointer',
              fontSize: '11px', fontWeight: 600
            }}>
              DELETE
            </button>
          </div>
        ))}

        <div 
          onClick={() => setIsModalOpen(true)}
          style={{
          border: '1px dashed var(--border)', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px', gap: '12px', color: 'var(--text-3)', cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <Plus size={16} color="var(--text-3)" />
          <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Link Account</span>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24, backdropFilter: 'blur(8px)' }}>
          <Card className="glass" style={{ width: 480, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 20, margin: 0, fontWeight: 700 }}>Link Social Account</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer' }}>
                <XCircle size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Platform</label>
                <select 
                  value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}
                  style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                >
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Username / Handle</label>
                <input 
                  value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                  placeholder="@username"
                  style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Session Cookie (Optional)</label>
                <textarea 
                  value={form.session_cookie} onChange={e => setForm({...form, session_cookie: e.target.value})}
                  placeholder="Paste your exported Netscape cookies or session token here..."
                  style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, minHeight: 80, resize: 'vertical' }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>Providing a session cookie allows the automation engine to act on your behalf.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 20px', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveAccount} style={{ background: 'var(--accent)', color: 'var(--bg)', border: 'none', padding: '10px 24px', borderRadius: 'var(--radius)', fontWeight: 700, cursor: 'pointer' }}>Save Account</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function StrategiesTab({ personaId }) {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('strategies').select('*').eq('persona_id', personaId);
      setStrategies(data || []);
      setLoading(false);
    }
    load();
  }, [personaId]);

  if (loading) return <div style={{ color: 'var(--text-3)' }}>Loading strategies...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {strategies.map(strat => (
          <Card key={strat.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <PlatformBadge platform={strat.platform} size="sm" />
              <StatusBadge status={strat.status || 'active'} />
            </div>
            <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>{strat.name}</h4>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
              Type: {strat.type}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
              Created: {new Date(strat.created_at).toLocaleDateString()}
            </div>
          </Card>
        ))}
        {strategies.length === 0 && (
          <div style={{ gridColumn: '1 / -1', color: 'var(--text-3)', padding: '24px', textAlign: 'center', background: 'var(--bg-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            No strategies found for this persona.
          </div>
        )}
      </div>
    </div>
  );
}

function ContentTab({ personaId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('content_files').select('*').eq('persona_id', personaId).order('created_at', { ascending: false });
      setFiles(data || []);
      setLoading(false);
    }
    load();

    const channel = supabase.channel(`public:content_files:persona_id=eq.${personaId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'content_files', filter: `persona_id=eq.${personaId}` }, payload => {
        setFiles(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'content_files', filter: `persona_id=eq.${personaId}` }, payload => {
        setFiles(prev => prev.filter(f => f.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [personaId]);

  if (loading) return <div style={{ color: 'var(--text-3)' }}>Loading content...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {files.map(file => {
        let Icon = FileText;
        if (file.type?.includes('image')) Icon = ImageIcon;
        if (file.type?.includes('video')) Icon = Video;
        if (file.type?.includes('audio')) Icon = Music;

        return (
          <Card key={file.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            <div style={{
              width: '100%', aspectRatio: '1', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
            }}>
              {file.url && file.type?.includes('image') ? (
                <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Icon size={32} color="var(--text-3)" />
              )}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {file.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                {file.type} • {file.size ? Math.round(file.size / 1024) + ' KB' : 'Unknown size'}
              </div>
            </div>
          </Card>
        );
      })}
      {files.length === 0 && (
        <div style={{ gridColumn: '1 / -1', color: 'var(--text-3)', padding: '24px', textAlign: 'center', background: 'var(--bg-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          No content files found.
        </div>
      )}
    </div>
  );
}

function SourcesTab({ personaId }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('scraping_sources').select('*').eq('persona_id', personaId);
      setSources(data || []);
      setLoading(false);
    }
    load();
  }, [personaId]);

  if (loading) return <div style={{ color: 'var(--text-3)' }}>Loading sources...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{
          background: 'var(--text)', color: 'var(--bg)', padding: '8px 16px',
          borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Plus size={16} /> Add Source
        </button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-3)' }}>
              <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>Platform</th>
              <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>URL/Query</th>
              <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>Frequency</th>
              <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 500, color: 'var(--text-2)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>
                  No scraping sources found.
                </td>
              </tr>
            ) : (
              sources.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <PlatformBadge platform={s.platform} size="sm" />
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '14px' }}>{s.url || s.query || '-'}</td>
                  <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-3)' }}>{s.frequency || 'Daily'}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <StatusBadge status={s.status || 'active'} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function AnalyticsTab({ personaId }) {
  // Simple follower growth mock
  const [data] = useState(() => 
    Array.from({ length: 7 }).map((_, i) => ({
      day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
      value: Math.floor(Math.random() * 50) + 10
    }))
  );
  
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <Card>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Follower Growth</h3>
        <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>Last 7 days mock data</p>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px', marginTop: '32px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '100%',
              background: 'var(--text)',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              height: `${(d.value / maxVal) * 100}%`,
              minHeight: '4px',
              transition: 'height 0.3s ease'
            }} />
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{d.day}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// === MAIN PAGE COMPONENT ===

export default function PersonaDetail() {
  const { businessId, personaId } = useParams();
  const navigate = useNavigate();
  const businessContext = useBusiness?.();
  const business = businessContext?.business || { name: 'Business', id: businessId };
  
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPersona() {
      const { data } = await supabase.from('personas').select('*').eq('id', personaId).single();
      if (data) setPersona(data);
      setLoading(false);
    }
    fetchPersona();
  }, [personaId]);

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-3)' }}>Loading persona details...</div>;
  }

  if (!persona) {
    return <div style={{ padding: '40px', color: 'var(--red)' }}>Persona not found.</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-3)' }}>
          <Link to={`/b/${businessId}`} style={{ color: 'var(--text-2)' }}>{business.name}</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text)' }}>{persona.name}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: persona.color || 'var(--bg-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px'
            }}>
              {persona.emoji || '👤'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1 style={{ fontSize: '32px', lineHeight: 1 }}>{persona.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: 'var(--text-3)' }}>@{persona.handle?.replace(/^@/, '') || persona.name?.toLowerCase().replace(/\s+/g, '')}</span>
                <StatusBadge status={persona.status || 'active'} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => navigate(`/b/${businessId}/p/${personaId}/edit`)}
              style={{
                background: 'var(--bg-3)', color: 'var(--text)', border: '1px solid var(--border)',
                padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Edit2 size={16} /> Edit Persona
            </button>
            <button 
              style={{
                background: 'var(--bg-3)', color: 'var(--text)', border: '1px solid var(--border)',
                padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Power size={16} /> {persona.status === 'paused' ? 'Activate' : 'Pause'}
            </button>
            <button 
              style={{
                background: 'var(--bg-3)', color: 'var(--red)', border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '14px',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD SECTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '16px' }}>
        
        {/* Left Column: Action Centre & Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <OverviewTab personaId={personaId} />
          
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>Linked Accounts</h2>
            </div>
            <AccountsTab personaId={personaId} />
          </section>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>Recent Output</h2>
            </div>
            <ContentTab personaId={personaId} />
          </section>
        </div>

        {/* Right Column: Live Logs & Strategies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <section style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '16px' }}>Live Logs</h2>
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <LogsPanel inline={true} filterPersona={personaId} />
            </div>
          </section>
          
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>Strategies</h2>
              <button 
                onClick={() => navigate('../strategies')}
                style={{
                  background: 'var(--text)', color: 'var(--bg)', padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Play size={12} fill="currentColor" /> Generate
              </button>
            </div>
            <StrategiesTab personaId={personaId} />
          </section>
        </div>
        
      </div>
    </div>
  );
}
