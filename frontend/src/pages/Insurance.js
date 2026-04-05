import React, { useState, useEffect, useCallback } from 'react';
import { Shield, CheckCircle, AlertTriangle, Star, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { formatINR } from '../utils/helpers';
import api from '../utils/api';

const TYPE_ICONS = { LIFE:'🛡️', HEALTH:'🏥', VEHICLE:'🚗' };
const TYPE_LABELS = { LIFE:'Life Insurance', HEALTH:'Health Insurance', VEHICLE:'Vehicle Insurance' };

const CLAIM_DOCS = {
  LIFE:    ['Death certificate (original + copies)','Policy bond / documents','Photo ID of claimant','Bank account details (cancelled cheque)','Relationship proof with insured','Hospital / post-mortem records if applicable'],
  HEALTH:  ['Duly filled claim form','Doctor\'s prescription & treatment notes','All hospital bills (originals)','Discharge summary','Lab / diagnostic reports','Insurance card / policy copy'],
  VEHICLE: ['FIR copy (for theft/major accident)','Driving license (valid)','RC book','Insurance policy copy','Photographs of damage','Garage repair estimate'],
};

function PlanCard({ plan, bestPlan }) {
  const [expanded, setExpanded] = useState(false);
  const isBest = bestPlan?.name === plan.name && bestPlan?.company === plan.company;

  return (
    <div className={`card-hover ${isBest ? 'border-amber-500/40' : ''}`}>
      {isBest && (
        <div className="badge bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-3 gap-1">
          <Star size={10} /> Best Plan For You
        </div>
      )}
      {plan.recommended && !isBest && (
        <div className="badge badge-blue mb-3 gap-1">
          <CheckCircle size={10} /> Top Recommended
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-white font-semibold text-sm">{plan.name}</p>
          <p className="text-slate-400 text-xs">{plan.company}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <p className="text-violet-400 font-bold num">{formatINR(plan.annualPremium)}/yr</p>
          <p className="text-slate-500 text-xs num">{formatINR(plan.monthlyPremium)}/mo</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div className="bg-slate-800/40 rounded-lg p-2">
          <p className="text-slate-500">Coverage</p>
          <p className="text-white font-bold num">{formatINR(plan.coverageAmount)}</p>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-2">
          <p className="text-slate-500">Claim Ratio</p>
          <p className={`font-bold ${+plan.claimRatio >= 95 ? 'text-emerald-400' : +plan.claimRatio >= 90 ? 'text-amber-400' : 'text-red-400'}`}>
            {plan.claimRatio}%
          </p>
        </div>
      </div>

      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors">
        <span>Details</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 slide-up">
          <div>
            <p className="text-slate-400 text-xs font-medium mb-1.5">✅ Benefits</p>
            {plan.benefits.map((b, i) => (
              <p key={i} className="text-slate-300 text-xs flex items-start gap-1.5 mb-1">
                <CheckCircle size={10} className="text-emerald-400 flex-shrink-0 mt-0.5" /> {b}
              </p>
            ))}
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium mb-1.5">⚠️ Limitations</p>
            {plan.limitations.map((l, i) => (
              <p key={i} className="text-slate-400 text-xs flex items-start gap-1.5 mb-1">
                <AlertTriangle size={10} className="text-amber-400 flex-shrink-0 mt-0.5" /> {l}
              </p>
            ))}
          </div>
          <div className="pt-2">
            <span className={`badge ${plan.tier==='BEST_VALUE'?'badge-green':plan.tier==='PREMIUM'?'badge-blue':'badge-gray'}`}>
              {plan.tier?.replace('_',' ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Insurance() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeType, setActiveType] = useState('LIFE');
  const [checklist, setChecklist] = useState('LIFE');
  const [compare, setCompare]   = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/insurance/recommendations');
      setData(res.data);
    } catch { /* stay empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const coverageNeeded = data ? +data.coverageNeeded : 0;
  const profile        = data?.profile || {};
  const plans          = data ? (data[activeType.toLowerCase()] || []) : [];
  const bestPlan       = data?.bestPlan;

  const toggleCompare = (plan) => {
    setCompare(c =>
      c.some(p => p.name === plan.name)
        ? c.filter(p => p.name !== plan.name)
        : c.length < 2 ? [...c, plan] : c
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex items-center gap-3 text-slate-400">
        <RefreshCw size={16} className="animate-spin" /> Loading recommendations…
      </div>
    </div>
  );

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Insurance</h1>
          <p className="page-subtitle">AI-powered plan recommendations · Coverage gap analysis · Claim checklist</p>
        </div>
        <button onClick={load} className="btn-ghost text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Profile summary */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-slate-400 text-xs mb-1">Your Profile</p>
            <p className="text-white font-bold">Age {profile.age} · {formatINR(+profile.monthlyIncome)}/mo</p>
          </div>
          <div className="card border-violet-500/20">
            <p className="text-slate-400 text-xs mb-1">Life Cover Needed</p>
            <p className="text-violet-400 font-bold num">{formatINR(coverageNeeded)}</p>
            <p className="text-slate-500 text-xs">= annual income × 20</p>
          </div>
          {bestPlan && (
            <div className="card border-amber-500/20 bg-amber-500/5">
              <p className="text-amber-300 text-xs mb-1 flex items-center gap-1"><Star size={10} /> Best Plan Overall</p>
              <p className="text-white font-semibold text-sm">{bestPlan.name}</p>
              <p className="text-slate-400 text-xs">{bestPlan.claimRatio}% claim ratio · {bestPlan.company}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Plan cards */}
        <div className="xl:col-span-2 space-y-4">
          {/* Type tabs */}
          <div className="flex gap-2">
            {['LIFE','HEALTH','VEHICLE'].map(t => (
              <button key={t} onClick={() => setActiveType(t)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeType === t ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}>
                <span>{TYPE_ICONS[t]}</span> {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {!data ? (
            <div className="card">
              <div className="empty-state py-8">
                <Shield size={26} className="text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">Complete your profile to see personalised recommendations.</p>
              </div>
            </div>
          ) : plans.length === 0 ? (
            <div className="card">
              <div className="empty-state py-8">
                <p className="text-slate-500 text-sm">No plans found for this category.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan, i) => (
                <PlanCard key={i} plan={plan} bestPlan={bestPlan} />
              ))}
            </div>
          )}

          {/* Compare section */}
          {compare.length === 2 && (
            <div className="card border-violet-500/30 mt-4">
              <p className="section-title mb-4">Side-by-Side Comparison</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {compare.map((plan, i) => (
                  <div key={i}>
                    <p className="text-white font-semibold mb-2">{plan.name}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-slate-400">Premium</span><span className="text-violet-400 num">{formatINR(plan.annualPremium)}/yr</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Coverage</span><span className="text-white num">{formatINR(plan.coverageAmount)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Claim %</span><span className={+plan.claimRatio>=95?'text-emerald-400':'text-amber-400'}>{plan.claimRatio}%</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Tier</span><span className="text-white">{plan.tier?.replace('_',' ')}</span></div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setCompare([])} className="btn-ghost text-xs mt-3">Clear comparison</button>
            </div>
          )}
        </div>

        {/* Claim Checklist */}
        <div className="space-y-4">
          <div className="card">
            <p className="section-title mb-3">Claim Document Checklist</p>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {['LIFE','HEALTH','VEHICLE'].map(t => (
                <button key={t} onClick={() => setChecklist(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    checklist === t ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}>
                  {TYPE_ICONS[t]} {t.charAt(0)+t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {CLAIM_DOCS[checklist].map((doc, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-800/40 rounded-xl">
                  <CheckCircle size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-xs leading-relaxed">{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="card">
            <p className="section-title mb-3">Insurance Tips</p>
            <div className="space-y-3 text-xs">
              {[
                { t:'Buy early', d:'Premium is 40–60% cheaper when you\'re under 30 vs 40.' },
                { t:'Claim ratio matters', d:'Choose companies with >95% claim settlement ratio.' },
                { t:'Don\'t over-insure vehicle', d:'Zero-dep + base plan usually sufficient for cars <5 years old.' },
                { t:'Port health plan', d:'You can switch insurer without losing waiting period benefits.' },
              ].map(({ t, d }) => (
                <div key={t} className="border-b border-slate-800/60 last:border-0 pb-2.5 last:pb-0">
                  <p className="text-white font-medium mb-0.5">{t}</p>
                  <p className="text-slate-400 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
