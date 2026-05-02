import React, { useState, useEffect } from 'react';
import { Landing } from './landing';
import { Login, Onboarding } from './auth-onboarding';
import { Sidebar, TopBar, BusinessSwitcher } from './shell';
import { Overview } from './overview';
import { Analytics, DataSources, Automations, Reports, Settings } from './pages';
import { PricingPage } from './pricing';
import { DocsPage } from './docs';
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
  const [page, setPage] = useState('overview');
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [apiBusinesses, setApiBusinesses] = useState([]);
  const [currentBusiness, setCurrentBusiness] = useState(null);

  useEffect(() => {
    if (view === 'dashboard') {
      import('./api').then(({ AtlasAPI }) => {
        AtlasAPI.businesses.list().then(list => {
          if (list && list.length > 0) {
            setApiBusinesses(list);
            // If current bizId is not in the list, pick the first one
            if (!bizId || !list.find(b => b.id === bizId)) {
              setBizId(list[0].id);
            }
          }
        }).catch(() => {});
      });
    }
  }, [view]);

  useEffect(() => {
    if (view === 'dashboard' && bizId) {
      import('./api').then(({ AtlasAPI }) => {
        AtlasAPI.businesses.get(bizId).then(data => {
          setCurrentBusiness(data);
        }).catch(() => {
          // Fallback to static if API fails or not found (e.g. mock IDs)
          if (ATLAS_BUSINESSES[bizId]) {
            setCurrentBusiness(ATLAS_BUSINESSES[bizId]);
          }
        });
      });
    }
  }, [view, bizId]);

  const business = currentBusiness || ATLAS_BUSINESSES[bizId] || ATLAS_BUSINESSES['baker'];

  useEffect(() => {
    import('./api').then(({ AtlasAPI }) => {
      AtlasAPI.auth.me().then(() => {
        // If already logged in, go to dashboard
        setView('dashboard');
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('atlas-state');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.view) setView(s.view);
        if (s.bizId) setBizId(s.bizId);
        if (s.page) setPage(s.page);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem('atlas-state', JSON.stringify({ view, bizId, page })); } catch (e) {}
  }, [view, bizId, page]);

  const handleDemo = (id) => { setBizId(id); setView('dashboard'); setPage('overview'); };
  const handleLogin = () => setView('dashboard');
  const handleOnboardComplete = () => { setView('dashboard'); setPage('overview'); };

  const PageComponent = {
    overview: Overview,
    analytics: Analytics,
    sources: DataSources,
    automations: Automations,
    reports: Reports,
    settings: Settings,
  }[page] || Overview;

  const sharpClass = tweaks.sharpEdges ? 'sharp' : '';
  const densityClass = tweaks.density === 'compact' ? 'compact' : '';
  const darkClass = tweaks.theme === 'dark' ? 'dark' : '';

  return (
    <div className={`${sharpClass} ${densityClass} ${darkClass}`} style={{ minHeight: '100vh' }} data-screen-label={view === 'dashboard' ? page : view}>
      {view === 'landing' && <Landing onDemo={handleDemo} onLogin={() => setView('login')} onSignup={() => setView('onboarding')} onNavigate={setView}/>}
      {view === 'login' && <Login onLogin={handleLogin} onBack={() => setView('landing')} onSignup={() => setView('onboarding')}/>}
      {view === 'onboarding' && <Onboarding onComplete={handleOnboardComplete} onBack={() => setView('landing')}/>}
      {view === 'pricing' && <PricingPage onBack={() => setView('landing')} onDemo={handleDemo} onSignup={() => setView('onboarding')} onLogin={() => setView('login')} onNavigate={setView}/>}
      {view === 'docs' && <DocsPage onBack={() => setView('landing')} onDemo={handleDemo} onSignup={() => setView('onboarding')} onLogin={() => setView('login')} onNavigate={setView}/>}
      {view === 'dashboard' && (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar
            active={page}
            onChange={setPage}
            business={business}
            onSwitch={() => setShowSwitcher(true)}
            onExit={() => { import('./api').then(({ AtlasAPI }) => AtlasAPI.auth.logout()); setView('landing'); }}
          />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <TopBar
              title={({ overview: 'Overview', analytics: 'Analytics', sources: 'Data sources', automations: 'Automations', reports: 'Reports', settings: 'Settings' })[page]}
              business={business}
            />
            <div style={{ flex: 1 }}>
              <PageComponent business={business} key={bizId + page}/>
            </div>
          </div>
          {showSwitcher && <BusinessSwitcher current={business} allBusinessList={[...apiBusinesses.map(b => ({ id: b.id, name: b.name })), ...ATLAS_BUSINESS_LIST]} allBusinesses={allBusinesses} onSelect={setBizId} onClose={() => setShowSwitcher(false)}/>}
        </div>
      )}

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
    </div>
  );
}
