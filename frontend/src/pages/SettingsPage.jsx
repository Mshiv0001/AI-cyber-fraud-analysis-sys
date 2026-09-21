import React, { useState } from 'react';
import { Settings, User, Server, Palette, Bell, Shield, Check, Sun, Moon } from 'lucide-react';

const Toggle = ({ value, onChange }) => (
  <button
    role="switch"
    aria-checked={value}
    onClick={() => onChange(!value)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer shrink-0 ${value ? 'bg-[#1769FF]' : 'bg-[#CBD5E1]'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const Section = ({ title, icon: Icon, iconColor, children }) => (
  <div className="glass-card flex flex-col gap-4" style={{ padding: '20px 22px' }}>
    <div className="flex items-center gap-2.5 pb-3 border-b border-white/50">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconColor + '18', border: `1px solid ${iconColor}33` }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} strokeWidth={2.2} />
      </div>
      <h3 className="text-[15px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)]">{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, hint, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
    <div className="sm:w-[160px] shrink-0">
      <p className="text-[13px] font-semibold text-[#29466F] dark:text-[#94A3B8]">{label}</p>
      {hint && <p className="text-[11px] text-[#7C8DA8] mt-0.5">{hint}</p>}
    </div>
    {children}
  </div>
);

export default function SettingsPage({ theme, onThemeChange, onLogout, onToast, user, onUserChange }) {
  const stored = JSON.parse(sessionStorage.getItem('fg_user') || '{}');
  const [name, setName] = useState(user?.name || stored.name || 'Mohit');
  const [initials, setInitials] = useState(user?.initials || stored.initials || 'MS');
  const [backendUrl, setBackendUrl] = useState('http://localhost:5000');
  const [notifHigh, setNotifHigh] = useState(true);
  const [notifBatch, setNotifBatch] = useState(true);
  const [notifModel, setNotifModel] = useState(false);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.initials) setInitials(user.initials);
  }, [user]);

  const handleSave = () => {
    const updated = {
      name: name.trim() || 'Mohit',
      initials: initials.trim() || (name.trim() ? name.trim().slice(0, 2).toUpperCase() : 'MS'),
      email: user?.email || stored.email || 'admin@fraudguard.io',
    };
    sessionStorage.setItem('fg_user', JSON.stringify(updated));
    onUserChange?.(updated);
    setSaved(true);
    onToast?.('Settings saved successfully');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(82,105,143,0.12)', border: '1px solid rgba(82,105,143,0.25)' }}>
            <Settings className="w-5 h-5 text-[#52698F]" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-[24px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)] leading-tight">Settings</h2>
            <p className="text-[13px] text-[#58709A] dark:text-[#94A3B8]">Manage your profile and preferences</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 btn-primary h-[44px] px-5 text-[13px] shrink-0"
        >
          {saved ? <Check className="w-4 h-4" strokeWidth={2.5} /> : null}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profile */}
        <Section title="Profile" icon={User} iconColor="#1769FF">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D9E8FF] to-[#BFD6FF] flex items-center justify-center text-[22px] font-bold text-[#12315D] border-2 border-white/80 shadow-sm">
              {initials || (name.trim() ? name.trim().slice(0, 2).toUpperCase() : 'MS')}
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC]">{name || 'Mohit'}</p>
              <p className="text-[12px] text-[#58709A]">{user?.email || stored.email || 'admin@fraudguard.io'}</p>
            </div>
          </div>
          <Field label="Display name" hint="Shown in the top bar">
            <input value={name} onChange={e => setName(e.target.value)}
              className="glass-input flex-1 h-[42px] px-3.5 text-[13px] text-[#0B1B3A] dark:text-[#F8FAFC] outline-none rounded-[12px]" />
          </Field>
          <Field label="Avatar initials" hint="Max 2 characters">
            <input value={initials} onChange={e => setInitials(e.target.value.slice(0, 2).toUpperCase())}
              maxLength={2}
              className="glass-input h-[42px] px-3.5 text-[13px] text-[#0B1B3A] dark:text-[#F8FAFC] outline-none rounded-[12px] w-[80px]" />
          </Field>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" icon={Palette} iconColor="#8067FF">
          <Field label="Theme" hint="App-wide color mode">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '42px',
                borderRadius: '999px',
                padding: '4px',
                gap: '4px',
                background: 'rgba(185,215,255,0.25)',
                border: '1px solid rgba(255,255,255,0.55)',
                boxShadow: 'inset 0 2px 6px rgba(11,27,58,0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                minWidth: '160px',
              }}
            >
              {[
                { id: 'light', Icon: Sun, label: 'Light' },
                { id: 'dark', Icon: Moon, label: 'Dark' },
              ].map(({ id, Icon, label }) => {
                const isActive = theme === id;
                return (
                  <button
                    key={id}
                    onClick={() => onThemeChange?.(id)}
                    style={{
                      flex: 1,
                      height: '34px',
                      borderRadius: '999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12.5px',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.22s ease',
                      background: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? '#08152e' : '#7C8DA8',
                      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.14)' : 'none',
                    }}
                  >
                    <Icon style={{ width: '14px', height: '14px', color: isActive ? '#08152e' : '#7C8DA8', flexShrink: 0 }} strokeWidth={2} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </Field>
        </Section>

        {/* Backend */}
        <Section title="Backend Connection" icon={Server} iconColor="#18A96B">
          <Field label="Flask API URL" hint="ML prediction endpoint">
            <input value={backendUrl} onChange={e => setBackendUrl(e.target.value)}
              className="glass-input flex-1 h-[42px] px-3.5 text-[13px] text-[#0B1B3A] dark:text-[#F8FAFC] outline-none rounded-[12px] font-mono" />
          </Field>
          <div className="flex items-center gap-2 text-[12px] text-[#18A96B]">
            <div className="w-2 h-2 rounded-full bg-[#18A96B] animate-pulse" />
            Backend connected · LightGBM model loaded
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notifications" icon={Bell} iconColor="#F04444">
          {[
            { label: 'High-risk alerts', hint: 'Score > 0.70', value: notifHigh, set: setNotifHigh },
            { label: 'Batch completion', hint: 'When a scan finishes', value: notifBatch, set: setNotifBatch },
            { label: 'Model updates', hint: 'Retraining events', value: notifModel, set: setNotifModel },
          ].map(n => (
            <Field key={n.label} label={n.label} hint={n.hint}>
              <Toggle value={n.value} onChange={n.set} />
            </Field>
          ))}
        </Section>
      </div>

      {/* Security note */}
      <div className="glass-inset rounded-2xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#1769FF] shrink-0 mt-0.5" strokeWidth={2.2} />
        <div>
          <p className="text-[13px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC]">Demo environment</p>
          <p className="text-[12px] text-[#52698F] dark:text-[#94A3B8] mt-0.5">
            This is a demonstration build. No data is persisted to a server. Session data is stored locally in your browser only.
          </p>
        </div>
      </div>
    </div>
  );
}
