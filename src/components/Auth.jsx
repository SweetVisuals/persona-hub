import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function Auth({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
        <Loader2 size={32} className="spin" />
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="glass" style={{ width: '100%', maxWidth: 400, padding: 32, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 className="text-gradient" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>Persona Hub</h1>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 8 }}>{isLogin ? 'Sign in to access your empire.' : 'Create your account.'}</p>
          </div>
          
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '12px 16px 12px 44px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input 
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '12px 16px 12px 44px', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14 }}
                />
              </div>
            </div>
            
            {authError && <div style={{ color: 'var(--red)', fontSize: 13, background: 'rgba(255, 68, 68, 0.1)', padding: 12, borderRadius: 'var(--radius)' }}>{authError}</div>}
            
            <button disabled={authLoading} type="submit" style={{ background: 'var(--text)', color: 'var(--bg)', border: 'none', padding: '14px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', marginTop: 8 }}>
              {authLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-3)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => setIsLogin(!isLogin)} style={{ color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}>{isLogin ? 'Sign up' : 'Sign in'}</span>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
