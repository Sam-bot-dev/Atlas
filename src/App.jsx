import { useState, useEffect, useCallback } from 'react';
import { Landing } from './landing';
import { Login, Onboarding } from './auth-onboarding';
import { Sidebar, TopBar, BusinessSwitcher } from './shell';
import { Icon } from './ui';
import { Overview } from './overview';
import { Pages } from './pages';
import { PricingPage } from './pricing';
import { DocsPage } from './docs';
import { ChatPanel } from './chat';
import {
  useTweaks, TweaksPanel, TweakSection,
  TweakRadio, TweakToggle, TweakSelect,
} from './tweaks-panel';
import { ATLAS_BUSINESSES, ATLAS_BUSINESS_LIST } from './data';

const TWEAK_DEFAULTS = {
  density: 'balanced',
  sharpEdges: false,
  showAtlasGreeting: true,
  theme: 'light',
};

export default function App() {
  const [view, setView] = useState('landing');
  const [bizId, setBizId] = useState('baker');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [page, setPage] = useState('overview');
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false); // Fix #107
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [apiBusinesses, setApiBusinesses] = useState([]);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Memoized dynamic import loader
  const loadAtlasAPI = useCallback(async () => {
    const { AtlasAPI } = await import('./api');
    return AtlasAPI;
  }, []);

  useEffect(() => {
    let active = true;
    if (view === 'dashboard') {
      loadAtlasAPI().then((AtlasAPI) => {
        if (!active) return;
        AtlasAPI.businesses.list().then((list) => {
          if (!active) return;
          if (list && list.length > 0) {
            setApiBusinesses(list);
            if (!bizId || !list.find((b) => b.id === bizId)) {
              setBizId(list[0].id);
            }
          }
        }).catch(() => {});
      });
    }
    return () => { active = false; };
    // Fix #51: bizId removed from deps — it caused a full list refetch on every
    // business switch. The list only needs re-fetching when view changes.
  }, [view, loadAtlasAPI]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshBusiness = useCallback(() => {
    if (view === 'dashboard' && bizId) {
      loadAtlasAPI().then((AtlasAPI) => {
        AtlasAPI.businesses.get(bizId).then((data) => {
          setCurrentBusiness(data);
        }).catch(() => {
          if (ATLAS_BUSINESSES[bizId]) setCurrentBusiness(ATLAS_BUSINESSES[bizId]);
        });
      });
    }
  }, [view, bizId, loadAtlasAPI]);

  useEffect(() => {
    refreshBusiness();
  }, [refreshBusiness]);

  useEffect(() => {
    loadAtlasAPI().then(async (AtlasAPI) => {
       try {
         // Fix #98: only call me() if we don't have a cached user already
         const cachedUser = sessionStorage.getItem('atlas-user');
         if (cachedUser) {
           try {
             const user = JSON.parse(cachedUser);
             setCurrentUser(user);
             // Still verify we have businesses
             const businesses = await AtlasAPI.businesses.list();
             if (businesses && businesses.length > 0) {
               setView('dashboard');
             } else {
               setView('onboarding');
             }
             return;
           } catch {
             // Invalid cache, fall through to fresh fetch
           }
         }

         const user = await AtlasAPI.auth.me();
         setCurrentUser(user);
         // Cache user to avoid repeated me() calls
         try { sessionStorage.setItem('atlas-user', JSON.stringify(user)); } catch { /* ignore */ }
         // Check if user has businesses to decide where to land
         try {
           const businesses = await AtlasAPI.businesses.list();
           if (businesses && businesses.length > 0) {
             setView('dashboard');
           } else {
             setView('onboarding');
           }
         } catch {
           setView('onboarding');
         }
       } catch {
         try {
           const saved = sessionStorage.getItem('atlas-state');
           if (saved) {
             const s = JSON.parse(saved);
             if (s.view) setView(s.view);
             if (s.page) setPage(s.page);
             if (s.bizId) {
               setBizId(s.bizId);
             }
           }
         } catch {
           // Ignore storage errors
         }
       }
     });
   }, [loadAtlasAPI]);

  useEffect(() => {
    try { 
      sessionStorage.setItem('atlas-state', JSON.stringify({ view, bizId, page })); 
    } catch {
      // Ignore storage errors
    }
  }, [view, bizId, page]);

  const handleDemo = async (id) => {
    // Always show demo UI immediately — don't block on login
    setIsDemoMode(true);
    setBizId(id);
    setView('dashboard');
    setPage('overview');
    try {
      const AtlasAPI = await loadAtlasAPI(); // Fix #3: loadAtlasAPI returns AtlasAPI directly
      await AtlasAPI.auth.demoLogin();
    } catch (e) {
      // Demo still works with local data even if backend login fails
      console.warn('Demo backend login failed (demo still works locally):', e.message);
    }
  };

   const handleLogin = (user) => {
     if (!user) return;
     setCurrentUser(user);
     // Check if user has any businesses to decide onboarding vs dashboard
     loadAtlasAPI().then((AtlasAPI) => {
       AtlasAPI.businesses.list()
         .then((list) => {
           if (list && list.length > 0) {
             // Returning user — go to dashboard
             setView('dashboard');
           } else {
             // New user — start onboarding
             setView('onboarding');
           }
         })
         .catch(() => {
           // API error — still go to onboarding to be safe
           setView('onboarding');
         });
     });
   };

  const handleOnboardComplete = (user) => { 
    if (user) setCurrentUser(user); 
    setView('dashboard'); 
    setPage('overview'); 
  };

  const allBusinesses = { ...ATLAS_BUSINESSES, ...Object.fromEntries(apiBusinesses.map(b => [b.id, b])) };

  /** @typedef {{ DEV?: boolean }} ImportMetaEnv */
  /** @type {ImportMeta & { env: ImportMetaEnv }} */
  const importMeta = import.meta;
  const isDev = importMeta.env?.DEV;
  const sharpClass = tweaks.sharpEdges ? 'sharp' : '';
  const densityClass = tweaks.density === 'compact' ? 'compact' : '';
  const darkClass = tweaks.theme === 'dark' ? 'dark' : '';

  // Keyboard shortcut for chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowChat(true);
      }
      // Fix #107: Ctrl/Cmd+Shift+T opens the theme/density panel in all builds
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setShowTweaks(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`${sharpClass} ${densityClass} ${darkClass}`} style={{ minHeight: '100vh' }} data-screen-label={view === 'dashboard' ? page : view}>
      {view === 'landing' && <Landing onDemo={handleDemo} onLogin={() => setView('login')} onSignup={() => setView('onboarding')} onNavigate={setView}/>}
      {view === 'login' && <Login onLogin={handleLogin} onBack={() => setView('landing')} onSignup={() => setView('onboarding')}/>}
      {view === 'onboarding' && <Onboarding onComplete={handleOnboardComplete} onBack={() => setView('landing')}/>}
      {view === 'pricing' && <PricingPage onBack={() => setView('landing')} onDemo={handleDemo} onSignup={() => setView('onboarding')} onLogin={() => setView('login')} onNavigate={setView}/>}
      {view === 'docs' && <DocsPage onBack={() => setView('landing')} onDemo={handleDemo} onSignup={() => setView('onboarding')} onLogin={() => setView('login')} onNavigate={setView}/>}
      {view === 'dashboard' && (
        <>
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar
              active={page}
              onChange={setPage}
              business={currentBusiness || ATLAS_BUSINESSES[bizId] || ATLAS_BUSINESSES['baker']}
              isDemo={isDemoMode || (currentBusiness?.isDemo === true)}
              onSwitch={() => setShowSwitcher(true)}
            user={currentUser}
              onUpgrade={() => setView('pricing')}
              onExit={async () => {
                try {
                  const AtlasAPI = await loadAtlasAPI(); // Fix #3: same destructuring fix
                  await AtlasAPI.auth.logout();
                } finally {
                  setCurrentUser(null);
                  setIsDemoMode(false);
                  sessionStorage.removeItem('atlas-user');
                  sessionStorage.removeItem('atlas-state');
                  setView('landing');
                }
              }}
            />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <TopBar
                title={({ overview: 'Overview', analytics: 'Analytics', sources: 'Data sources', automations: 'Automations', reports: 'Reports', settings: 'Settings' })[page]}
                business={currentBusiness || ATLAS_BUSINESSES[bizId] || ATLAS_BUSINESSES['baker']}
                user={currentUser}
                onExit={async () => {
                  try {
                    const AtlasAPI = await loadAtlasAPI();
                    await AtlasAPI.auth.logout();
                  } finally {
                    setCurrentUser(null);
                    setIsDemoMode(false);
                    sessionStorage.removeItem('atlas-user');
                    sessionStorage.removeItem('atlas-state');
                    setView('landing');
                  }
                }}
              />
              <div style={{ flex: 1 }}>
                {/* Fix #49: don't silently fall back to Priya's Bakes for real users whose
                  business failed to load — show a null-safe placeholder instead */}
              {page === 'overview'
                ? (currentBusiness || ATLAS_BUSINESSES[bizId])
                  ? <Overview business={currentBusiness || ATLAS_BUSINESSES[bizId]} />
                  : <div style={{ padding: 64, textAlign: 'center', color: 'var(--ink-3)' }}>Loading…</div>
                : <Pages business={currentBusiness || ATLAS_BUSINESSES[bizId] || null} onRefresh={refreshBusiness} initialTab={page} key={bizId + page}/>
                }
              </div>
              {/* Chat Trigger FAB */}
              {!showChat && (
                <button 
                  className="btn btn-primary fade-in" 
                  style={{ position: 'fixed', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, boxShadow: 'var(--shadow-lg)', justifyContent: 'center', zIndex: 1900 }}
                  onClick={() => setShowChat(true)}
                >
                  <Icon name="message" size={24}/>
                </button>
              )}
              {showChat && <ChatPanel business={currentBusiness || ATLAS_BUSINESSES[bizId] || ATLAS_BUSINESSES['baker']} onClose={() => setShowChat(false)}/>}
            </div>
            {showSwitcher && (
              <BusinessSwitcher 
                current={currentBusiness || ATLAS_BUSINESSES[bizId] || ATLAS_BUSINESSES['baker']} 
                allBusinessList={[...apiBusinesses.map(b => ({ id: b.id, name: b.name, isDemo: false })), ...ATLAS_BUSINESS_LIST]} 
                onSelect={(id) => {
                  setIsDemoMode(ATLAS_BUSINESS_LIST.some(b => b.id === id));
                  setBizId(id);
                  // Optimistically show known data instantly to avoid baker flash
                  if (allBusinesses[id]) setCurrentBusiness(allBusinesses[id]);
                }} 
                onClose={() => setShowSwitcher(false)}
              />
            )}
          </div>
          {/* Fix #107: available in all builds via Ctrl+Shift+T, not just DEV */}
          {(isDev || showTweaks) && (
            <TweaksPanel title="Tweaks">
              <TweakSection label="Layout">
                <TweakRadio label="Density" value={tweaks.density} onChange={(v) => setTweak('density', v)} options={[{ value: 'balanced', label: 'Balanced' }, { value: 'compact', label: 'Compact' }]}/>
                <TweakToggle label="Sharper corners" value={tweaks.sharpEdges} onChange={(v) => setTweak('sharpEdges', v)}/>
                <TweakRadio label="Theme" value={tweaks.theme} onChange={(v) => setTweak('theme', v)} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}/>
              </TweakSection>
              <TweakSection label="Demo business">
                <TweakSelect label="Active business" value={bizId} onChange={setBizId} options={ATLAS_BUSINESS_LIST.map(b => ({ value: b.id, label: b.name }))}/>
              </TweakSection>
              <TweakSection label="Navigation">
                <TweakSelect label="Jump to view" value={view} onChange={setView} options={[
                  { value: 'landing', label: 'Landing page' },
                  { value: 'pricing', label: 'Pricing' },
                  { value: 'docs', label: 'Docs' },
                  { value: 'login', label: 'Login' },
                  { value: 'onboarding', label: 'Onboarding' },
                  { value: 'dashboard', label: 'Dashboard' },
                ]}/>
                {view === 'dashboard' && (
                  <TweakSelect label="Dashboard page" value={page} onChange={setPage} options={[
                    { value: 'overview', label: 'Overview' },
                    { value: 'analytics', label: 'Analytics' },
                    { value: 'sources', label: 'Data sources' },
                    { value: 'automations', label: 'Automations' },
                    { value: 'reports', label: 'Reports' },
                    { value: 'settings', label: 'Settings' },
                  ]}/>
                )}
              </TweakSection>
            </TweaksPanel>
          )}
        </>
      )}
    </div>
  );
}
