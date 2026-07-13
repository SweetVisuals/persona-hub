import { useState, useEffect } from 'react';
import Card from '../components/Card';
import PlatformBadge from '../components/PlatformBadge';
import { supabase } from '../lib/supabase';
import { TrendingUp, Loader2 } from 'lucide-react';

const weekData = [0, 0, 0, 0, 0, 0, 0];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const max = 10;

export default function Analytics() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('personas').select('*, social_accounts(*)').then(({ data }) => {
      if (data) setPersonas(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Loader2 className="spin" /></div>;

  // Aggregate platforms
  const platformMap = {};
  personas.forEach(p => {
    (p.social_accounts || []).forEach(acc => {
      if (!platformMap[acc.platform]) {
        platformMap[acc.platform] = { platform: acc.platform, accounts: 0, reach: 0 };
      }
      platformMap[acc.platform].accounts += 1;
      platformMap[acc.platform].reach += acc.followers || 0;
    });
  });
  
  const platformStats = Object.values(platformMap).sort((a,b) => b.reach - a.reach);
  const maxReach = Math.max(...platformStats.map(p => p.reach), 1);

  return (
    <div style={{ padding: '28px 24px', width: '100%', maxWidth: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>Analytics</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>Performance across all personas and platforms.</p>
      </div>

      {/* Weekly posts bar chart */}
      <Card className="glass" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 20 }}>Posts This Week</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
          {weekData.map((val, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{val}</div>
              <div style={{
                width: '100%',
                height: `${(val / max) * 75}px`,
                background: i === 5 ? 'var(--accent)' : 'var(--bg-4)',
                border: `1px solid ${i === 5 ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 4,
              }} />
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{days[i]}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Platform breakdown */}
      <Card className="glass" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 16 }}>By Platform</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {platformStats.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: 24 }}>No accounts linked yet.</div>}
          {platformStats.map(p => (
            <div key={p.platform} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <PlatformBadge platform={p.platform} size="lg" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.platform}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.reach.toLocaleString()} reach</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-4)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(p.reach / maxReach) * 100}%`, background: 'var(--accent)', borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', width: 60 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{p.accounts}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>accounts</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Per persona */}
      <Card className="glass">
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 16 }}>By Persona</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {personas.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13, gridColumn: '1 / -1', padding: 24, textAlign: 'center' }}>No personas active.</div>}
          {personas.map(p => (
            <div key={p.id} style={{
              padding: '14px', background: 'var(--bg-3)',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: p.color + '22', border: `2px solid ${p.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: p.color,
                }}>
                  {p.avatar}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.niche}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Total Reach', val: (p.social_accounts || []).reduce((acc, a) => acc + (a.followers || 0), 0).toLocaleString() },
                  { label: 'Accounts', val: (p.social_accounts || []).length },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
