import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import { Plus, Target, CheckCircle, Smartphone, PlaySquare, Image as ImageIcon, Video, AlignLeft, Hash, Edit2, Trash2, MoreVertical } from 'lucide-react';

export default function Strategies() {
  const [personas, setPersonas] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [strategyMenuOpen, setStrategyMenuOpen] = useState(null);

  // Form State
  const [platform, setPlatform] = useState('tiktok');
  const [personaId, setPersonaId] = useState('');
  const [strategyName, setStrategyName] = useState('');
  
  // TikTok Specific
  const [song, setSong] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [autoHashtags, setAutoHashtags] = useState(true);
  const [maxHashtags, setMaxHashtags] = useState(15);
  const [type, setType] = useState('slideshow');
  const [fontSize, setFontSize] = useState(48); // default tiktok sans size
  const [aspectRatio, setAspectRatio] = useState('9:16');
  
  // Slideshow
  const [slideCount, setSlideCount] = useState(3);
  const [slides, setSlides] = useState(["Chill.. it's just a song", "I don't care.. TURN IT UP!!", "SELFISH - Mani Raé\nAvailable on all platforms"]);

  // YouTube Specific
  const [ytClickbait, setYtClickbait] = useState(true);
  const [ytDesc, setYtDesc] = useState('');

  useEffect(() => {
    const fetchInit = async () => {
      const { data: pData } = await supabase.from('personas').select('*');
      if (pData) {
        setPersonas(pData);
      }
      
      const { data: sData } = await supabase.from('strategies').select('*, personas(name)');
      if (sData) setStrategies(sData);
      setLoading(false);
    };
    fetchInit();

    const handleClick = () => setStrategyMenuOpen(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleSlideCountChange = (newCount) => {
    const parsed = parseInt(newCount, 10);
    if (isNaN(parsed) || parsed < 1) return;
    setSlideCount(parsed);
    
    // Adjust slides array
    setSlides(prev => {
      const newSlides = [...prev];
      if (parsed > newSlides.length) {
        for (let i = newSlides.length; i < parsed; i++) {
          newSlides.push("");
        }
      } else {
        newSlides.length = parsed;
      }
      return newSlides;
    });
  };

  const updateSlide = (index, value) => {
    const newSlides = [...slides];
    newSlides[index] = value;
    setSlides(newSlides);
  };

  const handleEdit = (strategy) => {
    setIsCreating(true);
    setEditingId(strategy.id);
    setPlatform(strategy.platform);
    setPersonaId(strategy.persona_id || '');
    setStrategyName(strategy.name);
    
    const s = strategy.settings || {};
    if (strategy.platform === 'tiktok') {
      setSong(s.song || '');
      setPostTitle(s.postTitle || '');
      setPostDesc(s.postDesc || '');
      setAutoHashtags(s.autoHashtags ?? true);
      setMaxHashtags(s.maxHashtags || 15);
      setType(s.type || 'slideshow');
      setFontSize(s.fontSize || 48);
      setAspectRatio(s.aspectRatio || '9:16');
      if (s.type === 'slideshow') {
        setSlideCount(s.slideCount || 3);
        setSlides(s.slides || [""]);
      }
    } else {
      setYtClickbait(s.clickbaitTitle ?? true);
      setYtDesc(s.description || '');
      setAutoHashtags(s.autoHashtags ?? true);
      setMaxHashtags(s.maxHashtags || 15);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the strategy "${name}"?`)) {
      try {
        const { error } = await supabase.from('strategies').delete().eq('id', id);
        if (error) throw error;
        setStrategies(prev => prev.filter(s => s.id !== id));
      } catch (e) {
        alert("Error deleting strategy: " + e.message);
      }
    }
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setStrategyName('');
    setSong('');
    setPostTitle('');
    setPostDesc('');
    setType('slideshow');
    setSlides(["Chill.. it's just a song", "I don't care.. TURN IT UP!!", "SELFISH - Mani Raé\nAvailable on all platforms"]);
    setSlideCount(3);
  };

  const handleSave = async () => {
    if (!strategyName) return alert('Strategy Name is required!');
    
    const settings = platform === 'tiktok' ? {
      song,
      postTitle,
      postDesc,
      autoHashtags,
      maxHashtags,
      type,
      fontSize,
      aspectRatio,
      slideCount: type === 'slideshow' ? slideCount : undefined,
      slides: type === 'slideshow' ? slides : undefined
    } : {
      clickbaitTitle: ytClickbait,
      description: ytDesc,
      autoHashtags,
      maxHashtags
    };

    try {
      if (editingId) {
        const { data, error } = await supabase.from('strategies').update({
          persona_id: personaId || null,
          platform,
          name: strategyName,
          settings
        }).eq('id', editingId).select('*, personas(name)').single();
        if (error) throw error;
        setStrategies(prev => prev.map(s => s.id === editingId ? data : s));
      } else {
        const { data, error } = await supabase.from('strategies').insert({
          persona_id: personaId || null,
          platform,
          name: strategyName,
          settings
        }).select('*, personas(name)').single();
        if (error) throw error;
        setStrategies([...strategies, data]);
      }
      
      resetForm();
    } catch (e) {
      alert("Error saving strategy: " + e.message);
    }
  };

  if (loading) return null;

  return (
    <div style={{ padding: '28px 48px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>Content Strategies</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>Define rulesets for generating videos and slideshows.</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--text)', color: 'var(--bg)', padding: '10px 20px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            <Plus size={18} /> New Strategy
          </button>
        )}
      </div>

      {isCreating ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
          {/* Left Side: Builder */}
          <Card className="glass" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 24 }}>{editingId ? 'Edit Strategy' : 'Strategy Builder'}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Platform</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div onClick={() => setPlatform('tiktok')} style={{ flex: 1, padding: '12px', border: `1px solid ${platform === 'tiktok' ? 'var(--accent)' : 'var(--border)'}`, background: platform === 'tiktok' ? 'var(--accent-dim)' : 'var(--bg-3)', color: platform === 'tiktok' ? 'var(--accent)' : 'var(--text-2)', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600 }}>
                    <Smartphone size={18} /> TikTok
                  </div>
                  <div onClick={() => setPlatform('youtube')} style={{ flex: 1, padding: '12px', border: `1px solid ${platform === 'youtube' ? 'var(--red)' : 'var(--border)'}`, background: platform === 'youtube' ? 'rgba(255,0,0,0.1)' : 'var(--bg-3)', color: platform === 'youtube' ? 'var(--red)' : 'var(--text-2)', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600 }}>
                    <PlaySquare size={18} /> YT Shorts
                  </div>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Assign Persona</label>
                <select value={personaId} onChange={e => setPersonaId(e.target.value)} style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '14px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, outline: 'none' }}>
                  <option value="">Unassigned (Global)</option>
                  {personas.map(p => <option key={p.id} value={p.id}>{p.name} ({p.handle})</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Strategy Name</label>
              <input value={strategyName} onChange={e => setStrategyName(e.target.value)} placeholder="e.g. Chill.. it's just a song" style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '14px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }} />
            </div>

            {platform === 'tiktok' ? (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>TikTok Settings</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Song (Audio Override)</label>
                    <input value={song} onChange={e => setSong(e.target.value)} placeholder="SELFISH - Mani Raé" style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '14px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Post Title (Caption)</label>
                    <input value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="BLOW THIS UP!!!" style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '14px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }} />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Post Description</label>
                  <textarea value={postDesc} onChange={e => setPostDesc(e.target.value)} placeholder="SELFISH - Mani Raé" style={{ width: '100%', height: 80, background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '14px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, resize: 'none' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 32 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={autoHashtags} onChange={e => setAutoHashtags(e.target.checked)} style={{ width: 16, height: 16 }} />
                    Auto-generate Hashtags (Trending)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, opacity: autoHashtags ? 1 : 0.5 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Max Hashtags: {maxHashtags}</span>
                    <input type="range" min="0" max="25" value={maxHashtags} onChange={e => setMaxHashtags(e.target.value)} disabled={!autoHashtags} style={{ flex: 1 }} />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>Content Format</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {['slideshow', 'video', 'lyrics', 'image', 'ragebait', 'meme'].map(t => (
                      <div 
                        key={t} onClick={() => setType(t)}
                        style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${type === t ? 'var(--accent)' : 'var(--border)'}`, background: type === t ? 'var(--accent-dim)' : 'var(--bg-3)', color: type === t ? 'var(--accent)' : 'var(--text-2)', textTransform: 'capitalize' }}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                </div>

                {/* SLIDESHOW BUILDER */}
                {type === 'slideshow' && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontWeight: 700 }}>
                        <ImageIcon size={20} /> Slideshow Editor
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Aspect</span>
                        <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '6px', borderRadius: '4px', color: 'var(--text)', outline: 'none' }}>
                          <option value="9:16">9:16</option>
                          <option value="3:4">3:4</option>
                          <option value="4:3">4:3</option>
                          <option value="4:5">4:5</option>
                          <option value="1:1">1:1</option>
                        </select>
                        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginLeft: 16 }}>Size (px)</span>
                        <input type="number" value={fontSize} onChange={e => setFontSize(e.target.value)} style={{ width: 60, background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '6px', borderRadius: '4px', color: 'var(--text)', textAlign: 'center' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginLeft: 16 }}>Slides</span>
                        <input type="number" min="1" max="10" value={slideCount} onChange={e => handleSlideCountChange(e.target.value)} style={{ width: 60, background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '6px', borderRadius: '4px', color: 'var(--text)', textAlign: 'center' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {slides.map((text, i) => (
                        <div key={i} style={{ display: 'flex', gap: 16 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--text-2)', flexShrink: 0 }}>
                            {i + 1}
                          </div>
                          <textarea 
                            value={text} 
                            onChange={e => updateSlide(i, e.target.value)} 
                            placeholder="Text for this slide... (Use Enter for new line)"
                            style={{ flex: 1, height: 80, background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 14, resize: 'vertical', fontFamily: 'Inter', fontWeight: 700 }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VIDEO FORMAT */}
                {type === 'video' && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: 24, borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <Video size={32} color="var(--text-3)" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 14, color: 'var(--text-2)' }}>Video overlay settings coming soon! (Foundation prepared)</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>YouTube Shorts Settings</h3>
                
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={ytClickbait} onChange={e => setYtClickbait(e.target.checked)} style={{ width: 16, height: 16 }} />
                    Auto-generate Clickbait Titles
                  </label>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, marginLeft: 24 }}>Dynamically creates unique, high-CTR titles for every Short instead of a static title.</div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Description Template</label>
                  <textarea value={ytDesc} onChange={e => setYtDesc(e.target.value)} placeholder="Available on Spotify now!" style={{ width: '100%', height: 100, background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '14px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={autoHashtags} onChange={e => setAutoHashtags(e.target.checked)} style={{ width: 16, height: 16 }} />
                    Auto-generate Hashtags
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, opacity: autoHashtags ? 1 : 0.5 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Max: {maxHashtags}</span>
                    <input type="range" min="0" max="25" value={maxHashtags} onChange={e => setMaxHashtags(e.target.value)} disabled={!autoHashtags} style={{ flex: 1 }} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <button onClick={resetForm} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 20px', borderRadius: '20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} style={{ background: 'var(--text)', color: 'var(--bg)', border: 'none', padding: '10px 24px', borderRadius: '20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={18} /> {editingId ? 'Update Strategy' : 'Save Strategy'}
              </button>
            </div>
          </Card>
          
          {/* Right Side: Live Device Preview */}
          <div style={{ position: 'sticky', top: 100, display: 'flex', justifyContent: 'center' }}>
             <div style={{
               width: 320, height: 650, 
               borderRadius: 44, 
               border: '12px solid #1a1a1a', 
               background: '#0f0f0f',
               position: 'relative',
               overflow: 'hidden',
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
             }}>
                {/* Notch */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 28, background: '#1a1a1a', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />
                
                {/* Home Indicator */}
                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 100, height: 4, background: '#333', borderRadius: 4, zIndex: 10 }} />
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                   <Video size={48} color="var(--text-3)" style={{ marginBottom: 16 }} />
                   <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-2)' }}>Preview Unavailable</div>
                   <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Select images to preview</div>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {strategies.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: 48, textAlign: 'center', background: 'var(--bg-2)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
              <Target size={48} color="var(--text-3)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, color: 'var(--text)', fontWeight: 700, marginBottom: 8 }}>No Strategies Found</h3>
              <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Create your first content strategy to automate publishing formats.</p>
            </div>
          ) : (
            strategies.map(s => (
              <Card key={s.id} className="glass" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '12px', background: s.platform === 'tiktok' ? 'var(--accent-dim)' : 'rgba(255,0,0,0.1)', color: s.platform === 'tiktok' ? 'var(--accent)' : 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.platform === 'tiktok' ? <Smartphone size={20} /> : <PlaySquare size={20} />}
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'capitalize' }}>{s.platform} • {s.personas?.name || 'Unassigned'}</div>
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button onClick={(e) => { e.stopPropagation(); setStrategyMenuOpen(strategyMenuOpen === s.id ? null : s.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '50%' }}>
                      <MoreVertical size={18} />
                    </button>
                    {strategyMenuOpen === s.id && (
                      <div style={{ position: 'absolute', top: 36, right: 0, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', zIndex: 100, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(s); setStrategyMenuOpen(null); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'transparent', color: 'var(--text)', border: 'none', width: '100%', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }} className="menu-btn"><Edit2 size={14} /> Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id, s.name); setStrategyMenuOpen(null); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'transparent', color: 'var(--red)', border: 'none', width: '100%', textAlign: 'left', borderRadius: '4px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }} className="menu-btn"><Trash2 size={14} /> Delete</button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ background: 'var(--bg-3)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', flex: 1 }}>
                  {s.platform === 'tiktok' ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
                        <AlignLeft size={14} /> Type: <span style={{ color: 'var(--text)', fontWeight: 600, textTransform: 'capitalize' }}>{s.settings.type}</span>
                      </div>
                      {s.settings.type === 'slideshow' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
                          <ImageIcon size={14} /> Slides: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{s.settings.slideCount}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                        <Hash size={14} /> Hashtags: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{s.settings.autoHashtags ? `Auto (Max ${s.settings.maxHashtags})` : 'Manual'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
                        <AlignLeft size={14} /> Clickbait: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{s.settings.clickbaitTitle ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                        <Hash size={14} /> Hashtags: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{s.settings.autoHashtags ? `Auto (Max ${s.settings.maxHashtags})` : 'Manual'}</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
      <style>{`.menu-btn:hover { background: var(--bg-3) !important; }`}</style>
    </div>
  );
}
