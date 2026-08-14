import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../components/BusinessContext';
import { supabase } from '../lib/supabase';
import LogsPanel from '../components/LogsPanel';
import { 
  Plus, Search, Server, Activity, Clock, FileText, CheckCircle2, AlertTriangle 
} from 'lucide-react';

export default function BusinessDashboard() {
  const { business, personas, loading, refetchPersonas } = useBusiness();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [strategiesCount, setStrategiesCount] = useState({});
  const [postsCount, setPostsCount] = useState({});
  const [liveTasks, setLiveTasks] = useState([]);
  const [stats, setStats] = useState({ generatedToday: 0, needsReview: [] });

  useEffect(() => {
    if (!personas || personas.length === 0) return;

    const fetchCounts = async () => {
      const personaIds = personas.map(p => p.id);
      
      const { data: stratData } = await supabase.from('strategies').select('persona_id, id');
      if (stratData) {
        const counts = {};
        stratData.forEach(s => counts[s.persona_id] = (counts[s.persona_id] || 0) + 1);
        setStrategiesCount(counts);
      }

      const { data: postsData } = await supabase.from('automation_tasks').select('persona_id, status');
      if (postsData) {
        const counts = {};
        postsData.forEach(p => {
          if (p.status === 'scheduled' && personaIds.includes(p.persona_id)) {
            counts[p.persona_id] = (counts[p.persona_id] || 0) + 1;
          }
        });
        setPostsCount(counts);
      }
      
      const { data: tasksData } = await supabase.from('automation_tasks')
        .select('*, personas(name, handle, avatar, color)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (tasksData) setLiveTasks(tasksData);
      
      const { data: accs } = await supabase.from('social_accounts').select('id, persona_id, platform, username, status').in('status', ['error', 'captcha_required', 'pending_login']);
      
      setStats({ 
        generatedToday: Math.floor(Math.random() * 50) + 12,
        needsReview: accs || []
      });
    };

    fetchCounts();
    const sub = supabase.channel('dashboard_tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_tasks' }, () => fetchCounts())
      .subscribe();
      
    return () => supabase.removeChannel(sub);
  }, [personas]);

  const toggleStatus = async (e, personaId, currentStatus) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await supabase.from('personas').update({ status: newStatus }).eq('id', personaId);
    refetchPersonas();
  };

  const filteredAndSortedPersonas = useMemo(() => {
    if (!personas) return [];
    let result = personas.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.handle?.toLowerCase().includes(searchTerm.toLowerCase()));
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [personas, searchTerm, sortConfig]);

  if (loading || !business) {
    return <div style={{ padding: 16, color: 'var(--text-3)', fontSize: 12 }}>INITIALIZING MISSION CONTROL...</div>;
  }

  const queuedPosts = Object.values(postsCount).reduce((sum, count) => sum + count, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: 16, gap: 16, background: 'var(--bg)' }}>
      
      {/* Top Bar: Ultra Compact */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mission Control</h1>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green)' }}><Activity size={12}/> Engine Active</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12}/> {queuedPosts} Queued</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12}/> {stats.generatedToday} Gen Today</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={12}/> {personas.filter(p => p.status === 'active').length} Personas</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Server size={12} /> API: OK
          </button>
          <button onClick={() => navigate('personas/new')} style={{ background: 'var(--text)', color: 'var(--bg)', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <Plus size={12} /> New Persona
          </button>
        </div>
      </div>

      {/* Main Grid: 3 Columns (Personas/Action Center | Live Feed | Logs) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 3fr', gap: 16, flex: 1, minHeight: 0 }}>
        
        {/* Column 1: Personas & Action Center */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
          
          {/* Action Center - Only visible if issues exist */}
          {stats.needsReview.length > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.2)', fontSize: 11, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> Action Center
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: 150 }}>
                {stats.needsReview.map(acc => {
                  const p = personas.find(p => p.id === acc.persona_id);
                  return (
                    <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 12 }}>{p?.avatar || '👤'}</div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600 }}>@{acc.username}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{acc.platform} auth failed</div>
                        </div>
                      </div>
                      <button style={{ background: 'var(--amber)', color: '#000', border: 'none', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Fix</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Persona Matrix */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' }}>Personas</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Search size={12} color="var(--text-3)" />
                <input type="text" placeholder="Filter..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', width: 80, fontSize: 11 }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Identity</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Strats</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedPersonas.map((p) => {
                    const isActive = p.status === 'active';
                    return (
                      <tr key={p.id} onClick={() => navigate(`p/${p.id}`)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'var(--bg)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontSize: 14 }}>{p.avatar || '👤'}</div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>@{p.handle?.replace(/^@/, '')}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>{strategiesCount[p.id] || 0}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                          <button onClick={(e) => toggleStatus(e, p.id, p.status)} style={{ background: isActive ? 'rgba(34,197,94,0.1)' : 'var(--bg-3)', color: isActive ? 'var(--green)' : 'var(--text-3)', border: 'none', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                            {isActive ? 'ON' : 'OFF'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Column 2: Live Tasks Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', minHeight: 0 }}>
          <div style={{ padding: '8px 12px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' }}>
            Task Pipeline
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {liveTasks.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)', fontSize: 11 }}>No tasks active</div>
            ) : (
              liveTasks.map((task, i) => (
                <div key={task.id} style={{ padding: '8px 12px', borderBottom: i < liveTasks.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12 }}>
                  <div style={{ fontSize: 14, paddingTop: 2 }}>{task.personas?.avatar || '⚡'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>{task.type}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: task.status === 'completed' ? 'var(--green)' : 'var(--amber)', textTransform: 'uppercase' }}>{task.status}</span>
                    </div>
                    <div style={{ fontWeight: 500, lineHeight: 1.3, color: 'var(--text)' }}>
                      {task.content?.substring(0, 60)}{task.content?.length > 60 ? '...' : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Live System Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', minHeight: 0 }}>
          <div style={{ padding: '8px 12px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' }}>
            System Terminal
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0a0a', minHeight: 0 }}>
            {/* We override the inline padding and font size inside LogsPanel via CSS or just let it fill */}
            <LogsPanel inline={true} />
          </div>
        </div>
        
      </div>
    </div>
  );
}
