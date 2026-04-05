import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Zap, ArrowRight, ArrowLeft, CheckCircle, TrendingUp, Target, CreditCard, Brain } from 'lucide-react';

const STEPS = [
  { id:'welcome',  title:'Welcome to Finova',         sub:'Set up your profile in 2 minutes' },
  { id:'income',   title:'Your monthly income',       sub:'Used to calculate savings rate and budgets' },
  { id:'expenses', title:'Fixed monthly expenses',    sub:'Rent, EMIs — money that leaves every month' },
  { id:'risk',     title:'Investment risk appetite',  sub:'Helps us build the right portfolio for you' },
  { id:'goals',    title:'Your financial goals',      sub:'What are you working towards?' },
  { id:'personal', title:'About you',                 sub:'For retirement and insurance calculations' },
  { id:'done',     title:'You\'re all set!',          sub:'Your personalised dashboard is ready' },
];

const GOALS = ['Buy a house','Retire early','Child\'s education','Emergency fund',
               'Travel','Start a business','Marriage','Buy a car'];

export default function Onboarding() {
  const { markProfileComplete } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]     = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState({});
  const [form, setForm] = useState({
    monthlyIncome:'', jobType:'SALARIED', fixedExpenses:'',
    riskLevel:'MEDIUM', goals:[], age:'', existingLoans:'0',
  });

  const set = (k, v) => { setForm(f=>({...f,[k]:v})); setErr(e=>({...e,[k]:undefined})); };
  const toggleGoal = g => setForm(f=>({...f, goals: f.goals.includes(g) ? f.goals.filter(x=>x!==g) : [...f.goals,g]}));

  const validate = () => {
    const e = {};
    if (step===1 && (!form.monthlyIncome || +form.monthlyIncome<=0))
      e.monthlyIncome='Enter your monthly income';
    if (step===2) {
      if (form.fixedExpenses==='' || +form.fixedExpenses<0) e.fixedExpenses='Enter 0 if none';
      else if (+form.fixedExpenses>=+form.monthlyIncome)    e.fixedExpenses='Must be less than income';
    }
    if (step===5 && (!form.age || +form.age<18 || +form.age>80)) e.age='Enter age 18–80';
    setErr(e);
    return Object.keys(e).length===0;
  };

  const next = () => { if (!validate()) return; step < STEPS.length-2 ? setStep(s=>s+1) : submit(); };
  const back = () => setStep(s=>Math.max(0,s-1));

  const submit = async () => {
    setSaving(true);
    try {
      await api.post('/user/profile', {
        monthlyIncome: +form.monthlyIncome, jobType: form.jobType,
        fixedExpenses: +form.fixedExpenses, riskLevel: form.riskLevel,
        goals: form.goals.join(', '), age: +form.age,
        existingLoans: +form.existingLoans,
      });
      markProfileComplete();
      setStep(STEPS.length-1);
    } catch (e) { toast.error(e.response?.data?.message || 'Save failed, try again'); }
    finally { setSaving(false); }
  };

  const progress = Math.min(100, Math.round((step/(STEPS.length-2))*100));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{background:'#07080f'}}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-white text-base leading-tight">Finova</p>
          <p className="text-[10px] text-violet-400">Track less. Grow more.</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl fade-in">

        {/* Progress bar */}
        {step < STEPS.length-1 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Step {step+1} of {STEPS.length-1}</span><span>{progress}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full">
              <div className="h-1 bg-violet-500 rounded-full transition-all duration-500" style={{width:`${progress}%`}} />
            </div>
          </div>
        )}

        <h2 className="font-display text-xl font-bold text-white mb-0.5">{STEPS[step].title}</h2>
        <p className="text-slate-400 text-sm mb-6">{STEPS[step].sub}</p>

        {/* ── STEP 0: Welcome ── */}
        {step===0 && (
          <div className="space-y-3">
            {[
              {icon:TrendingUp, t:'Real data only — no fake numbers, ever'},
              {icon:Brain,      t:'AI insights based on your actual spending'},
              {icon:Target,     t:'Tax & investment advice tailored to your profile'},
              {icon:CreditCard, t:'Debt payoff, retirement & insurance planning'},
            ].map(({icon:Icon,t}) => (
              <div key={t} className="flex items-center gap-3 p-3.5 bg-slate-800/50 rounded-xl">
                <div className="p-1.5 bg-violet-600/20 rounded-lg flex-shrink-0">
                  <Icon size={15} className="text-violet-400" />
                </div>
                <span className="text-slate-300 text-sm">{t}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 1: Income ── */}
        {step===1 && (
          <div className="space-y-5">
            <div>
              <label className="input-label">Monthly take-home income (₹)</label>
              <input type="number" placeholder="e.g. 85000" value={form.monthlyIncome}
                onChange={e=>set('monthlyIncome',e.target.value)} className="input-field" autoFocus />
              {err.monthlyIncome && <p className="text-red-400 text-xs mt-1">{err.monthlyIncome}</p>}
              <p className="text-slate-500 text-xs mt-1.5">Net salary after tax, or average monthly earnings.</p>
            </div>
            <div>
              <label className="input-label">Employment type</label>
              <div className="grid grid-cols-2 gap-2">
                {[{v:'SALARIED',l:'💼 Salaried'},{v:'FREELANCER',l:'🖥️ Freelancer'}].map(o=>(
                  <button key={o.v} type="button" onClick={()=>set('jobType',o.v)}
                    className={`p-3.5 rounded-xl border text-sm font-medium transition-all ${
                      form.jobType===o.v
                        ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}>{o.l}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Fixed expenses ── */}
        {step===2 && (
          <div className="space-y-4">
            <div>
              <label className="input-label">Total fixed monthly outflows (₹)</label>
              <input type="number" placeholder="e.g. 25000" value={form.fixedExpenses}
                onChange={e=>set('fixedExpenses',e.target.value)} className="input-field" autoFocus />
              {err.fixedExpenses && <p className="text-red-400 text-xs mt-1">{err.fixedExpenses}</p>}
            </div>
            <div className="bg-slate-800/40 rounded-xl p-4 space-y-1.5 text-xs text-slate-400">
              <p className="font-medium text-slate-300 mb-2">Include in this number:</p>
              {['House rent / home loan EMI','Car loan EMI','Other recurring EMIs','Fixed subscriptions'].map(i=>(
                <p key={i} className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-violet-400 rounded-full inline-block" />{i}
                </p>
              ))}
            </div>
            {form.monthlyIncome && form.fixedExpenses && +form.fixedExpenses < +form.monthlyIncome && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <p className="text-emerald-400 text-sm">
                  Discretionary income: <strong>
                    ₹{(+form.monthlyIncome - +form.fixedExpenses).toLocaleString('en-IN')}/mo
                  </strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Risk ── */}
        {step===3 && (
          <div className="space-y-2.5">
            {[
              {v:'LOW',    e:'🛡️', l:'Conservative', d:'Safety first. FDs, debt funds.',      r:'7–9%',  a:'bg-blue-500/10 border-blue-500'},
              {v:'MEDIUM', e:'⚖️', l:'Moderate',     d:'Balance of growth and stability.',     r:'10–13%', a:'bg-amber-500/10 border-amber-500'},
              {v:'HIGH',   e:'🚀', l:'Aggressive',   d:'Max growth. Mostly equity & small cap.',r:'14–18%', a:'bg-red-500/10 border-red-500'},
            ].map(o=>(
              <button key={o.v} type="button" onClick={()=>set('riskLevel',o.v)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  form.riskLevel===o.v ? `${o.a} text-white` : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{o.e} {o.l}</span>
                  <span className="text-xs font-mono text-slate-400">~{o.r} p.a.</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{o.d}</p>
              </button>
            ))}
          </div>
        )}

        {/* ── STEP 4: Goals ── */}
        {step===4 && (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm">Select all that apply:</p>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map(g=>(
                <button key={g} type="button" onClick={()=>toggleGoal(g)}
                  className={`p-3 rounded-xl border text-sm text-left transition-all ${
                    form.goals.includes(g)
                      ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}>
                  {form.goals.includes(g) && '✓ '}{g}
                </button>
              ))}
            </div>
            <p className="text-slate-500 text-xs">You can change these at any time.</p>
          </div>
        )}

        {/* ── STEP 5: Personal ── */}
        {step===5 && (
          <div className="space-y-5">
            <div>
              <label className="input-label">Your age</label>
              <input type="number" placeholder="e.g. 28" min="18" max="80"
                value={form.age} onChange={e=>set('age',e.target.value)}
                className="input-field" autoFocus />
              {err.age && <p className="text-red-400 text-xs mt-1">{err.age}</p>}
              <p className="text-slate-500 text-xs mt-1.5">Used for retirement corpus and insurance planning.</p>
            </div>
            <div>
              <label className="input-label">Active loans right now</label>
              <div className="flex gap-2">
                {[0,1,2,3,'4+'].map(n=>(
                  <button key={n} type="button"
                    onClick={()=>set('existingLoans', String(n==='4+' ? 4 : n))}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                      form.existingLoans===String(n==='4+' ? 4 : n)
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}>{n}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 6: Done ── */}
        {step===STEPS.length-1 && (
          <div className="text-center space-y-5">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle size={34} className="text-emerald-400" />
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Finova is personalised to your income of{' '}
              <span className="text-violet-400 font-semibold">₹{(+form.monthlyIncome).toLocaleString('en-IN')}/mo</span>
              {' '}with a{' '}
              <span className="text-violet-400 font-semibold">{form.riskLevel.toLowerCase()} risk</span> profile.
            </p>
            <div className="bg-slate-800/60 rounded-xl p-4 text-left space-y-2">
              {[
                ['💰 Income',       `₹${(+form.monthlyIncome).toLocaleString('en-IN')}/mo`],
                ['🏠 Fixed costs',  `₹${(+(form.fixedExpenses||0)).toLocaleString('en-IN')}/mo`],
                ['📊 Risk',         form.riskLevel],
                ['🎯 Goals',        form.goals.slice(0,2).join(', ') || 'Not set'],
              ].map(([k,v])=>(
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-slate-400">{k}</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="mt-7 flex gap-3">
          {step > 0 && step < STEPS.length-1 && (
            <button onClick={back} className="btn-secondary">
              <ArrowLeft size={15} /> Back
            </button>
          )}
          {step < STEPS.length-1 ? (
            <button onClick={next} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <>{step===0 ? 'Get Started' : step===STEPS.length-2 ? 'Save & Finish' : 'Continue'} <ArrowRight size={15}/></>}
            </button>
          ) : (
            <button onClick={()=>navigate('/dashboard')} className="btn-primary flex-1 justify-center py-3">
              Open Dashboard <ArrowRight size={16}/>
            </button>
          )}
        </div>
      </div>

      {step > 0 && step < STEPS.length-1 && (
        <button onClick={()=>setStep(s=>s+1)}
          className="mt-4 text-slate-600 hover:text-slate-400 text-xs transition-colors">
          Skip this step →
        </button>
      )}
    </div>
  );
}
