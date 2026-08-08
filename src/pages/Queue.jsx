import { useState, useEffect } from 'react';
import Card from '../components/Card';
import PlatformBadge from '../components/PlatformBadge';
import { supabase } from '../lib/supabase';
import TaskModal from '../components/TaskModal';
import { Plus, Clock, MoreVertical, Edit2, XCircle, Loader2 } from 'lucide-react';
import { useBusiness } from '../components/BusinessContext';

const statusStyle = {
  scheduled: { color: 'var(--text)', bg: 'rgba(255,255,255,0.1)', label: 'Scheduled' },
  draft: { color: 'var(--text-2)', bg: 'transparent', label: 'Draft', border: '1px solid var(--border)' },
  sent: { color: 'var(--green)', bg: 'rgba(34, 197, 94, 0.1)', label: 'Sent' },
};

const FilterButton = ({ active, label, onClick }) => (
  <button onClick={onClick} style={{
    padding: '8px 16px', borderRadius: '20px',
    background: active ? 'var(--text)' : 'transparent',
    color: active ? 'var(--bg)' : 'var(--text-2)',
    border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`,
    fontSize: 13, fontWeight: 600,
  }}>
    {label}
  </button>
);

export default function Queue() {
  const { business } = useBusiness();
  const [filter, setFilter] = useState('All');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('automation_tasks')
      .select('*, personas!inner(id, name, avatar, color, business_id)')
      .eq('personas.business_id', business.id)
      .order('scheduled_for', { ascending: true });
      
    if (error) {
      console.error(error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const { error } = await supabase.from('automation_tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert("Error deleting task: " + err.message);
    }
  };

  const filteredQueue = tasks.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Drafts') return item.status === 'draft';
    return item.platform.toLowerCase() === filter.toLowerCase();
  });

  const groupedQueue = filteredQueue.reduce((acc, item) => {
    const d = new Date(item.scheduled_for);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dayLabel = "";
    if (d.toDateString() === today.toDateString()) {
      dayLabel = "Today";
    } else if (d.toDateString() === tomorrow.toDateString()) {
      dayLabel = "Tomorrow";
    } else {
      dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    if (!acc[dayLabel]) acc[dayLabel] = [];
    acc[dayLabel].push(item);
    return acc;
  }, {});

  return (
    <div style={{ padding: '36px 32px', width: '100%', maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>Timeline</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6, fontWeight: 500 }}>
            {loading ? 'Loading...' : `${filteredQueue.length} posts scheduled`}
          </p>
        </div>
        <button 
          onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--text)', color: 'var(--bg)', 
            padding: '10px 20px', borderRadius: 'var(--radius)',
            fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer'
          }}
        >
          <Plus size={18} /> New Post
        </button>
      </div>

      {/* Interactive Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 40, overflowX: 'auto', paddingBottom: 8 }}>
        <FilterButton active={filter === 'All'} label="All" onClick={() => setFilter('All')} />
        <FilterButton active={filter === 'TikTok'} label="TikTok" onClick={() => setFilter('TikTok')} />
        <FilterButton active={filter === 'Instagram'} label="Instagram" onClick={() => setFilter('Instagram')} />
        <FilterButton active={filter === 'YouTube'} label="YouTube" onClick={() => setFilter('YouTube')} />
        <FilterButton active={filter === 'Drafts'} label="Drafts" onClick={() => setFilter('Drafts')} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 className="spin" size={32} color="var(--text-3)" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, paddingLeft: 12 }}>
          {Object.entries(groupedQueue).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 15 }}>
              No scheduled posts found. Click "New Post" to add one.
            </div>
          ) : (
            Object.entries(groupedQueue).map(([day, items]) => (
              <div key={day} style={{ position: 'relative' }}>
                {/* Day Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, marginLeft: -12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--text)' }} />
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{day}</h2>
                </div>
                
                {/* Timeline Line */}
                <div style={{ position: 'absolute', top: 24, bottom: -40, left: -7, width: 1, background: 'var(--border)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginLeft: 24 }}>
                  {items.map(item => {
                    const p = item.personas || { name: 'Unknown', avatar: '?', color: '#555' };
                    const s = statusStyle[item.status] || statusStyle.draft;
                    const timeStr = new Date(item.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <Card key={item.id} className="glass queue-card" style={{ padding: '16px 20px', position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* Connector line dot */}
                        <div className="connector-line" style={{ position: 'absolute', left: -34, top: 32, width: 7, height: 7, borderRadius: '50%', background: 'var(--border-light)' }} />

                        {/* Drag handle (visual only for now) */}
                        <div className="drag-handle" style={{ cursor: 'grab', color: 'var(--border-light)' }}>
                          <MoreVertical size={20} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: p.color + '22',
                            border: `1px solid ${p.color}55`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700, color: p.color, flexShrink: 0,
                          }}>
                            {p.avatar}
                          </div>

                          <PlatformBadge platform={item.platform} size="lg" />

                          <div style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{item.content}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>
                              <span style={{ color: 'var(--text-2)' }}>{p.name}</span> • {item.type}
                            </div>
                          </div>
                        </div>

                        <div className="queue-actions" style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>
                            <Clock size={14} />
                            {timeStr}
                          </div>
                          <div style={{
                            padding: '6px 12px', borderRadius: 24,
                            background: s.bg, color: s.color, border: s.border || 'none',
                            fontSize: 12, fontWeight: 600,
                            minWidth: 90, textAlign: 'center'
                          }}>
                            {s.label}
                          </div>
                          <div style={{ display: 'flex', gap: 8, color: 'var(--text-3)' }}>
                            <button onClick={() => { setEditingTask(item); setIsModalOpen(true); }} style={{ background: 'transparent', color: 'var(--text-3)', border: 'none', cursor: 'pointer', padding: 4 }}><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(item.id)} style={{ background: 'transparent', color: 'var(--red)', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.8 }}><XCircle size={16} /></button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }} 
        initialData={editingTask}
        onSuccess={fetchTasks}
      />

      <style>{`
        @media (max-width: 768px) {
          .queue-card { flex-direction: column !important; align-items: flex-start !important; }
          .queue-actions { width: 100%; justify-content: space-between; margin-top: 12px; }
          .connector-line, .drag-handle { display: none !important; }
        }
      `}</style>
    </div>
  );
}
