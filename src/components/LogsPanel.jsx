import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { X, Search, Activity, Loader2 } from 'lucide-react';

export default function LogsPanel({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [filterPersona, setFilterPersona] = useState('all');
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    // Fetch Personas for the filter dropdown
    const fetchPersonas = async () => {
      const { data } = await supabase.from('personas').select('id, name');
      if (data) setPersonas(data);
    };
    fetchPersonas();

    // Fetch initial logs
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('logs')
        .select('*, personas(name, color)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) {
        setLogs(data.reverse()); // Show oldest first so newest is at the bottom
      }
      setLoading(false);
      scrollToBottom();
    };
    fetchLogs();

    // Subscribe to new logs
    const subscription = supabase
      .channel('public:logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, async (payload) => {
        // Fetch the related persona info for the new log
        const { data: pData } = await supabase.from('personas').select('name, color').eq('id', payload.new.persona_id).single();
        const newLog = { ...payload.new, personas: pData };
        setLogs(prev => [...prev, newLog]);
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const filteredLogs = filterPersona === 'all' 
    ? logs 
    : logs.filter(l => l.persona_id === filterPersona);

  return (
    <div style={{
      width: 400, flexShrink: 0,
      height: '100vh', position: 'sticky', top: 0,
      background: 'var(--bg)', borderLeft: '1px solid var(--border)',
      zIndex: 100, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{
        padding: '24px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Activity size={20} color="var(--text)" />
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Live Logs</h2>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        <select 
          value={filterPersona} 
          onChange={(e) => setFilterPersona(e.target.value)}
          style={{ 
            width: '100%', padding: '10px 16px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
            outline: 'none', fontSize: 13, fontWeight: 600
          }}
        >
          <option value="all">All Personas</option>
          {personas.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40, color: 'var(--text-3)' }}>
            <Loader2 size={24} className="spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, marginTop: 40 }}>
            No logs available.
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} style={{ display: 'flex', gap: 12 }}>
              <div style={{ 
                width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                background: log.level === 'error' ? 'var(--red)' : (log.personas?.color || 'var(--text-3)')
              }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{log.personas?.name || 'System'}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                  {log.message}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
