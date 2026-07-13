import { useState, useEffect } from 'react';
import Card from '../components/Card';
import PlatformBadge from '../components/PlatformBadge';
import StatusBadge from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import { Users, Wifi, Send, TrendingUp, Clock, Plus, Link, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

const TopKPI = ({ label, value, sub }) => (
  <div style={{ padding: '16px 24px', borderRight: '1px solid var(--border)', flex: 1 }}>
    <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginTop: 8, fontFamily: 'Space Grotesk', letterSpacing: '-1px' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, fontWeight: 500 }}>{sub}</div>}
  </div>
);

export default function Dashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [allPersonas, setAllPersonas] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('all');
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const { data: bData } = await supabase.from('businesses').select('*');
      if (bData) setBusinesses(bData);
      
      const { data: pData } = await supabase.from('personas').select('*, social_accounts(*)');
      if (pData) setAllPersonas(pData);

      const { data: tData } = await supabase.from('automation_tasks').select('*, personas(name, color)').order('scheduled_for', { ascending: true }).limit(5);
      if (tData) setTasks(tData);

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const { data: aData } = await supabase.from('analytics_history').select('*').gte('date', lastWeek.toISOString());
      if (aData) setAnalytics(aData);
    };
    fetchData();
  }, []);

  const filteredPersonas = selectedBusiness === 'all' 
    ? allPersonas 
    : allPersonas.filter(p => p.business_id === selectedBusiness);

  const stats = {
    totalPersonas: filteredPersonas.length,
    activePersonas: filteredPersonas.filter(p => p.status === 'active').length,
    totalAccounts: filteredPersonas.reduce((acc, p) => acc + (p.social_accounts?.length || 0), 0),
    activeAccounts: filteredPersonas.reduce((acc, p) => acc + (p.social_accounts?.filter(a => a.status === 'active').length || 0), 0),
    postsToday: 0,
    queuedPosts: tasks.length
  };

  const weekData = Array(7).fill(0);
  analytics.forEach(row => {
    const d = new Date(row.date);
    const today = new Date();
    const diffDays = Math.floor(Math.abs(today - d) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      weekData[6 - diffDays] += parseInt(row.followers || 0);
    }
  });
  const max = Math.max(...weekData) || 1;

  return (
    <div style={{ padding: '32px', width: '100%', maxWidth: '100%' }}>
      
      {/* Header & Quick Actions */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>Network status and high-level activity.</p>
          
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button 
              onClick={() => setSelectedBusiness('all')}
              style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: selectedBusiness === 'all' ? 'var(--text)' : 'transparent', color: selectedBusiness === 'all' ? 'var(--bg)' : 'var(--text-2)', transition: 'all 0.2s' }}
            >
              All Projects
            </button>
            {businesses.map(b => (
              <button 
                key={b.id}
                onClick={() => setSelectedBusiness(b.id)}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: selectedBusiness === b.id ? 'var(--text)' : 'transparent', color: selectedBusiness === b.id ? 'var(--bg)' : 'var(--text-2)', transition: 'all 0.2s' }}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
            background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            color: 'var(--text)', fontSize: 13, fontWeight: 600,
          }}>
            <Link size={14} /> Connect
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
            background: 'var(--text)', border: 'none', borderRadius: 'var(--radius-sm)',
            color: 'var(--bg)', fontSize: 13, fontWeight: 700,
          }}>
            <Plus size={14} /> New Post
          </button>
        </div>
      </div>

      {/* Condensed Top KPI Strip */}
      <Card className="glass" style={{ padding: 0, marginBottom: 24, display: 'flex', overflow: 'hidden' }}>
        <TopKPI label="Personas" value={stats.totalPersonas} sub={`${stats.activePersonas} active`} />
        <TopKPI label="Accounts" value={stats.totalAccounts} sub={`${stats.activeAccounts} live connections`} />
        <TopKPI label="Posts Today" value={stats.postsToday} sub="Across all platforms" />
        <TopKPI label="Queued" value={stats.queuedPosts} sub="Ready for dispatch" />
        <div style={{ padding: '16px 24px', flex: 1.5, display: 'flex', flexDirection: 'column' }}>
           <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Network Reach (7d)</div>
           <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flex: 1, marginTop: 8 }}>
             {weekData.map((val, i) => (
               <div key={i} style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                 <div style={{ width: '100%', background: i === 6 ? 'var(--text)' : 'var(--bg-4)', borderRadius: 2, height: `${(val / max) * 100}%` }} />
               </div>
             ))}
           </div>
        </div>
      </Card>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        
        {/* Left Column: Account Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card className="glass" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.5px' }}>Account Matrix</div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Direct links and status for all connected accounts.</p>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-3)' }}>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Persona</th>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Connected Profiles</th>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Total Reach</th>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersonas.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: p.color + '22', border: `1px solid ${p.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: p.color }}>{p.avatar}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, fontWeight: 500 }}>
                            Promoting: {businesses.find(b => b.id === p.business_id)?.name || 'Unknown'} {p.niche && `· ${p.niche}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {(p.social_accounts || []).map((acc, i) => (
                          <a 
                            key={i} 
                            href={`https://${acc.platform}.com/${acc.username}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            title={`${acc.username} (${acc.followers?.toLocaleString() || 0} followers)`}
                            style={{ opacity: acc.status === 'paused' ? 0.5 : 1, transition: 'opacity 0.2s' }}
                          >
                            <PlatformBadge platform={acc.platform} size="lg" />
                          </a>
                        ))}
                        {(!p.social_accounts || p.social_accounts.length === 0) && (
                          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No accounts</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>0</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <StatusBadge status={p.status} />
                        <a href={`/personas/${p.id}/edit`} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 12, transition: 'all 0.2s' }}>Edit</a>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPersonas.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>No personas created for this business yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Right Column: Up Next & Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Up Next Widget */}
          <Card className="glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.5px' }}>Pipeline (Next 24h)</div>
              <a href="/queue" style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>Manage →</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tasks.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13, background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
                  No tasks scheduled.
                </div>
              ) : tasks.map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <Clock size={16} color="var(--text-2)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{task.content}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                      {task.personas?.name} · {task.platform}
                    </div>
                  </div>
                  <button style={{ fontSize: 12, fontWeight: 600, color: 'var(--bg)', background: 'var(--text)', padding: '6px 12px', borderRadius: 4 }}>Edit</button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="glass" style={{ padding: '24px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: 'var(--text)', letterSpacing: '0.5px' }}>Activity Log</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No recent activity to show.</div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
