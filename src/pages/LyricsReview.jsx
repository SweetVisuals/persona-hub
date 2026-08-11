import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import { CheckCircle, XCircle, Music, Edit3, Play, Pause, Loader2, AlertCircle } from 'lucide-react';

export default function LyricsReview() {
  const [extractions, setExtractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  
  useEffect(() => {
    fetchExtractions();
  }, []);

  const fetchExtractions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audio_extractions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setExtractions(data);
    setLoading(false);
  };

  const handleApprove = async (id, newLyrics) => {
    const { error } = await supabase
      .from('audio_extractions')
      .update({ status: 'approved', lyrics: newLyrics })
      .eq('id', id);
      
    if (!error) {
      setExtractions(prev => prev.map(e => e.id === id ? { ...e, status: 'approved', lyrics: newLyrics } : e));
    }
  };

  const handleReject = async (id) => {
    const { error } = await supabase
      .from('audio_extractions')
      .update({ status: 'rejected' })
      .eq('id', id);
      
    if (!error) {
      setExtractions(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' } : e));
    }
  };
  
  const handleLyricsChange = (id, newLyrics) => {
    setExtractions(prev => prev.map(e => e.id === id ? { ...e, lyrics: newLyrics } : e));
  };

  const filteredExtractions = extractions.filter(e => {
    if (filter === 'All') return true;
    if (filter === 'Pending Review') return e.status === 'pending_review';
    if (filter === 'Approved') return e.status === 'approved';
    if (filter === 'Rejected') return e.status === 'rejected';
    return true;
  });

  return (
    <div style={{ padding: '40px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Lyrics Review</h1>
      <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 32 }}>Review, edit, and approve extracted audio lyrics.</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
        {['All', 'Pending Review', 'Approved', 'Rejected'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              background: filter === t ? 'var(--text)' : 'transparent',
              color: filter === t ? 'var(--bg)' : 'var(--text-2)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={32} className="spin" color="var(--text-3)" />
        </div>
      ) : filteredExtractions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
          <Music size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <div>No audio extractions found for this filter.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {filteredExtractions.map(ext => (
            <Card key={ext.id} className="glass" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {ext.metadata?.title || ext.source_url || 'Unknown Title'}
                  </h3>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 12,
                      background: ext.status === 'approved' ? 'var(--green)' : ext.status === 'rejected' ? 'var(--red)' : 'var(--accent-dim)',
                      color: ext.status === 'approved' || ext.status === 'rejected' ? '#fff' : 'var(--accent)',
                    }}>
                      {ext.status?.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {new Date(ext.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {ext.mp3_url && (
                <div style={{ marginBottom: 16 }}>
                  <audio controls src={ext.mp3_url} style={{ width: '100%', height: 40 }} />
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>
                  <Edit3 size={14} /> Edit Lyrics (SRT)
                </label>
                <textarea
                  value={ext.lyrics || ''}
                  onChange={(e) => handleLyricsChange(ext.id, e.target.value)}
                  style={{
                    width: '100%',
                    height: 200,
                    background: 'var(--bg-3)',
                    border: '1px solid var(--border)',
                    padding: 16,
                    borderRadius: 'var(--radius)',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleReject(ext.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'transparent',
                    border: '1px solid var(--red)',
                    color: 'var(--red)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <XCircle size={16} /> Reject
                </button>
                <button
                  onClick={() => handleApprove(ext.id, ext.lyrics)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'var(--green)',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle size={16} /> Approve
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
