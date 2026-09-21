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
    <div className="min-h-[100dvh] w-full relative flex flex-col items-center justify-center px-4 py-6 sm:py-10 overflow-y-auto">
      <FluidBackground />

      <div
        className="relative z-10 w-full max-w-[400px] sm:max-w-[420px] mx-auto my-auto flex flex-col items-center gap-5 sm:gap-6 py-4"
        style={{
          animation: 'loginCardFadeIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
          margin: 'auto auto',
        }}
      >
        {/* Brand */}
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[18px] sm:rounded-[22px] bg-gradient-to-br from-[#1769FF] to-[#2F80FF] shadow-[0_8px_26px_rgba(23,105,255,0.38)] flex items-center justify-center">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-[25px] sm:text-[28px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)] tracking-tight">
              FraudGuard
            </h1>
            <p className="text-[12.5px] sm:text-[13px] text-[#58709A] dark:text-[#94A3B8] mt-0.5">
              AI Fraud Investigation Platform
            </p>
          </div>
        </div>

        {/* Glass Card */}
        <div
          className="glass-card-strong w-full rounded-2xl"
          style={{ padding: 'clamp(20px, 5vw, 32px) clamp(16px, 5vw, 28px)' }}
        >
          <h2 className="text-[18px] sm:text-[20px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)] mb-1 text-center sm:text-left">
            Sign in to your account
          </h2>
          <p className="text-[12px] sm:text-[13px] text-[#58709A] dark:text-[#94A3B8] mb-5 text-center sm:text-left">
            Use demo credentials to explore the platform
          </p>

          {error && (
            <div className="flex items-start gap-2.5 mb-4 p-3 rounded-xl bg-[#F04444]/10 border border-[#F04444]/25">
              <AlertCircle className="w-4 h-4 text-[#F04444] shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-[12px] sm:text-[12.5px] text-[#C0392B] dark:text-[#F87171] font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 sm:gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] sm:text-[12.5px] font-semibold text-[#29466F] dark:text-[#CBD5E1]" htmlFor="login-email">
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
                className="glass-input h-[46px] px-3.5 sm:px-4 text-[16px] sm:text-[14px] text-[#0B1B3A] dark:text-[#F8FAFC] placeholder:text-[#7C8DA8] outline-none rounded-[14px] w-full transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] sm:text-[12.5px] font-semibold text-[#29466F] dark:text-[#CBD5E1]" htmlFor="login-password">
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
                  className="glass-input h-[46px] px-3.5 sm:px-4 pr-12 text-[16px] sm:text-[14px] text-[#0B1B3A] dark:text-[#F8FAFC] placeholder:text-[#7C8DA8] outline-none rounded-[14px] w-full transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7C8DA8] hover:text-[#0B1B3A] dark:hover:text-white transition-colors cursor-pointer p-1"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Demo credentials with Tap-to-autofill */}
            <div
              onClick={() => {
                setEmail(DEMO_EMAIL);
                setPassword(DEMO_PASSWORD);
              }}
              className="glass-inset rounded-xl p-2.5 sm:p-3 text-[11.5px] sm:text-[12px] text-[#52698F] dark:text-[#94A3B8] cursor-pointer hover:border-[#1769FF]/40 transition-colors flex items-center justify-between group"
              title="Click to fill demo credentials"
            >
              <div className="leading-tight">
                <strong className="text-[#1769FF] dark:text-[#38BDF8]">Demo:</strong>{' '}
                <span className="font-mono text-[11px] sm:text-[11.5px]">admin@fraudguard.io</span> /{' '}
                <span className="font-mono text-[11px] sm:text-[11.5px]">demo1234</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#1769FF] dark:text-[#38BDF8] shrink-0 ml-2 bg-blue-500/10 px-2 py-0.5 rounded-md group-hover:bg-blue-500/20">
                Autofill
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary h-[48px] text-[14px] font-semibold w-full disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation cursor-pointer mt-1"
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

        <p className="text-center text-[11.5px] sm:text-[12px] text-[#7C8DA8] dark:text-[#64748B]">
          FraudGuard © 2026 · Detect · Connect · Prevent
        </p>
      </div>

      <style>{`
        @keyframes loginCardFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
