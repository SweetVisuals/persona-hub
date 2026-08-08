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
  Link as LinkIcon, BarChart2, Activity, Play 
} from 'lucide-react';

// === SUB-COMPONENTS ===

function OverviewTab({ personaId }) {
  const [stats, setStats] = useState({ reach: 0, accounts: 0, strategies: 0, files: 0 });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Parallel fetches for speed
      const [accsRes, stratsRes, filesRes, actsRes] = await Promise.all([
        supabase.from('social_accounts').select('follower_count').eq('persona_id', personaId),
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
      });
      setActivities(actsRes.data || []);
      setLoading(false);
    }
    load();
  }, [personaId]);

  if (loading) return <div style={{ color: 'var(--text-3)' }}>Loading overview...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Reach', value: stats.reach.toLocaleString() },
          { label: 'Linked Accounts', value: stats.accounts },
          { label: 'Active Strategies', value: stats.strategies },
          { label: 'Content Files', value: stats.files }
        ].map((s, i) => (
          <Card key={i} style={{ padding: '20px' }}>
            <div style={{ color: 'var(--text-3)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '24px', fontFamily: '"Space Grotesk", sans-serif' }}>
              {s.value}
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Recent Activity</h3>
        <Card style={{ padding: '0' }}>
          {activities.length === 0 ? (
            <div style={{ padding: '24px', color: 'var(--text-3)' }}>No recent activity.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activities.map((task, i) => (
                <div key={task.id} style={{
                  padding: '16px 24px',
                  borderBottom: i < activities.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Activity size={16} color="var(--text-3)" />
                    <span style={{ fontSize: '14px' }}>{task.type || 'Automation Task'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <StatusBadge status={task.status} />
                    <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function AccountsTab({ personaId }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('social_accounts').select('*').eq('persona_id', personaId);
      setAccounts(data || []);
      setLoading(false);
    }
    load();
  }, [personaId]);

  if (loading) return <div style={{ color: 'var(--text-3)' }}>Loading accounts...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
      {accounts.map(acc => (
        <Card key={acc.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <PlatformBadge platform={acc.platform} size="lg" />
            <StatusBadge status={acc.status || 'active'} />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>@{acc.username || acc.handle || 'unknown'}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-3)', marginTop: '4px' }}>
              {(acc.follower_count || 0).toLocaleString()} followers
            </div>
          </div>
          <button style={{
            background: 'transparent', border: '1px solid var(--border)', color: 'var(--red)',
            padding: '8px', borderRadius: 'var(--radius-sm)', alignSelf: 'flex-start',
            fontSize: '12px'
          }}>
            Delete
          </button>
        </Card>
      ))}

      <div style={{
        border: '1px dashed var(--border-light)', borderRadius: 'var(--radius)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px', gap: '12px', color: 'var(--text-3)', cursor: 'pointer'
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={20} color="var(--text)" />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>Add Account</span>
      </div>
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
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => navigate('../strategies')} style={{
          background: 'var(--text)', color: 'var(--bg)', padding: '8px 16px',
          borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Plus size={16} /> Create Strategy
        </button>
      </div>

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
      const { data } = await supabase.from('content_files').select('*').eq('persona_id', personaId);
      setFiles(data || []);
      setLoading(false);
    }
    load();
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
  // We use optional chaining for useBusiness in case it's not implemented yet
  const businessContext = useBusiness?.();
  const business = businessContext?.business || { name: 'Business', id: businessId };
  
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

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

  const tabs = ['Overview', 'Accounts', 'Strategies', 'Content', 'Sources', 'Analytics'];

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
                <span style={{ color: 'var(--text-3)' }}>@{persona.handle || persona.name?.toLowerCase().replace(/\s+/g, '')}</span>
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

      {/* TABS BAR */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border)' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'transparent',
              padding: '12px 0',
              fontSize: '15px',
              fontWeight: 500,
              color: activeTab === tab ? 'var(--text)' : 'var(--text-3)',
              borderBottom: activeTab === tab ? '2px solid var(--text)' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div>
        {activeTab === 'Overview' && <OverviewTab personaId={personaId} />}
        {activeTab === 'Accounts' && <AccountsTab personaId={personaId} />}
        {activeTab === 'Strategies' && <StrategiesTab personaId={personaId} />}
        {activeTab === 'Content' && <ContentTab personaId={personaId} />}
        {activeTab === 'Sources' && <SourcesTab personaId={personaId} />}
        {activeTab === 'Analytics' && <AnalyticsTab personaId={personaId} />}
      </div>
    </div>
  );
}
