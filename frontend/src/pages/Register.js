import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight, Zap } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username:'', email:'', password:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6)       { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      toast.success('Account created! Sign in to continue.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background:'#07080f' }}>
      <div className="w-full max-w-sm fade-in">

        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-lg leading-tight">Finova</p>
            <p className="text-[10px] text-violet-400 leading-tight">Track less. Grow more.</p>
          </div>
        </div>

        <h2 className="font-display text-2xl font-bold text-white mb-1">Create account</h2>
        <p className="text-slate-400 text-sm mb-7">Start your financial journey — free forever.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Username</label>
            <input type="text" placeholder="john_doe" value={form.username}
              onChange={e => setForm({...form, username:e.target.value})}
              className="input-field" required autoFocus />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input type="email" placeholder="john@example.com" value={form.email}
              onChange={e => setForm({...form, email:e.target.value})}
              className="input-field" required />
          </div>
          <div>
            <label className="input-label">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters"
                value={form.password} onChange={e => setForm({...form, password:e.target.value})}
                className="input-field pr-11" required />
              <button type="button" onClick={() => setShowPw(p=>!p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
              </button>
            </div>
          </div>
          <div>
            <label className="input-label">Confirm password</label>
            <input type="password" placeholder="••••••••" value={form.confirm}
              onChange={e => setForm({...form, confirm:e.target.value})}
              className="input-field" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-sm">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <>Create Account <ArrowRight size={16}/></>}
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
