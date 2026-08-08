import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Briefcase, Plus, Zap, Users } from 'lucide-react';

export default function BusinessChooser() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('businesses')
        .select('*, personas(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (err) {
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreateLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('businesses')
        .insert({ user_id: user.id, name: newName, goal: newGoal })
        .select()
        .single();

      if (error) throw error;
      
      // Auto navigate to the newly created business
      navigate('/b/' + data.id);
    } catch (err) {
      console.error('Error creating business:', err);
      setCreateLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, background: 'var(--text)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={24} color="var(--bg)" fill="var(--bg)" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px' }}>Persona Hub</h1>
        </div>
        <p style={{ color: 'var(--text-2)', fontSize: 18 }}>Choose an account to continue</p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-3)' }}>Loading accounts...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, width: '100%', maxWidth: 1000 }}>
          {businesses.map((b) => (
            <div
              key={b.id}
              onClick={() => navigate('/b/' + b.id)}
              className="glass"
              style={{
                padding: 32,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = 'var(--text)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Briefcase size={24} color="var(--text-2)" />
                <h3 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{b.name}</h3>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 14 }}>
                <Users size={16} />
                <span>{b.personas?.[0]?.count || 0} Personas</span>
              </div>
              
              <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 'auto' }}>
                Created {new Date(b.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}

          {/* Create New Business Card */}
          {isCreating ? (
            <form onSubmit={handleCreate} className="glass" style={{ padding: 24, borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>New Business</h3>
              <input
                type="text"
                placeholder="Business Name"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
              />
              <textarea
                placeholder="Primary Goal (Optional)"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                rows={3}
                style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setIsCreating(false)} style={{ flex: 1, background: 'var(--bg-3)', color: 'var(--text)', padding: '10px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={createLoading} style={{ flex: 1, background: 'var(--text)', color: 'var(--bg)', padding: '10px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600 }}>
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          ) : (
            <div
              onClick={() => setIsCreating(true)}
              style={{
                padding: 32,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                border: '1px dashed var(--border-light)',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'var(--text-2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.borderColor = 'var(--border-light)';
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={24} color="var(--text-2)" />
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)' }}>Create New Business</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
