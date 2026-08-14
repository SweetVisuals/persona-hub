import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import { CheckCircle, XCircle, Music, Edit3, Loader2, Trash2 } from 'lucide-react';
import BratLyricGenerator from '../components/BratLyricGenerator';

export default function LyricsReview() {
  const [extractions, setExtractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  
  const [viewMode, setViewMode] = useState('review'); // 'review' or 'generator'
  const [selectedAudioUrl, setSelectedAudioUrl] = useState('');
  const [selectedLyrics, setSelectedLyrics] = useState('');
  
  useEffect(() => {
    fetchExtractions();
  }, []);

  const fetchExtractions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audio_extractions')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setExtractions(data);
    setLoading(false);
  };

  const handleApprove = async (ext, newLyrics) => {
    const style = ext.templateStyle || { font: 'Arial', animation: 'word-by-word' };
    
    const { error } = await supabase
      .from('audio_extractions')
      .update({ status: 'approved', lyrics: newLyrics })
      .eq('id', ext.id);
      
    if (!error) {
      // Save as Verified Lyric Template
      await supabase.from('verified_lyrics').insert({
        audio_extraction_id: ext.id,
        persona_id: ext.persona_id || null,
        title: ext.metadata?.title || ext.source_url || 'Unknown',
        audio_url: ext.mp3_url || '',
        lyrics: { srt: newLyrics },
        style: style,
        verified: true,
        verified_at: new Date().toISOString()
      });

      setExtractions(prev => prev.map(e => e.id === ext.id ? { ...e, status: 'approved', lyrics: newLyrics } : e));
      alert('Template Verified & Saved!');
    }
  };

  const handleReject = async (id) => {
    await supabase
      .from('audio_extractions')
      .update({ status: 'rejected' })
      .eq('id', id);
      
    setExtractions(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' } : e));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this item?')) return;
    await supabase
      .from('audio_extractions')
      .delete()
      .eq('id', id);
      
    setExtractions(prev => prev.filter(e => e.id !== id));
  };
  
  const handleLyricsChange = (id, newLyrics) => {
    setExtractions(prev => prev.map(e => e.id === id ? { ...e, lyrics: newLyrics } : e));
  };

  const handleStyleChange = (id, key, value) => {
    setExtractions(prev => prev.map(e => {
      if (e.id === id) {
        const style = e.templateStyle || { font: 'Arial', animation: 'word-by-word', color: '#ffffff' };
        return { ...e, templateStyle: { ...style, [key]: value } };
      }
      return e;
    }));
  };

  const filteredExtractions = extractions.filter(e => {
    if (filter === 'All') return true;
    if (filter === 'Pending Review') return e.status === 'pending_review';
    if (filter === 'Approved') return e.status === 'approved';
    if (filter === 'Rejected') return e.status === 'rejected';
    return true;
  });

  return (
    <div style={{ padding: '40px 24px', maxWidth: viewMode === 'generator' ? 1200 : 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Lyrics & Caption Studio</h1>
      <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 32 }}>Review transcription results or bake customized synced caption overlays.</p>

      {/* Main Top Navigation */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
        <button
          onClick={() => setViewMode('review')}
          style={{
            background: viewMode === 'review' ? 'var(--text)' : 'transparent',
            color: viewMode === 'review' ? 'var(--bg)' : 'var(--text-2)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 'var(--radius)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Review Transcriptions
        </button>
        <button
          onClick={() => {
            setSelectedAudioUrl('');
            setSelectedLyrics('');
            setViewMode('generator');
          }}
          style={{
            background: viewMode === 'generator' ? 'var(--text)' : 'transparent',
            color: viewMode === 'generator' ? 'var(--bg)' : 'var(--text-2)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 'var(--radius)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Brat Video Generator
        </button>
      </div>

      {viewMode === 'generator' ? (
        <BratLyricGenerator initialAudioUrl={selectedAudioUrl} initialLyrics={selectedLyrics} />
      ) : (
        <>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
            {['All', 'Pending Review', 'Approved', 'Rejected'].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  background: filter === t ? 'var(--bg-3)' : 'transparent',
                  color: filter === t ? 'var(--text)' : 'var(--text-3)',
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

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 16 }}>
                <div>
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
                
                {/* Template Settings */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 16 }}>
                    Template Style
                  </label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Font Family</div>
                      <select 
                        value={ext.templateStyle?.font || 'Arial'} 
                        onChange={e => handleStyleChange(ext.id, 'font', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <option value="Arial">Arial</option>
                        <option value="Impact">Impact</option>
                        <option value="Space Grotesk">Space Grotesk</option>
                        <option value="Times New Roman">Times New Roman</option>
                      </select>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Animation</div>
                      <select 
                        value={ext.templateStyle?.animation || 'word-by-word'} 
                        onChange={e => handleStyleChange(ext.id, 'animation', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <option value="word-by-word">Word-by-word Reveal</option>
                        <option value="line-by-line">Line-by-line</option>
                        <option value="karaoke">Karaoke Highlight</option>
                      </select>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>Primary Color</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['#ffffff', '#8ACE00', '#FF3366', '#00C2FF', '#FFB800'].map(c => (
                          <button
                            key={c}
                            onClick={() => handleStyleChange(ext.id, 'color', c)}
                            style={{ 
                              width: 24, height: 24, borderRadius: '50%', background: c, 
                              border: ext.templateStyle?.color === c ? '2px solid white' : 'none',
                              cursor: 'pointer' 
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                {ext.status === 'approved' && ext.mp3_url && (
                  <button
                    onClick={() => {
                      setSelectedAudioUrl(ext.mp3_url);
                      setSelectedLyrics(ext.lyrics || '');
                      setViewMode('generator');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: '#8ACE00',
                      border: 'none',
                      color: '#000',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Music size={16} /> Generate Video Overlay
                  </button>
                )}
                <button
                  onClick={() => handleDelete(ext.id)}
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
                  <Trash2 size={16} /> Delete
                </button>

                {ext.status !== 'rejected' && (
                  <button
                    onClick={() => handleReject(ext.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'var(--bg-3)',
                      border: 'none',
                      color: 'var(--text-2)',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                )}
                <button
                  onClick={() => handleApprove(ext, ext.lyrics)}
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
                  <CheckCircle size={16} /> Verify & Save Template
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
