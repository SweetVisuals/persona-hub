import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../components/BusinessContext';
import Card from '../components/Card';
import { 
  ChevronRight, ChevronLeft, Sparkles, User, Target, Network, Scissors, CheckCircle, 
  Wand2, CheckSquare, Square, Search, Plus, Trash2, Shuffle 
} from 'lucide-react';

const bioTemplates = [
  "Daily updates, edits, and news about [NAME]. ✨",
  "Your #1 source for [NAME]. Fan account.",
  "Archiving the best moments of [NAME]. Follow for daily content.",
  "[NAME] supremacy. Daily posts and aesthetic edits. 🤍",
  "Just a fan sharing love for [NAME]. Not affiliated.",
  "The ultimate archive for [NAME]. 📸",
  "[NAME] fan page. We post daily clips and edits.",
  "Your daily dose of [NAME]. Turn on post notifications! 🔔",
  "Dedicated to [NAME]. Aesthetic edits and viral moments.",
  "Following the journey of [NAME]. 🌟",
  "Everything [NAME]. Edits, news, and more.",
  "The biggest [NAME] fan account on this platform. 👑",
  "Just another [NAME] stan account. 💅",
  "Curating the best of [NAME].",
  "[NAME] aesthetic archive. 🖤",
  "Daily dose of serotonin courtesy of [NAME].",
  "All things [NAME]. Unofficial fan page.",
  "Serving [NAME] content 24/7.",
  "[NAME] HQ. Your favorite fan page. 🚀",
  "Obsessed with [NAME]. Here for the vibes.",
  "Documenting [NAME]’s iconic moments. 🎥",
  "Aesthetic [NAME] edits straight to your feed.",
  "Number one [NAME] supporter. ❤️",
  "Welcome to the [NAME] fan club. 🎈",
  "Posting [NAME] every single day."
];

const goalTemplates = [
  "Flood the internet with content about [NAME]. Maximize exposure and engagement by finding the most viral clips and reposting them aggressively.",
  "Build a highly engaged fan community for [NAME]. Focus on emotional, behind-the-scenes moments to foster deep parasocial connection.",
  "Drive immense traffic and hype towards [NAME]'s latest releases by clipping high-energy segments and using trending audio.",
  "Establish [NAME] as an authority in their niche. Repost educational and insightful clips to build trust.",
  "Create a visually stunning aesthetic archive for [NAME]. Prioritize high-quality imagery and edits."
];

