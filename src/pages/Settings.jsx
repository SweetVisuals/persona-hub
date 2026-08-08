import { useState, useEffect } from 'react';
import Card from '../components/Card';
import { Globe, Key, Bell, Shield, Briefcase, Plus, Loader2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBusiness } from '../components/BusinessContext';

const Section = ({ icon: Icon, title, children }) => (
  <Card className="glass" style={{ marginBottom: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={15} color="var(--accent)" />
      </div>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
    </div>
    {children}
  </Card>
);

const Row = ({ label, sub, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
    </div>
    {children}
  </div>
);

const Toggle = ({ on }) => (
  <div style={{
    width: 36, height: 20, borderRadius: 10,
    background: on ? 'var(--accent)' : 'var(--bg-4)',
    border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
    position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
  }}>
    <div style={{
      width: 14, height: 14, borderRadius: '50%', background: '#fff',
      position: 'absolute', top: 2, left: on ? 18 : 2, transition: 'left 0.2s',
    }} />
  </div>
);

export default function Settings() {
  const { business } = useBusiness();
  const [businesses, setBusinesses] = useState([]);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newBusinessGoal, setNewBusinessGoal] = useState('');
  const [addingBusiness, setAddingBusiness] = useState(false);
  const [sources, setSources] = useState([]);
  
  // New Source State
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourcePlatform, setNewSourcePlatform] = useState('pinterest');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceFrequency, setNewSourceFrequency] = useState('5min');
  const [newSourceExtractMode, setNewSourceExtractMode] = useState('latest');

  useEffect(() => {
    if (business) setBusinesses([business]);
    supabase.from('scraping_sources').select('*').is('persona_id', null).then(({ data }) => {
      if (data) setSources(data);
    });
  }, []);

  const handleAddBusiness = async (e) => {
    e.preventDefault();
    if (!newBusinessName || !newBusinessGoal) return;
    setAddingBusiness(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('businesses').insert({
        user_id: user.id,
        name: newBusinessName,
        goal: newBusinessGoal
      }).select().single();
      
      if (error) throw error;
      setBusinesses(prev => [...prev, data]);
      setNewBusinessName('');
      setNewBusinessGoal('');
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingBusiness(false);
    }
  };

  const handleAddSource = async () => {
    if (!newSourceUrl) return;
    try {
      const { data, error } = await supabase.from('scraping_sources').insert({
        persona_id: null, // Global source
        platform: newSourcePlatform,
        url: newSourceUrl,
        frequency: newSourceFrequency,
        extract_mode: newSourceExtractMode
      }).select().single();
      if (error) throw error;
      
      setSources(prev => [...prev, data]);
      setNewSourceUrl('');
      setNewSourceFrequency('5min');
      setNewSourceExtractMode('latest');
      setIsAddingSource(false);
    } catch (err) {
      alert('Error adding source: ' + err.message);
    }
  };

  const handleDeleteSource = async (sourceId) => {
    if (!window.confirm("Remove this sourcing pipeline?")) return;
    try {
      await supabase.from('scraping_sources').delete().eq('id', sourceId);
      setSources(prev => prev.filter(s => s.id !== sourceId));
    } catch (err) {
      alert('Error deleting source: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '28px 24px', width: '100%', maxWidth: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>Settings</h1>
        <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>Configure your workspace, platforms, and automation rules.</p>
      </div>

      <Section icon={Briefcase} title="Businesses & Projects">
        <Row key={business.id} label={business.name} sub={business.goal} />
        
        <form onSubmit={handleAddBusiness} style={{ marginTop: 16, padding: 16, background: 'var(--bg-3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Add Another Business</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <input 
              value={newBusinessName} onChange={e => setNewBusinessName(e.target.value)} 
              placeholder="Business / Artist Name" required
              style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13 }}
            />
            <input 
              value={newBusinessGoal} onChange={e => setNewBusinessGoal(e.target.value)} 
              placeholder="Primary Goal" required
              style={{ background: 'var(--bg-4)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13 }}
            />
            <button 
              type="submit" disabled={addingBusiness}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--text)', color: 'var(--bg)', border: 'none', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: addingBusiness ? 'not-allowed' : 'pointer' }}
            >
              {addingBusiness ? <Loader2 size={14} className="spin" /> : <><Plus size={14} /> Create Business</>}
            </button>
          </div>
        </form>
      </Section>

      <Section icon={Globe} title="Platform Connections">
        {['TikTok', 'Instagram', 'YouTube', 'Snapchat'].map((p, i) => (
          <Row key={p} label={p} sub={i < 2 ? 'Connected via API' : i === 2 ? 'Connected via OAuth' : 'Not connected'}>
            <div style={{
              padding: '4px 12px', borderRadius: 20,
              background: i < 3 ? '#10b98115' : '#ef444415',
              color: i < 3 ? '#10b981' : '#ef4444',
              fontSize: 11, fontWeight: 600,
            }}>
              {i < 3 ? 'Connected' : 'Connect'}
            </div>
          </Row>
        ))}
      </Section>

      <Section icon={Key} title="API Keys">
        {[
          { label: 'TikTok API Key', sub: 'Used for posting and analytics', val: '••••••••••••4f2a' },
          { label: 'Pinterest Scraper Key', sub: 'Used for image sourcing', val: '••••••••••••9c1b' },
          { label: 'YouTube API Key', sub: 'Used for Shorts posting', val: 'Not set' },
        ].map(k => (
          <Row key={k.label} label={k.label} sub={k.sub}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace' }}>{k.val}</span>
              <button style={{
                padding: '4px 10px', borderRadius: 6,
                background: 'var(--bg-4)', border: '1px solid var(--border)',
                fontSize: 11, color: 'var(--text-2)', fontWeight: 500,
              }}>Edit</button>
            </div>
          </Row>
        ))}
      </Section>

      <Section icon={Bell} title="Posting Rules">
        <Row label="Stagger posts between personas" sub="Randomise timing to avoid detection">
          <Toggle on={true} />
        </Row>
        <Row label="Auto-pause on error" sub="Pause persona if a post fails">
          <Toggle on={true} />
        </Row>
        <Row label="Daily post limit" sub="Max posts per account per day">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              defaultValue="4"
              style={{
                width: 50, padding: '4px 8px', borderRadius: 6,
                background: 'var(--bg-4)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, textAlign: 'center',
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>per day</span>
          </div>
        </Row>
      </Section>

      <Section icon={Shield} title="Global Sourcing Pipelines">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Active Pipelines</div>
          <button onClick={() => setIsAddingSource(true)} style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}><Plus size={14}/> Add Source</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sources.map((src) => (
            <div key={src.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)',
              padding: '12px 16px', border: '1px solid var(--border)',
            }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--text-3)', flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{src.url} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({src.platform})</span></div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Extracting to File Browser every {src.frequency}</div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteSource(src.id); }}
                title="Remove Source"
                style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4, opacity: 0.8 }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {sources.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No sources linked yet.</p>
            </div>
          )}
        </div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button style={{
          padding: '10px 22px', borderRadius: 'var(--radius)',
          background: 'var(--text)', color: 'var(--bg)',
          fontSize: 13, fontWeight: 700,
        }}>Save Changes</button>
      </div>

      {/* Add Source Modal */}
      {isAddingSource && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(8px)' }}>
          <Card className="glass" style={{ width: 480, padding: 32, position: 'relative' }}>
            <button onClick={() => { setIsAddingSource(false); setNewSourceUrl(''); }} style={{ position: 'absolute', top: 24, right: 24, background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Add Sourcing Pipeline</h2>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 32 }}>Enter a search query. The autonomous sourcing engine will continually scrape high-quality content matching this query every 5 minutes and save it to the File Browser.</p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                Platform
              </label>
              <select 
                value={newSourcePlatform}
                onChange={(e) => setNewSourcePlatform(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
              >
                <option value="pinterest">Pinterest</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="youtube_music">YouTube Music</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 32 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                Search Query / Keyword
              </label>
              <input 
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                placeholder="e.g. vintage nyc aesthetic"
                style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Frequency
                </label>
                <select 
                  value={newSourceFrequency}
                  onChange={(e) => setNewSourceFrequency(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                >
                  <option value="5min">5 Min</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="on_demand">On Demand</option>
                  <option value="extract_all">Extract All</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Extract Mode
                </label>
                <select 
                  value={newSourceExtractMode}
                  onChange={(e) => setNewSourceExtractMode(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={() => { setIsAddingSource(false); setNewSourceUrl(''); }} style={{ flex: 1, background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', padding: '14px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddSource} disabled={!newSourceUrl} style={{ flex: 2, background: 'var(--text)', color: 'var(--bg)', border: 'none', padding: '14px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: !newSourceUrl ? 'not-allowed' : 'pointer', opacity: !newSourceUrl ? 0.5 : 1 }}>
                Deploy Source
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
