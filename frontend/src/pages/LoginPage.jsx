import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import FluidBackground from '../components/FluidBackground';

const DEMO_EMAIL = 'admin@fraudguard.io';
const DEMO_PASSWORD = 'demo1234';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    if (email.trim() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      sessionStorage.setItem('fg_auth', '1');
      sessionStorage.setItem('fg_user', JSON.stringify({ name: 'Mohit', initials: 'MS', email }));
      onLogin?.();
      navigate('/', { replace: true });
    } else {
      setError('Invalid credentials. Try admin@fraudguard.io / demo1234');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <FluidBackground />

      <div
        className="relative z-10 w-full max-w-[420px] flex flex-col gap-6"
        style={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
      >
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-[60px] h-[60px] rounded-[22px] bg-gradient-to-br from-[#1769FF] to-[#2F80FF] shadow-[0_8px_28px_rgba(23,105,255,0.38)] flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-[#0B1B3A] font-[family-name:var(--font-display)] tracking-tight">
              FraudGuard
            </h1>
            <p className="text-[13px] text-[#58709A] mt-0.5">AI Fraud Investigation Platform</p>
          </div>
        </div>

        {/* Glass Card */}
        <div className="glass-card-strong" style={{ padding: '32px 28px' }}>
          <h2 className="text-[20px] font-bold text-[#0B1B3A] font-[family-name:var(--font-display)] mb-1">
            Sign in to your account
          </h2>
          <p className="text-[13px] text-[#58709A] mb-6">
            Use demo credentials to explore the platform
          </p>

          {error && (
            <div className="flex items-start gap-2.5 mb-4 p-3 rounded-xl bg-[#F04444]/10 border border-[#F04444]/25">
              <AlertCircle className="w-4 h-4 text-[#F04444] shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-[12.5px] text-[#C0392B] font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#29466F]" htmlFor="login-email">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fraudguard.io"
                className="glass-input h-[46px] px-4 text-[14px] text-[#0B1B3A] placeholder:text-[#7C8DA8] outline-none rounded-[14px] w-full transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#29466F]" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="demo1234"
                  className="glass-input h-[46px] px-4 pr-12 text-[14px] text-[#0B1B3A] placeholder:text-[#7C8DA8] outline-none rounded-[14px] w-full transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7C8DA8] hover:text-[#0B1B3A] transition-colors cursor-pointer"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Demo hint */}
            <div className="glass-inset rounded-xl p-3 text-[12px] text-[#52698F]">
              <strong className="text-[#1769FF]">Demo credentials:</strong>{' '}
              <code className="font-mono">admin@fraudguard.io</code> /{' '}
              <code className="font-mono">demo1234</code>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary h-[48px] text-[14px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-[#7C8DA8]">
          FraudGuard © 2026 · Detect · Connect · Prevent
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