export default function PersonaWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [step, setStep] = useState(1);
  const { business } = useBusiness();
  
  const [strategies, setStrategies] = useState([]);

  useEffect(() => {
    let query = supabase.from('strategies').select('*');
    if (id) {
      query = query.or(`persona_id.is.null,persona_id.eq.${id}`);
    } else {
      query = query.is('persona_id', null);
    }
    query.then(({ data }) => {
      if (data) setStrategies(data);
    });
    if (id) {
      supabase.from('personas').select('*, scraping_sources(*)').eq('id', id).single().then(({ data }) => {
        if (data) {
          setFormData({
            business_id: data.business_id || '',
            name: data.name || '',
            handle: data.handle || '',
            niche: data.niche || '',
            isFanAccount: data.is_fan_account,
            bio: data.bio || '',
            globalGoal: data.global_goal || '',
            theme: 'City',
            colorPalette: 'Black & White',
            aspectRatio: data.aspect_ratio || '9:16',
            agent_type: data.agent_type || 'fan',
            tone: data.tone || 'enthusiastic',
            schedule_config: data.schedule_config || { postsPerDay: 3, activeHours: '9am - 9pm', strategies: [] },
            sources: data.scraping_sources && data.scraping_sources.length > 0 ? data.scraping_sources : [
              { id: 1, platform: 'pinterest', url: 'black and white city aesthetic' }
            ],
            rules: { extractClips: true, autoCrop: true, removeAudio: true, watermark: false }
          });
        }
      });
    }
  }, [id]);

  const [formData, setFormData] = useState({
    business_id: '',
    name: '',
    handle: '',
    niche: '',
    isFanAccount: true,
    bio: '',
    globalGoal: '',
    theme: 'City',
    colorPalette: 'Black & White',
    aspectRatio: '9:16',
    agent_type: 'fan',
    tone: 'enthusiastic',
    schedule_config: { postsPerDay: 3, activeHours: '9am - 9pm', strategies: [] },
    sources: [
      { id: 1, platform: 'pinterest', url: 'vintage nyc aesthetic', frequency: '5min', extract_mode: 'latest' },
      { id: 2, platform: 'youtube', url: 'city cinematic video', frequency: '5min', extract_mode: 'latest' },
      { id: 3, platform: 'tiktok', url: 'city aesthetic', frequency: '5min', extract_mode: 'latest' },
      { id: 4, platform: 'instagram', url: 'luxury night aesthetic', frequency: '5min', extract_mode: 'latest' }
    ],
    rules: {
      extractClips: true,
      autoCrop: true,
      removeAudio: true,
      watermark: false,
    }
  });

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const steps = [
    { id: 1, title: 'Identity', icon: User },
    { id: 2, title: 'Goals', icon: Target },
    { id: 3, title: 'Sources', icon: Network },
    { id: 4, title: 'Rules', icon: Scissors },
    { id: 5, title: 'Deploy', icon: CheckCircle },
  ];

  const handleNext = () => setStep(s => Math.min(5, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let personaId = id;
      
      if (id) {
        const { error: personaError } = await supabase.from('personas').update({
          business_id: formData.business_id || business.id,
          name: formData.name,
          handle: formData.handle,
          bio: formData.bio,
          niche: formData.niche,
          avatar: formData.name.charAt(0).toUpperCase() || 'P',
          is_fan_account: formData.isFanAccount,
          global_goal: formData.globalGoal,
          aspect_ratio: formData.aspectRatio,
          agent_type: formData.agent_type,
          tone: formData.tone,
          schedule_config: formData.schedule_config,
        }).eq('id', id);
        if (personaError) throw personaError;
        
        await supabase.from('scraping_sources').delete().eq('persona_id', id);
      } else {
        const { data: personaData, error: personaError } = await supabase.from('personas').insert({
          business_id: formData.business_id || business.id,
          user_id: user.id,
          name: formData.name,
          handle: formData.handle,
          bio: formData.bio,
          niche: formData.niche,
          avatar: formData.name.charAt(0).toUpperCase() || 'P',
          color: '#34d399', 
          is_fan_account: formData.isFanAccount,
          global_goal: formData.globalGoal,
          aspect_ratio: formData.aspectRatio,
          agent_type: formData.agent_type,
          tone: formData.tone,
          schedule_config: formData.schedule_config,
        }).select().single();

        if (personaError) throw personaError;
        personaId = personaData.id;
      }

      if (formData.schedule_config.strategies) {
        if (id) {
          await supabase.from('strategies').update({ persona_id: null }).eq('persona_id', id);
        }
        if (formData.schedule_config.strategies.length > 0) {
          await supabase.from('strategies').update({ persona_id: personaId }).in('id', formData.schedule_config.strategies);
        }
      }

      const sourcesToInsert = formData.sources.filter(s => s.url.trim() !== '').map(s => ({
        persona_id: personaId,
        platform: s.platform,
        url: s.url,
        frequency: s.frequency || '5min',
        extract_mode: s.extract_mode || 'latest'
      }));

      if (sourcesToInsert.length > 0) {
        const { error: sourceError } = await supabase.from('scraping_sources').insert(sourcesToInsert);
        if (sourceError) throw sourceError;
      }

      navigate(`/b/${business.id}/personas`);
    } catch (err) {
      alert('Error deploying persona: ' + err.message);
      setIsDeploying(false);
    }
  };

  const randomizeBio = () => {
    const randomTemplate = bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
    const newBio = randomTemplate.replace(/\[NAME\]/g, formData.name || 'our favorite creator');
    updateForm('bio', newBio);
  };

  const randomizeGoal = () => {
    const randomTemplate = goalTemplates[Math.floor(Math.random() * goalTemplates.length)];
    const newGoal = randomTemplate.replace(/\[NAME\]/g, formData.name || 'our favorite creator');
    updateForm('globalGoal', newGoal);
  };

  const regenerateSources = (theme, color) => {
    const t = theme || formData.theme;
    const c = color || formData.colorPalette;
    updateForm('sources', [
      { id: Date.now() + 1, platform: 'pinterest', url: `${c} ${t} aesthetic`.toLowerCase(), frequency: '5min', extract_mode: 'latest' },
      { id: Date.now() + 2, platform: 'pinterest', url: `${t} aesthetic`.toLowerCase(), frequency: '5min', extract_mode: 'latest' },
      { id: Date.now() + 3, platform: 'youtube', url: `${t} cinematic video`.toLowerCase(), frequency: '5min', extract_mode: 'latest' },
      { id: Date.now() + 4, platform: 'tiktok', url: `${t} aesthetic`.toLowerCase(), frequency: '5min', extract_mode: 'latest' },
      { id: Date.now() + 5, platform: 'instagram', url: `${t} ${c} aesthetic`.toLowerCase(), frequency: '5min', extract_mode: 'latest' }
    ]);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="wizard-step fade-in">
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Core Identity</h2>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 32 }}>Define the public face of this persona.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>Target Goal / Business</label>
                  <select 
                    value={formData.business_id || business.id} 
                    onChange={e => setFormData({...formData, business_id: e.target.value})} 
                    style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, WebkitAppearance: 'none' }}
                  >
                    <option value={business.id}>{business.name}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>Agent Identity</label>
                  <select 
                    value={formData.agent_type} 
                    onChange={e => setFormData({...formData, agent_type: e.target.value})} 
                    style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, WebkitAppearance: 'none' }}
                  >
                    <option value="fan">Fan Account</option>
                    <option value="meme">Meme Page</option>
                    <option value="theme">Theme Page / Aesthetic</option>
                    <option value="educational">Educational / Authority</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Agent Name</label>
                  <input 
                    value={formData.name} onChange={e => updateForm('name', e.target.value)}
                    placeholder="e.g. Mani Raé Fan"
                    style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Handle / Username</label>
                  <input 
                    value={formData.handle} onChange={e => updateForm('handle', e.target.value)}
                    placeholder="@maniraefan"
                    style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Tone of Voice</label>
                  <input 
                    value={formData.tone} onChange={e => updateForm('tone', e.target.value)}
                    placeholder="e.g. Enthusiastic, Edgy, Professional"
                    style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Target Niche</label>
                  <input 
                    type="text" value={formData.niche} onChange={e => setFormData({...formData, niche: e.target.value})} 
                    placeholder="e.g. Travel, Fashion, Tech" 
                    style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }} 
                  />
                </div>
              </div>

            <Card className="glass" style={{ marginTop: 32, marginBottom: 32, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Fan Account Mode</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Optimizes the AI to aggregate and repurpose content about a specific subject rather than acting as a first-person creator.</div>
                </div>
                <div onClick={() => updateForm('isFanAccount', !formData.isFanAccount)} style={{ cursor: 'pointer', color: formData.isFanAccount ? 'var(--text)' : 'var(--text-3)' }}>
                  {formData.isFanAccount ? <CheckSquare size={24} /> : <Square size={24} />}
                </div>
              </div>
            </Card>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Biography</label>
                <button onClick={randomizeBio} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 12px', borderRadius: '16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Shuffle size={14} /> Random Template
                </button>
              </div>
              <textarea 
                value={formData.bio} onChange={e => updateForm('bio', e.target.value)}
                placeholder="Enter a biography for this persona, or click Random Template to start..."
                style={{ width: '100%', height: 100, background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, resize: 'none', lineHeight: 1.6 }}
              />
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="wizard-step fade-in">
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Goals & Schedule</h2>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 32 }}>Define the North Star metric and operational rhythm for this agent.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Primary Objective Directive</label>
                <button onClick={randomizeGoal} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 12px', borderRadius: '16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Shuffle size={14} /> Random Template
                </button>
              </div>
              <textarea 
                value={formData.globalGoal} onChange={e => updateForm('globalGoal', e.target.value)}
                placeholder="e.g. Flood the internet with content about Mani Raé. Maximize exposure and engagement by finding the most viral clips and reposting them aggressively."
                style={{ width: '100%', height: 150, background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, resize: 'none', lineHeight: 1.6 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Posts per day</label>
                <input 
                  type="number"
                  value={formData.schedule_config.postsPerDay} 
                  onChange={e => updateForm('schedule_config', { ...formData.schedule_config, postsPerDay: parseInt(e.target.value) })}
                  style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Active Hours</label>
                <input 
                  value={formData.schedule_config.activeHours} 
                  onChange={e => updateForm('schedule_config', { ...formData.schedule_config, activeHours: e.target.value })}
                  placeholder="e.g. 9am - 9pm EST"
                  style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Assign Content Strategies</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-3)', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  {strategies.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>No available strategies. Create one on the Strategies page.</div>
                  ) : (
                    strategies.map(s => (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.schedule_config.strategies?.includes(s.id)}
                          onChange={e => {
                            const current = formData.schedule_config.strategies || [];
                            const updated = e.target.checked ? [...current, s.id] : current.filter(id => id !== s.id);
                            updateForm('schedule_config', { ...formData.schedule_config, strategies: updated });
                          }}
                        />
                        {s.name} <span style={{ color: 'var(--text-3)', fontSize: 12 }}>({s.platform})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="wizard-step fade-in">
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Scraping Sources</h2>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 32 }}>Select an aesthetic theme. We will automatically generate the optimal search queries for each platform to source highly repurposable, fair-use content.</p>
            
            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>Aesthetic Theme</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['City', 'Luxury', 'Cars', 'Nature', 'Cinematic', 'Minimalist'].map(t => (
                  <div 
                    key={t}
                    onClick={() => { updateForm('theme', t); regenerateSources(t, null); }}
                    style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${formData.theme === t ? 'var(--accent)' : 'var(--border)'}`, background: formData.theme === t ? 'var(--accent-dim)' : 'var(--bg-3)', color: formData.theme === t ? 'var(--accent)' : 'var(--text-2)', transition: 'all 0.2s' }}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>Color Palette</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Black & White', 'Dark Mode', 'Purple & Yellow', 'Neon', 'Pastel', 'Vintage'].map(c => (
                  <div 
                    key={c}
                    onClick={() => { updateForm('colorPalette', c); regenerateSources(null, c); }}
                    style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${formData.colorPalette === c ? 'var(--accent)' : 'var(--border)'}`, background: formData.colorPalette === c ? 'var(--accent-dim)' : 'var(--bg-3)', color: formData.colorPalette === c ? 'var(--accent)' : 'var(--text-2)', transition: 'all 0.2s' }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Generated Pipelines</label>
                <button onClick={() => updateForm('sources', [...formData.sources, { id: Date.now(), platform: 'youtube', url: '', frequency: '5min', extract_mode: 'latest' }])} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={14} /> Add Source
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {formData.sources.map((src, index) => (
                  <div key={src.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <select 
                      value={src.platform}
                      onChange={(e) => {
                        const newSrc = [...formData.sources];
                        newSrc[index].platform = e.target.value;
                        updateForm('sources', newSrc);
                      }}
                      style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none', width: 140 }}
                    >
                      <option value="pinterest">Pinterest</option>
                      <option value="google">Google</option>
                      <option value="youtube">YouTube</option>
                      <option value="youtube_music">YouTube Music</option>
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram</option>
                    </select>
                    <div style={{ display: 'flex', flex: 1, gap: 8 }}>
                      <input 
                        value={src.url}
                        onChange={(e) => {
                          const newSrc = [...formData.sources];
                          newSrc[index].url = e.target.value;
                          updateForm('sources', newSrc);
                        }}
                        placeholder="Enter search query or URL..."
                        style={{ flex: 1, background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13 }}
                      />
                      <select 
                        value={src.frequency || '5min'}
                        onChange={(e) => {
                          const newSrc = [...formData.sources];
                          newSrc[index].frequency = e.target.value;
                          updateForm('sources', newSrc);
                        }}
                        style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none', width: 110 }}
                      >
                        <option value="5min">5 Min</option>
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="on_demand">On Demand</option>
                        <option value="extract_all">Extract All</option>
                      </select>
                      <select 
                        value={src.extract_mode || 'latest'}
                        onChange={(e) => {
                          const newSrc = [...formData.sources];
                          newSrc[index].extract_mode = e.target.value;
                          updateForm('sources', newSrc);
                        }}
                        style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none', width: 100 }}
                      >
                        <option value="latest">Latest</option>
                        <option value="oldest">Oldest</option>
                        <option value="popular">Popular</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => {
                        if (formData.sources.length > 1) {
                          updateForm('sources', formData.sources.filter(s => s.id !== src.id));
                        }
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: 8 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="wizard-step fade-in">
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Repurposing Rules</h2>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 32 }}>Configure automated video editing operations (FFMPEG pipeline).</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              <Card className="glass" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Auto-Crop Aspect Ratio</div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Center-crop images and videos to this aspect ratio.</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <select 
                      value={formData.aspectRatio} 
                      onChange={e => updateForm('aspectRatio', e.target.value)}
                      style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                    >
                      <option value="9:16">9:16 (Vertical)</option>
                      <option value="1:1">1:1 (Square)</option>
                      <option value="3:4">3:4 (Portrait)</option>
                      <option value="4:5">4:5 (Portrait)</option>
                      <option value="16:9">16:9 (Landscape)</option>
                    </select>
                    <div onClick={() => updateForm('rules', { ...formData.rules, autoCrop: !formData.rules.autoCrop })} style={{ cursor: 'pointer', color: formData.rules.autoCrop ? 'var(--text)' : 'var(--text-3)' }}>
                      {formData.rules.autoCrop ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                  </div>
                </div>
              </Card>
              
              {Object.entries({
                extractClips: { label: 'Trim to 15s Segments', desc: 'Programmatically slice long-form videos into 15-second chunks.' },
                removeAudio: { label: 'Strip Original Audio', desc: 'Mute original audio to prepare for trending sound overlays.' },
                watermark: { label: 'Apply Custom Watermark', desc: 'Burn the persona handle into the bottom right corner.' },
              }).map(([key, info]) => (
                <Card key={key} className="glass" style={{ padding: '20px 24px', cursor: 'pointer' }} onClick={() => updateForm('rules', { ...formData.rules, [key]: !formData.rules[key] })}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{info.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{info.desc}</div>
                    </div>
                    <div style={{ color: formData.rules[key] ? 'var(--text)' : 'var(--text-3)' }}>
                      {formData.rules[key] ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="wizard-step fade-in">
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--text)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Sparkles size={32} />
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Ready to Deploy</h2>
              <p style={{ color: 'var(--text-3)', fontSize: 14 }}>The engine will initialize {formData.sources.length} pipelines for {formData.name || 'this persona'}.</p>
            </div>
            
            <Card className="glass" style={{ padding: 24, marginBottom: 32 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 16 }}>Configuration Summary</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)', fontSize: 14 }}>Goal</span>
                  <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{formData.globalGoal || 'None set'}</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)', fontSize: 14 }}>Sources</span>
                  <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{formData.sources.length} Connected</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-2)', fontSize: 14 }}>Mode</span>
                  <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>{formData.isFanAccount ? 'Fan Aggregator' : 'First Person'}</span>
                </div>
              </div>
            </Card>

            <button 
              onClick={handleDeploy}
              disabled={isDeploying}
              style={{ width: '100%', background: 'var(--text)', color: 'var(--bg)', padding: '16px', borderRadius: 'var(--radius)', fontSize: 16, fontWeight: 700, border: 'none', cursor: isDeploying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: isDeploying ? 0.7 : 1 }}
            >
              <Target size={20} /> {isDeploying ? 'Initializing Pipelines...' : 'Initialize & Launch'}
            </button>
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      
      {/* Header & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, color: 'var(--text-3)', fontSize: 14, fontWeight: 600 }}>
        <span onClick={() => navigate(`/b/${business.id}/personas`)} style={{ cursor: 'pointer', transition: 'color 0.2s' }} className="hover-text">Personas</span>
        <ChevronRight size={16} />
        <span style={{ color: 'var(--text)' }}>Create New</span>
      </div>

      {/* Progress Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, left: 0, right: 0, height: 2, background: 'var(--border)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 16, left: 0, height: 2, background: 'var(--text)', zIndex: 1, width: `${((step - 1) / (steps.length - 1)) * 100}%`, transition: 'width 0.3s ease' }} />
        
        {steps.map(s => {
          const isActive = step === s.id;
          const isPassed = step > s.id;
          return (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 2, background: 'var(--bg)', padding: '0 8px' }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: '50%', 
                background: isActive || isPassed ? 'var(--text)' : 'var(--bg-3)',
                border: `2px solid ${isActive || isPassed ? 'var(--text)' : 'var(--border)'}`,
                color: isActive || isPassed ? 'var(--bg)' : 'var(--text-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s'
              }}>
                <s.icon size={16} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: isActive ? 'var(--text)' : 'var(--text-3)' }}>{s.title}</span>
            </div>
          )
        })}
      </div>

      {/* Content Area */}
      <div style={{ minHeight: 400 }}>
        {renderStepContent()}
      </div>

      {/* Footer Navigation */}
      {step < 5 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <button 
            onClick={handlePrev} 
            disabled={step === 1}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', color: step === 1 ? 'var(--text-3)' : 'var(--text)', border: 'none', fontSize: 14, fontWeight: 600, cursor: step === 1 ? 'default' : 'pointer' }}
          >
            <ChevronLeft size={18} /> Back
          </button>
          
          <button 
            onClick={handleNext}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--text)', color: 'var(--bg)', padding: '12px 24px', borderRadius: '24px', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}
      
      <style>{`
        .hover-text:hover { color: var(--text) !important; }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
