import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Target, ArrowRight, Briefcase } from 'lucide-react';
import Card from '../components/Card';

export default function Onboarding({ onComplete }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const handleGenerate = () => {
    if (!name) return alert('Please enter a Business / Artist Name first to generate tailored goals.');
    setGenerating(true);
    setTimeout(() => {
      setSuggestions([
        `Flood all social platforms with high-quality clips of ${name} to maximize viral reach and brand awareness.`,
        `Build a dedicated fan community for ${name} by consistently posting behind-the-scenes content and fan edits.`,
        `Drive massive traffic to ${name}'s latest releases by repurposing long-form content into daily short-form reels.`,
      ]);
      setGenerating(false);
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !goal) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('businesses').insert({
        user_id: user.id,
        name,
        goal
      });

      if (error) throw error;
      
      // Notify parent to unlock app
      if (onComplete) onComplete();
      
    } catch (err) {
      alert('Error creating business: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 500, width: '100%', padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--accent)' }}>
            <Briefcase size={32} color="var(--accent)" />
          </div>
          <h1 className="text-gradient" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px' }}>Welcome to Persona Hub</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 15, marginTop: 8 }}>Let's set up your first Business or Project.</p>
        </div>
        
        <Card className="glass" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8, letterSpacing: '0.5px' }}>Business / Artist Name</label>
              <input 
                type="text" 
                required 
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Mani Raé"
                style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 15 }}
              />
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.5px' }}>
                  <Target size={16} color="var(--accent)" /> Primary Goal
                </label>
                <button 
                  type="button" 
                  onClick={handleGenerate} 
                  disabled={generating || !name}
                  style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: generating || !name ? 'not-allowed' : 'pointer', opacity: generating || !name ? 0.5 : 1 }}
                >
                  {generating ? 'Generating...' : 'Auto-Generate Ideas'}
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>Define the main objective for this network. You can write your own or select a generated idea.</p>
              
              {suggestions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {suggestions.map((s, i) => (
                    <div 
                      key={i} 
                      onClick={() => setGoal(s)}
                      style={{ padding: '10px 14px', background: goal === s ? 'var(--accent-dim)' : 'var(--bg-3)', border: `1px solid ${goal === s ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', fontSize: 13, color: goal === s ? 'var(--accent)' : 'var(--text-2)', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}

              <textarea 
                required 
                value={goal} 
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g. Flood the internet with content about Mani Raé for maximum exposure."
                style={{ width: '100%', height: 100, background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, resize: 'none', fontFamily: 'inherit' }}
              />
            </div>
            
            <button 
              disabled={loading || !name || !goal} 
              type="submit" 
              style={{ background: 'var(--text)', color: 'var(--bg)', border: 'none', padding: '16px', borderRadius: 'var(--radius)', fontSize: 15, fontWeight: 700, cursor: loading || !name || !goal ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading || !name || !goal ? 0.5 : 1, marginTop: 8 }}
            >
              {loading ? 'Creating...' : 'Initialize Workspace'} <ArrowRight size={18} />
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
