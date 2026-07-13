import { useState } from 'react';
import Card from '../components/Card';
import PlatformBadge from '../components/PlatformBadge';
import { personas, queueData } from '../data/mockData';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// Let's generate a 5-week month starting on a Monday. 
// "Today" is Day 12.
const daysInMonth = Array.from({ length: 35 }, (_, i) => i + 1);

export default function Calendar() {
  const [hoveredEvent, setHoveredEvent] = useState(null);

  const getPersona = (id) => personas.find(p => p.id === id);

  return (
    <div style={{ padding: '32px', width: '100%', maxWidth: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>Planner</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>Monthly overview of your scheduled content.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button style={{ background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px' }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', minWidth: '120px', textAlign: 'center' }}>
            October 2026
          </div>
          <button style={{ background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px' }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <Card className="glass" style={{ padding: 0, overflow: 'visible' }}>
        {/* Days Header */}
        <div className="calendar-header">
          {daysOfWeek.map(d => (
            <div key={d} style={{ padding: '16px', fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textAlign: 'center', textTransform: 'uppercase' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {daysInMonth.map((day, index) => {
            const isToday = day === 12; // Arbitrary "today" based on mockData
            const dayEvents = queueData.filter(q => q.scheduled === day.toString());
            const isEmpty = dayEvents.length === 0;

            return (
              <div key={day} className={`calendar-cell ${isEmpty ? 'empty' : ''} ${isToday ? 'today' : ''}`} style={{
                borderRight: (index + 1) % 7 === 0 ? 'none' : '1px solid var(--border)',
                borderBottom: index >= 28 ? 'none' : '1px solid var(--border)',
                padding: '12px',
                background: isToday ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                position: 'relative'
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isToday ? 'var(--text)' : 'transparent',
                  color: isToday ? 'var(--bg)' : 'var(--text-3)',
                  fontSize: 12, fontWeight: 700, marginBottom: 8
                }}>
                  {day}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayEvents.map(evt => {
                    const p = getPersona(evt.personaId);
                    return (
                      <a
                        href={`https://${evt.platform}.com/`}
                        target="_blank"
                        rel="noreferrer"
                        key={evt.id}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredEvent({ evt, p, x: rect.left + rect.width / 2, y: rect.top });
                        }}
                        onMouseLeave={() => setHoveredEvent(null)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '4px 8px', borderRadius: '4px',
                          background: 'var(--bg-4)', border: '1px solid var(--border)',
                          cursor: 'pointer', textDecoration: 'none'
                        }}
                      >
                        <div style={{ width: 14, height: 14, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>
                          {p.avatar}
                        </div>
                        <PlatformBadge platform={evt.platform} size="sm" />
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-2)' }}>{evt.time.split(' ')[0]}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Floating Hover Card */}
      {hoveredEvent && (
        <div style={{
          position: 'fixed',
          top: hoveredEvent.y - 10,
          left: hoveredEvent.x,
          transform: 'translate(-50%, -100%)',
          background: '#1a1a1a', // Solid background instead of transparent
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          width: 260,
          boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
          zIndex: 1000,
          pointerEvents: 'none',
        }}>
          {/* Arrow */}
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
            width: 10, height: 10, background: '#1a1a1a', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)'
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: hoveredEvent.p.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: hoveredEvent.p.color }}>
              {hoveredEvent.p.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{hoveredEvent.p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{hoveredEvent.evt.platform}</div>
            </div>
            <PlatformBadge platform={hoveredEvent.evt.platform} />
          </div>

          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4, marginBottom: 12 }}>
            "{hoveredEvent.evt.content}"
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontSize: 12, fontWeight: 500 }}>
              <Clock size={14} />
              {hoveredEvent.evt.time}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
              color: hoveredEvent.evt.status === 'scheduled' ? 'var(--text)' : 'var(--text-3)',
              background: hoveredEvent.evt.status === 'scheduled' ? 'rgba(255,255,255,0.1)' : 'transparent',
              padding: '4px 8px', borderRadius: '4px'
            }}>
              {hoveredEvent.evt.status}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .calendar-header { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid var(--border); background: var(--bg-3); }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(120px, auto); }
        
        @media (max-width: 768px) {
          .calendar-header { display: none !important; }
          .calendar-grid { grid-template-columns: 1fr !important; grid-auto-rows: auto !important; }
          .calendar-cell { min-height: 80px; border-right: none !important; border-bottom: 1px solid var(--border) !important; }
          /* Only show cells that have content or are today */
          .calendar-cell.empty:not(.today) { display: none !important; }
        }
      `}</style>
    </div>
  );
}
