import { useState } from 'react';
import { X, RefreshCw, List, Layers, Clock, Users, Database } from 'lucide-react';
import Card from './Card';

export default function BackgroundJobQueue({ onClose }) {
  const [jobs, setJobs] = useState([]); // Empty array for now based on screenshot
  
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24
    }}>
      <Card className="glass" style={{ width: '100%', maxWidth: 800, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <List size={20} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Background Job Queue</h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 16px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw size={14} /> Sync & Calibrate
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 13, fontWeight: 600 }}>
            <Users size={16} /> <span style={{ color: 'var(--text)', fontSize: 15, fontWeight: 800 }}>0</span> Accounts
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 13, fontWeight: 600 }}>
            <Layers size={16} /> <span style={{ color: 'var(--text)', fontSize: 15, fontWeight: 800 }}>0</span> Batches
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 13, fontWeight: 600 }}>
            <List size={16} /> <span style={{ color: 'var(--text)', fontSize: 15, fontWeight: 800 }}>0</span> Posts
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 13, fontWeight: 600 }}>
            <Clock size={16} color="var(--accent)" /> <span style={{ color: 'var(--accent)', fontSize: 15, fontWeight: 800 }}>0</span> Pending
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: '48px 32px', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: 200, border: '1px dashed var(--border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
            <Database size={48} color="var(--border)" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>No jobs in the queue</div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ background: 'var(--bg-2)', padding: '16px 32px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace' }}>
          Jobs run sequentially by account. First account completes before second starts.
        </div>
      </Card>
    </div>
  );
}
