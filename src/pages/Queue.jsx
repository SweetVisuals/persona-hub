import { useState } from 'react';
import Card from '../components/Card';
import PlatformBadge from '../components/PlatformBadge';
import { personas, queueData } from '../data/mockData';
import { Plus, Clock, MoreVertical, Edit2, XCircle } from 'lucide-react';
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
  const [filter, setFilter] = useState('All');
  
  const getPersona = (id) => personas.find(p => p.id === id);

  const filteredQueue = queueData.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Drafts') return item.status === 'draft';
    return item.platform.toLowerCase() === filter.toLowerCase();
  });

  const groupedQueue = filteredQueue.reduce((acc, item) => {
    let dayLabel = "Upcoming";
    if (item.scheduled === '12') dayLabel = "Today";
    else if (item.scheduled === '13') dayLabel = "Tomorrow";
    else dayLabel = `Day ${item.scheduled}`;
    
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
            {filteredQueue.length} posts scheduled
          </p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--text)', color: 'var(--bg)', 
          padding: '10px 20px', borderRadius: 'var(--radius)',
          fontSize: 14, fontWeight: 600
        }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40, paddingLeft: 12 }}>
        {Object.entries(groupedQueue).map(([day, items]) => (
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
                const p = getPersona(item.personaId);
                const s = statusStyle[item.status];
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
                        {item.time}
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
                        <button style={{ background: 'transparent', color: 'var(--text-3)', border: 'none' }}><Edit2 size={16} /></button>
                        <button style={{ background: 'transparent', color: 'var(--text-3)', border: 'none' }}><XCircle size={16} /></button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

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
