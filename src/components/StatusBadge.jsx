export default function StatusBadge({ status }) {
  const map = {
    active: { color: '#10b981', label: 'Active' },
    paused: { color: '#f59e0b', label: 'Paused' },
    error: { color: '#ef4444', label: 'Error' },
    captcha_required: { color: '#ef4444', label: 'Action Required' },
    pending_login: { color: '#3b82f6', label: 'Connecting...' },
    pending_oauth: { color: '#3b82f6', label: 'Connecting...' },
    verifying: { color: '#8b5cf6', label: 'Verifying...' },
  };
  const { color, label } = map[status] || { color: '#f59e0b', label: status || 'Unknown' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 12, color, fontWeight: 500 }}>{label}</span>
    </div>
  );
}
