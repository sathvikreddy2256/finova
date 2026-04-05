import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, Zap, TrendingUp, Shield, Brain } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.username, form.password);
      toast.success('Welcome back!');
      navigate(data.profileComplete ? '/dashboard' : '/onboarding');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#07080f' }}>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[52%] p-14 justify-between border-r border-slate-800/60"
        style={{ background: '#0b0c15' }}>
        <FinovaLogo />

        <div>
          <h1 className="font-display text-5xl font-bold text-white leading-[1.1] mb-5">
            Track less.<br />
            <span className="gradient-text">Grow more.</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-sm">
            Your entire financial life — budgets, investments, taxes, and AI insights — in one clean dashboard.
          </p>

          <div className="space-y-4">
            {[
              { icon: TrendingUp, label: 'Real-time expense & income tracking' },
              { icon: Brain,      label: 'AI predictions — no random data, ever' },
              { icon: Shield,     label: 'Indian tax optimisation (old vs new regime)' },
              { icon: Zap,        label: 'Personalised from day one via onboarding' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-600/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-violet-400" />
                </div>
                <span className="text-slate-300 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-700 text-xs">© {new Date().getFullYear()} Finova. All rights reserved.</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm fade-in">

          <div className="lg:hidden mb-8"><FinovaLogo /></div>

          <h2 className="font-display text-2xl font-bold text-white mb-1">Sign in</h2>
          <p className="text-slate-400 text-sm mb-7">Your financial dashboard awaits.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Username</label>
              <input type="text" placeholder="your_username"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                className="input-field" required autoFocus />
            </div>
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-11" required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-5">
            No account?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium">
              Create one →
            </Link>
          </p>

          <div className="mt-6 p-3 rounded-xl border border-slate-800 bg-slate-900/50">
            <p className="text-xs text-slate-500 text-center">
              Demo &nbsp;
              <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">admin</code>
              &nbsp;/&nbsp;
              <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">admin123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinovaLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
        <Zap size={18} className="text-white" />
      </div>
      <div>
        <p className="font-display font-bold text-white text-lg leading-tight">Finova</p>
        <p className="text-[10px] text-violet-400 leading-tight">Track less. Grow more.</p>
      </div>
    </div>
  );
}
