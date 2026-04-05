import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { LogOut, ExternalLink, Mail, ShieldAlert, Sun, Moon } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Table state
  const [aliases, setAliases] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 8;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    
    supabase!.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchAliases();
      // Sync session token to extension background if in extension
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ sb_session: session });
      }
    } else {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove('sb_session');
      }
    }
  }, [session, page]);

  const fetchAliases = async () => {
    if (!supabase) return;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;

    const { data, error, count } = await supabase
      .from('aliases')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (!error && data) {
      setAliases(data);
      if (count !== null) setTotalCount(count);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!supabase) return;
    setLoading(true);
    
    const { error } = isLogin 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) setAuthError(error.message);
    setLoading(false);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const openInTab = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'index.html' });
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="container flex-center" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <button className="btn btn-icon" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <ShieldAlert size={48} color="var(--error-color)" style={{ marginBottom: '16px' }} />
          <h2>Setup Required</h2>
          <p style={{ marginTop: '8px' }}>Please set up your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex-center"><div className="loader"></div></div>;
  }

  if (!session) {
    return (
      <div className="container flex-center" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <button className="btn btn-icon" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="glass-panel" style={{ padding: '24px', width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Mail size={32} color="var(--accent-color)" />
            <h2 style={{ marginTop: '8px' }}>Email Sellout</h2>
            <p>Generate aliases, ditch spam.</p>
          </div>
          
          <form onSubmit={handleAuth}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                className="glass-input"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                className="glass-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {authError && <p style={{ color: 'var(--error-color)', marginBottom: '16px', fontSize: '0.75rem' }}>{authError}</p>}
            
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '12px' }} disabled={loading}>
              {loading ? <div className="loader" style={{width: 14, height: 14}}></div> : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
            <p style={{ textAlign: 'center', cursor: 'pointer', color: 'var(--accent-color)' }} onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </p>
          </form>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  return (
    <>
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={20} color="var(--accent-color)" />
          <h3 style={{ fontSize: '1rem' }}>Aliases</h3>
        </div>
        <div className="header-actions">
          <button className="btn btn-icon" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn btn-icon" onClick={openInTab} title="Open in Tab">
            <ExternalLink size={18} />
          </button>
          <button className="btn btn-icon" onClick={handleLogout} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="container" style={{ flex: 1 }}>
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Alias</th>
              </tr>
            </thead>
            <tbody>
              {aliases.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No aliases generated yet.
                  </td>
                </tr>
              ) : (
                aliases.map(alias => (
                  <tr key={alias.id}>
                    <td style={{ fontWeight: 500 }}>{alias.domain}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{alias.alias_email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div className="pagination">
            <button 
              className={`btn ${page === 1 ? 'btn-disabled' : ''}`} 
              style={{ background: 'var(--panel-bg)' }}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button 
              className={`btn ${page === totalPages ? 'btn-disabled' : ''}`}
              style={{ background: 'var(--panel-bg)' }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
