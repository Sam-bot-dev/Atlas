import React, { useState, useEffect, useCallback } from 'react';
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
    if (view === 'dashboard') {
      loadAtlasAPI().then((AtlasAPI) => {
        AtlasAPI.businesses.list().then((list) => {
          if (list && list.length > 0) {
            setApiBusinesses(list);
            if (!bizId || !list.find((b) => b.id === bizId)) {
              setBizId(list[0].id);
            }
          }
        }).catch(() => {});
      });
    }
  }, [view, bizId, loadAtlasAPI]);

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
        const user = await AtlasAPI.auth.me();
        setCurrentUser(user);
        setView('dashboard');
      } catch {
        try {
          const saved = sessionStorage.getItem('atlas-state');
          if (saved) {
            const s = JSON.parse(saved);
            if (s.view) setView(s.view);
            if (s.page) setPage(s.page);
            if (s.bizId) {
              const allIds = [
                ...apiBusinesses.map((b) => b.id),
                ...Object.keys(ATLAS_BUSINESSES)
              ];
              if (allIds.includes(s.bizId)) {
                setBizId(s.bizId);
              }
            }
          }
} catch (e) {
        // Ignore storage errors
      }
    }
    });
  }, []);

  useEffect(() => {
    try { 
      sessionStorage.setItem('atlas-state', JSON.stringify({ view, bizId, page })); 
    } catch (e) {
      // Ignore storage errors
    }
  }, [view, bizId, page]);

  const handleDemo = async (id) => {
    try {
      const { AtlasAPI } = await loadAtlasAPI();
      await AtlasAPI.auth.login('demo@atlas.ai', 'atlas123');
      setIsDemoMode(true);
      setBizId(id);
      setView('dashboard');
      setPage('overview');
    } catch (e) {
      console.error('Demo login failed:', e);
    }
  };

  const handleLogin = (user) => { 
    if (user) setCurrentUser(user); 
    setView('dashboard'); 
  };

  const handleOnboardComplete = (user) => { 
    if (user) setCurrentUser(user); 
    setView('dashboard'); 
    setPage('overview'); 
  };

  const allBusinesses = apiBusinesses.reduce((acc, biz) => ({
    ...acc,
    [biz.id]: {
      ...ATLAS_BUSINESSES[biz.id],
      ...biz,
      type: biz.type || biz.category || ATLAS_BUSINESSES[biz.id]?.type || 'Business',
      location: biz.location || biz.address || ATLAS_BUSINESSES[biz.id]?.location || '',
      initials: biz.initials || biz.name?.slice(0, 2).toUpperCase() || 'AT',
      metrics: biz.metrics || ATLAS_BUSINESSES[biz.id]?.metrics || ATLAS_BUSINESSES.baker.metrics,
      revenueSeries: biz.revenueSeries || ATLAS_BUSINESSES[biz.id]?.revenueSeries || ATLAS_BUSINESSES.baker.revenueSeries,
      ordersSeries: biz.ordersSeries || ATLAS_BUSINESSES[biz.id]?.ordersSeries || ATLAS_BUSINESSES.baker.ordersSeries,
      customerGrowth: biz.customerGrowth || ATLAS_BUSINESSES[biz.id]?.customerGrowth || ATLAS_BUSINESSES.baker.customerGrowth,
      topMovers: biz.topMovers || ATLAS_BUSINESSES[biz.id]?.topMovers || [],
    },
  }), { ...ATLAS_BUSINESSES });

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
              onExit={async () => {
                try {
                  const { AtlasAPI } = await loadAtlasAPI();
                  await AtlasAPI.auth.logout();
                } finally {
                  setCurrentUser(null);
                  setIsDemoMode(false);
                  setView('landing');
                }
              }}
            />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <TopBar
                title={({ overview: 'Overview', analytics: 'Analytics', sources: 'Data sources', automations: 'Automations', reports: 'Reports', settings: 'Settings' })[page]}
                business={currentBusiness || ATLAS_BUSINESSES[bizId] || ATLAS_BUSINESSES['baker']}
                user={currentUser}
              />
              <div style={{ flex: 1 }}>
            <Pages business={currentBusiness || ATLAS_BUSINESSES[bizId] || ATLAS_BUSINESSES['baker']} onRefresh={refreshBusiness} key={bizId + page}/>
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
                allBusinesses={allBusinesses} 
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
          {import.meta.env.DEV && (
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
