import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, TrendingUp, CreditCard, Calculator,
  Shield, Landmark, Sunset, Brain, LogOut, Menu, X,
  ChevronRight, Zap
} from 'lucide-react';

const NAV = [
  { path: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { path: '/expenses',    label: 'Expenses',    icon: CreditCard },
  { path: '/investments', label: 'Investments', icon: TrendingUp },
  { path: '/tax',         label: 'Tax Planner', icon: Calculator },
  { path: '/insurance',   label: 'Insurance',   icon: Shield },
  { path: '/debt',        label: 'Debt',        icon: Landmark },
  { path: '/retirement',  label: 'Retirement',  icon: Sunset },
  { path: '/ai-insights', label: 'AI Insights', icon: Brain },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);
  const username  = user?.sub || 'User';
  const current   = NAV.find(n => n.path === location.pathname);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#07080f' }}>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/70 z-20 lg:hidden"
          onClick={() => setOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-60
        flex flex-col border-r border-slate-800/70
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ background: '#0b0c15' }}>

        {/* Logo */}
        <div className="p-5 border-b border-slate-800/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-base leading-tight">Finova</p>
              <p className="text-[10px] text-violet-400 leading-tight">Track less. Grow more.</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button key={path} onClick={() => { navigate(path); setOpen(false); }}
                className={`nav-link w-full text-left ${active ? 'active' : ''}`}>
                <Icon size={16} className="flex-shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight size={12} className="ml-auto opacity-60" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-800/70">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {username[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{username}</p>
              <p className="text-[10px] text-slate-500">Member</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="nav-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-slate-800/70 px-5 py-3 flex items-center gap-4"
          style={{ background: '#0b0c15' }}>
          <button className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setOpen(o => !o)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <p className="font-display font-semibold text-white text-sm flex-1">
            {current?.label || 'Finova'}
          </p>
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-500">
              {new Date().toLocaleDateString('en-IN', {
                weekday:'short', day:'numeric', month:'short', year:'numeric'
              })}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
