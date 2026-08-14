import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../components/BusinessContext';
import { supabase } from '../lib/supabase';
import PlatformBadge from '../components/PlatformBadge';
import Card from '../components/Card';
import LogsPanel from '../components/LogsPanel';
import { 
  Plus, Search, Edit2, Eye, Trash2, ChevronUp, ChevronDown, 
  Server, Activity, Clock, FileText, CheckCircle2, Play, Pause
} from 'lucide-react';

export default function BusinessDashboard() {
  const { business, personas, loading, refetchPersonas } = useBusiness();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [strategiesCount, setStrategiesCount] = useState({});
  const [postsCount, setPostsCount] = useState({});
  const [liveTasks, setLiveTasks] = useState([]);
  const [stats, setStats] = useState({ generatedToday: 0 });

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
      
      // Fetch live tasks for feed
      const { data: tasksData } = await supabase.from('automation_tasks')
        .select('*, personas(name, handle, avatar, color)')
        .order('created_at', { ascending: false })
        .limit(10);
      if (tasksData) setLiveTasks(tasksData);
      
      // Mock generated today count
      setStats({ generatedToday: Math.floor(Math.random() * 50) + 12 });
    };

    fetchCounts();
    
    // Subscribe to realtime updates for automation_tasks
    const sub = supabase.channel('dashboard_tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'automation_tasks' }, () => {
        fetchCounts();
      }).subscribe();
      
    return () => supabase.removeChannel(sub);
  }, [personas]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

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
    return <div style={{ padding: 32, color: 'var(--text-2)' }}>Loading Mission Control...</div>;
  }

  const queuedPosts = Object.values(postsCount).reduce((sum, count) => sum + count, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', height: '100%', overflow: 'hidden' }}>
      <div className="custom-scroll" style={{ padding: 32, overflowY: 'auto', background: 'var(--bg)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Mission Control</h1>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Autonomous Content Engine Monitoring Dashboard</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{ background: 'var(--bg-3)', color: 'var(--text)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)' }}>
              <Server size={18} /> Groq API: Online
            </button>
            <button onClick={() => navigate('personas/new')} style={{ background: 'var(--text)', color: 'var(--bg)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)' }}>
              <Plus size={18} /> New Persona
            </button>
          </div>
        </div>

        {/* System Health */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <Card className="glass" style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--green)', marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={16} /></div>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Engine Status</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)' }}>ACTIVE</div>
          </Card>
          
          <Card className="glass" style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={16} /></div>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Global Queue</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Space Grotesk' }}>{queuedPosts}</div>
          </Card>
          
          <Card className="glass" style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={16} /></div>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Generated Today</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Space Grotesk' }}>{stats.generatedToday}</div>
          </Card>
          
          <Card className="glass" style={{ padding: '24px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-3)', marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} /></div>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Active Personas</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Space Grotesk' }}>{personas.filter(p => p.status === 'active').length}</div>
          </Card>
        </div>
        
        {/* Live Feed, Matrix, Logs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          
          {/* Live Feed */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Live Generation Feed</h2>
            <Card className="glass" style={{ padding: 0, overflow: 'hidden' }}>
              {liveTasks.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>No tasks in queue.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {liveTasks.map((task, i) => (
                    <div key={task.id} style={{ padding: '16px 20px', borderBottom: i < liveTasks.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: task.personas?.color + '22' || 'var(--bg-3)', color: task.personas?.color || 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {task.personas?.avatar || '👤'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 2 }}>@{task.personas?.handle || 'persona'} • {task.type}</div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{task.content.substring(0, 50)}{task.content.length > 50 ? '...' : ''}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: task.status === 'completed' ? 'var(--green)' : 'var(--amber)', background: task.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase' }}>
                        {task.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Persona Matrix */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Persona Health Matrix</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-3)', padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)' }}>
                <Search size={14} color="var(--text-3)" />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', width: 120, fontSize: 12 }} />
              </div>
            </div>
            
            <Card className="glass" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-2)' }}>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Persona</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Strategies</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedPersonas.map((persona) => {
                    const isActive = persona.status === 'active';
                    return (
                      <tr key={persona.id} onClick={() => navigate(`p/${persona.id}`)} className="table-row-interactive" style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: persona.color + '22' || 'var(--bg-4)', color: persona.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                              {persona.avatar || '👤'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{persona.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>@{persona.handle?.replace(/^@/, '')}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 600 }}>{strategiesCount[persona.id] || 0}</td>
                        <td style={{ padding: '16px' }}>
                          <button onClick={(e) => toggleStatus(e, persona.id, persona.status)} style={{ background: isActive ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-4)', color: isActive ? 'var(--green)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: '12px', fontSize: 11, fontWeight: 700, border: `1px solid ${isActive ? 'rgba(34, 197, 94, 0.2)' : 'var(--border)'}` }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                            {isActive ? 'Active' : 'Paused'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Live Logs */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Live System Logs</h2>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <LogsPanel inline={true} />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
