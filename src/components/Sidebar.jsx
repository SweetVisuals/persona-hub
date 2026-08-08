import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, CalendarDays, BarChart2, Settings, Zap, Folder, HardDrive, Mic } from 'lucide-react';
import { supabase } from '../lib/supabase';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/personas', icon: Users, label: 'Personas' },
  { to: '/strategies', icon: Folder, label: 'Strategies' },
  { to: '/audio-studio', icon: Mic, label: 'Audio Studio' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ mobile, onClose }) {
  const [storageUsed, setStorageUsed] = useState(0);
  const QUOTA = 10 * 1024 * 1024 * 1024; // 10 GB

  useEffect(() => {
    const fetchStorage = async () => {
      const { data } = await supabase.from('files').select('size').eq('type', 'file');
      if (data) {
        let bytes = 0;
        data.forEach(f => {
          const sizeStr = String(f.size).toUpperCase();
          const val = parseFloat(sizeStr);
          if (isNaN(val)) return;
          if (sizeStr.includes('GB')) bytes += val * 1024 * 1024 * 1024;
          else if (sizeStr.includes('MB')) bytes += val * 1024 * 1024;
          else if (sizeStr.includes('KB')) bytes += val * 1024;
          else bytes += val;
        });
        setStorageUsed(bytes);
      }
    };
    fetchStorage();

    const sub = supabase.channel('sidebar-quota')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, fetchStorage)
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const percentage = Math.min(100, (storageUsed / QUOTA) * 100);
  const gbUsed = (storageUsed / (1024 * 1024 * 1024)).toFixed(2);
  return (
    <aside style={{
      width: mobile ? '100%' : 'var(--sidebar)',
      background: 'var(--bg)',
      borderRight: mobile ? 'none' : '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 16px',
      gap: '4px',
      height: mobile ? 'auto' : '100vh',
      position: mobile ? 'relative' : 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px 40px' }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--text)',
          borderRadius: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={16} color="var(--bg)" fill="var(--bg)" />
        </div>
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', color: 'var(--text)' }}>
          Persona Hub
        </span>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--bg)' : 'var(--text-3)',
              background: isActive ? 'var(--text)' : 'transparent',
              transition: 'all 0.2s',
            })}
            onMouseEnter={(e) => {
              if (e.currentTarget.style.background === 'transparent') {
                e.currentTarget.style.background = 'var(--bg-3)';
                e.currentTarget.style.color = 'var(--text)';
              }
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget.style.background === 'var(--bg-3)') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-3)';
              }
            }}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} color={isActive ? 'var(--bg)' : 'inherit'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom Quota */}
      <div style={{ marginTop: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Storage Quota */}
        <div style={{ background: 'var(--bg-2)', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><HardDrive size={12} /> Storage</div>
            <span>{gbUsed} GB / 10 GB</span>
          </div>
          <div style={{ width: '100%', height: 4, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${percentage}%`, height: '100%', background: percentage > 90 ? 'var(--red)' : 'var(--text)', borderRadius: 2 }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
