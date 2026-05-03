import React from 'react';
import { AtlasLogo, Icon } from './ui';
import { AtlasAPI } from './api';

const PERSIST_KEY = 'atlas-onboarding-state';

export const Login = ({ onLogin, onBack, onSignup }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await AtlasAPI.auth.login(email, password);
      onLogin(user);
    } catch (e) {
      alert('Login failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const user = await AtlasAPI.auth.loginWithGoogle();
      onLogin(user);
    } catch (e) {
      alert('Google Login failed: ' + e.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ cursor: 'pointer' }} onClick={onBack}><AtlasLogo/></div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          New to Atlas? <a onClick={onSignup} style={{ color: 'var(--ink-1)', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--ink-5)', textUnderlineOffset: 3 }}>Create an account</a>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 32 }}>Log in to your Atlas workspace.</div>
          <button className="btn btn-lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }} onClick={handleGoogle}>
            <Icon name="google" size={16}/>
            Continue with Google
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', fontSize: 11, color: 'var(--ink-4)' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            <span className="eyebrow">or with email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Email</label>
              <input className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>Password</label>
                <a style={{ fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer' }}>Forgot?</a>
              </div>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Onboarding
export const Onboarding = ({ onComplete, onBack }) => {
  const [step, setStep] = React.useState(0);
  const [detecting, setDetecting] = React.useState(false);
  const [detectDone, setDetectDone] = React.useState(false);
  const [bizName, setBizName] = React.useState("Priya's Bakes");
  const [bizAddr, setBizAddr] = React.useState('Shop 4, Aundh Market, Pune, Maharashtra 411007');
  const [bizType, setBizType] = React.useState('Home Baker');
  const [goals, setGoals] = React.useState(['rev', 'repeat']);
  const [uploads, setUploads] = React.useState([]);
  const [integrations, setIntegrations] = React.useState({ gbiz: true, square: false, ig: false, shop: false });
  
  // New account state
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Persist state
  React.useEffect(() => {
    const saved = sessionStorage.getItem(PERSIST_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStep(parsed.step || 0);
        setBizName(parsed.bizName || "Priya's Bakes");
        setBizAddr(parsed.bizAddr || "");
        setBizType(parsed.bizType || "Business");
        setGoals(parsed.goals || []);
        setEmail(parsed.email || "");
        setDetectDone(parsed.detectDone || false);
      } catch (e) {}
    }
  }, []);

  React.useEffect(() => {
    const state = { step, bizName, bizAddr, bizType, goals, email, detectDone };
    sessionStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  }, [step, bizName, bizAddr, bizType, goals, email, detectDone]);

  const steps = ['Business', 'Detection', 'Data', 'Goals', 'Account'];
  const goalOptions = [
    { id: 'rev', label: 'Increase revenue' },
    { id: 'csat', label: 'Improve customer satisfaction' },
    { id: 'inv', label: 'Optimize inventory' },
    { id: 'delays', label: 'Reduce delays' },
    { id: 'repeat', label: 'Increase repeat customers' },
  ];

  const next = async () => {
    if (step === 0 && !detectDone) {
      setStep(1);
      setDetecting(true);
      AtlasAPI.businesses.detect(bizName, bizAddr).then((data) => {
        setDetecting(false);
        setDetectDone(true);
        if (data && data.category) setBizType(data.category);
      }).catch(e => {
        setDetecting(false); 
        setDetectDone(true);
      });
      return;
    }
    
    if (step < 4) {
      setStep(step + 1);
    } else {
      if (!email || !password) {
        alert('Please enter your email and password');
        return;
      }
      setDetecting(true);
      try {
        const user = await AtlasAPI.auth.signup({ email, password, name: bizName });
        await AtlasAPI.businesses.create({ name: bizName, category: bizType, address: bizAddr, goals: goals });
        sessionStorage.removeItem(PERSIST_KEY);
        onComplete(user);
      } catch (e) {
        alert('Setup failed: ' + e.message);
      } finally {
        setDetecting(false);
      }
    }
  };
  const prev = () => step > 0 ? setStep(step - 1) : onBack();

  const toggleGoal = (id) => setGoals(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
        <div onClick={onBack} style={{ cursor: 'pointer' }}><AtlasLogo/></div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>STEP {step + 1} / 5</div>
      </div>

      {/* Stepper */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: i <= step ? '1px solid var(--ink-1)' : '1px solid var(--border)',
                  background: i < step ? 'var(--ink-1)' : i === step ? 'var(--ink-1)' : 'var(--bg-elevated)',
                  color: i <= step ? 'white' : 'var(--ink-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600,
                }}>
                  {i < step ? <Icon name="check" size={11} strokeWidth={2.5} color="white"/> : i + 1}
                </div>
                <span style={{ fontSize: 13, color: i <= step ? 'var(--ink-1)' : 'var(--ink-3)', fontWeight: i === step ? 600 : 400 }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? 'var(--ink-1)' : 'var(--border)' }}/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '48px 32px', overflow: 'auto' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }} key={step} className="fade-in">
          {step === 0 && (
            <>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>Tell us about your business</div>
              <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 32 }}>We'll auto-detect the rest from public sources.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Business name</label>
                  <input className="input" placeholder="e.g. Priya's Bakes" value={bizName} onChange={(e) => setBizName(e.target.value)}/>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Address</label>
                  <input className="input" placeholder="Shop address in Pune, Mumbai, etc." value={bizAddr} onChange={(e) => setBizAddr(e.target.value)}/>
                  <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 6 }}>Used to pull local data — weather, foot traffic, competitor benchmarks.</div>
                </div>
              </div>
            </>
          )}
          {step === 1 && detecting && (
            <div style={{ textAlign: 'center', padding: '40px 0' }} className="fade-in">
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--ink-1)', margin: '0 auto 24px', animation: 'spin 600ms linear infinite' }}/>
              <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.015em', marginBottom: 8 }}>Detecting your business…</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>Searching Google Business, local listings, and category signals.</div>
            </div>
          )}
          {step === 1 && !detecting && (
            <>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>We think you run a…</div>
              <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 32 }}>Confirm or edit. This shapes which insights and automations we suggest.</div>
              <div className="card fade-in" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: '#a16207', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>{bizName.substring(0,2).toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{bizName}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{bizAddr}</div>
                    </div>
                  </div>
                  <span className="badge badge-positive"><Icon name="check" size={10} strokeWidth={2.5}/> Smart detected</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-3)' }}>Type</span>
                    <input style={{ background: 'transparent', border: 'none', textAlign: 'right', fontWeight: 500, color: 'inherit' }} value={bizType} onChange={e => setBizType(e.target.value)}/>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--ink-3)' }}>Channel</span><span>WhatsApp orders + local delivery</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--ink-3)' }}>Est. monthly revenue</span><span className="mono">₹80K–1.5L</span></div>
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>Add your data</div>
              <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 32 }}>Upload files or connect a system. The more Atlas sees, the sharper its recommendations.</div>
              <div className="card" style={{ padding: 24, borderStyle: 'dashed', textAlign: 'center', cursor: 'pointer', marginBottom: 24, borderColor: 'var(--border-strong)' }}
                onClick={() => setUploads([...uploads, { name: 'reviews-export.pdf', kind: 'pdf', size: '512 KB' }])}>
                <Icon name="upload" size={20} />
                <div style={{ fontSize: 14, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>Drop files here or click to upload</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>PDF · CSV · PNG/JPG · XLSX · up to 50MB</div>
              </div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Connect a system</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {[
                  { id: 'gbiz', name: 'Google Business', sub: 'Reviews, traffic', mock: false },
                  { id: 'square', name: 'Square POS', sub: 'Sales, products', mock: true },
                ].map(intg => (
                  <button key={intg.id} className="card" style={{
                    padding: 14, textAlign: 'left', cursor: 'pointer',
                    border: integrations[intg.id] ? '1px solid var(--ink-1)' : '1px solid var(--border)',
                    background: integrations[intg.id] ? 'var(--bg-subtle)' : 'var(--bg-elevated)',
                  }} onClick={() => setIntegrations({ ...integrations, [intg.id]: !integrations[intg.id] })}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{intg.name}</div>
                      {integrations[intg.id] && <Icon name="check" size={14} color="var(--ink-1)"/>}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>What are you optimizing for?</div>
              <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 32 }}>Pick all that apply. Atlas will weight insights and actions accordingly.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {goalOptions.map(g => {
                  const sel = goals.includes(g.id);
                  return (
                    <button key={g.id} className="card" style={{
                      padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      border: sel ? '1px solid var(--ink-1)' : '1px solid var(--border)',
                      background: sel ? 'var(--bg-subtle)' : 'var(--bg-elevated)',
                    }} onClick={() => toggleGoal(g.id)}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{g.label}</span>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: sel ? '1px solid var(--ink-1)' : '1px solid var(--border-strong)', background: sel ? 'var(--ink-1)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {sel && <Icon name="check" size={12} strokeWidth={2.5} color="white"/>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8 }}>Create your account</div>
              <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 32 }}>Last step. Access your Atlas workspace from any device.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Email address</label>
                  <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Password</label>
                  <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn" onClick={prev}>{step === 0 ? 'Cancel' : 'Back'}</button>
          <button className="btn btn-primary" onClick={next} disabled={detecting} style={{ opacity: detecting ? 0.5 : 1, cursor: detecting ? 'not-allowed' : 'pointer' }}>
            {detecting ? 'Working…' : step === 4 ? 'Finish setup' : 'Continue'}
            {!detecting && <Icon name="arrow-right" size={14}/>}
          </button>
        </div>
      </div>
    </div>
  );
};
