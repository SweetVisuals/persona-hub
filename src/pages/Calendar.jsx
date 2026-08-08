import { useState, useEffect } from 'react';
import Card from '../components/Card';
import PlatformBadge from '../components/PlatformBadge';
import { supabase } from '../lib/supabase';
import TaskModal from '../components/TaskModal';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { useBusiness } from '../components/BusinessContext';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const { business } = useBusiness();
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTasks = async () => {
    // Get start and end of current month to filter tasks
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    const { data, error } = await supabase
      .from('automation_tasks')
      .select('*, personas!inner(id, name, avatar, color, business_id)')
      .eq('personas.business_id', business.id)
      .gte('scheduled_for', startOfMonth.toISOString())
      .lte('scheduled_for', endOfMonth.toISOString());
      
    if (!error && data) {
      setTasks(data);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate calendar grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const calendarDays = [];
  // Padding for start of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }
  // Padding for end of month (to make grid 35 or 42 cells depending on need, we'll just fill out the last row)
  const totalCells = Math.ceil(calendarDays.length / 7) * 7;
  while (calendarDays.length < totalCells) {
    calendarDays.push(null);
  }

  const todayDate = new Date();
  const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month;
  const todayDay = isCurrentMonth ? todayDate.getDate() : null;

  return (
    <div style={{ padding: '32px', width: '100%', maxWidth: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>Planner</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>Monthly overview of your scheduled content.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--text)', color: 'var(--bg)', 
              padding: '8px 16px', borderRadius: 'var(--radius)',
              fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              marginRight: 16
            }}
          >
            <Plus size={18} /> New Post
          </button>
          
          <button onClick={prevMonth} style={{ background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', minWidth: '150px', textAlign: 'center' }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={nextMonth} style={{ background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
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
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="calendar-cell empty" style={{ borderRight: (index + 1) % 7 === 0 ? 'none' : '1px solid var(--border)', borderBottom: index >= totalCells - 7 ? 'none' : '1px solid var(--border)', padding: '12px', background: 'transparent' }} />;
            }
            
            const isToday = day === todayDay;
            // Find tasks for this day
            const dayEvents = tasks.filter(t => {
               const d = new Date(t.scheduled_for);
               return d.getDate() === day;
            });
            const isEmpty = dayEvents.length === 0;

            return (
              <div key={day} className={`calendar-cell ${isEmpty ? 'empty' : ''} ${isToday ? 'today' : ''}`} style={{
                borderRight: (index + 1) % 7 === 0 ? 'none' : '1px solid var(--border)',
                borderBottom: index >= totalCells - 7 ? 'none' : '1px solid var(--border)',
                padding: '12px',
                background: isToday ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                position: 'relative',
                minHeight: '120px'
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
                    const p = evt.personas || { name: 'Unknown', avatar: '?', color: '#555' };
                    const timeStr = new Date(evt.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={evt.id}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredEvent({ evt, p, timeStr, x: rect.left + rect.width / 2, y: rect.top });
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
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{timeStr}</span>
                      </div>
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
          background: '#1a1a1a', 
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
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>{hoveredEvent.evt.platform}</div>
            </div>
            <PlatformBadge platform={hoveredEvent.evt.platform} />
          </div>

          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4, marginBottom: 12 }}>
            "{hoveredEvent.evt.content}"
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontSize: 12, fontWeight: 500 }}>
              <Clock size={14} />
              {hoveredEvent.timeStr}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
              color: hoveredEvent.evt.status === 'scheduled' ? 'var(--text)' : 'var(--text-3)',
              background: hoveredEvent.evt.status === 'scheduled' ? 'rgba(255,255,255,0.1)' : 'transparent',
              padding: '4px 8px', borderRadius: '4px', border: hoveredEvent.evt.status === 'draft' ? '1px solid var(--border)' : 'none'
            }}>
              {hoveredEvent.evt.status}
            </div>
          </div>
        </div>
      )}

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchTasks}
      />
      
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
