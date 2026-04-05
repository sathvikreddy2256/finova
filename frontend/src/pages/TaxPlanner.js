import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Calculator, CheckCircle, TrendingDown, RefreshCw, Info } from 'lucide-react';
import { formatINR } from '../utils/helpers';
import api from '../utils/api';

const SLAB_COLORS = ['#7c3aed', '#2563eb', '#d97706', '#dc2626'];

export default function TaxPlanner() {
  const [income, setIncome]     = useState('');
  const [d80C, setD80C]         = useState(0);
  const [d80D, setD80D]         = useState(0);
  const [dHL, setDHL]           = useState(0);
  const [nps, setNps]           = useState(0);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [activeRegime, setActiveRegime] = useState('COMPARE');
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load income from profile
  useEffect(() => {
    api.get('/tax/profile-income').then(r => {
      if (+r.data.annualIncome > 0) {
        setIncome(String(+r.data.annualIncome));
        setProfileLoaded(true);
      }
    }).catch(() => {});
  }, []);

  // Auto-calculate whenever inputs change
  const calculate = useCallback(async () => {
    const amt = +income;
    if (!amt || amt <= 0) { setResult(null); return; }
    setLoading(true);
    try {
      const res = await api.post('/tax/calculate', {
        annualIncome: amt, deduction80C: d80C,
        deduction80D: d80D, deductionHL: dHL, nps,
      });
      setResult(res.data);
    } catch {
      // Fallback: client-side calculation
      const cap80C = Math.min(d80C, 150000);
      const totalDed = cap80C + d80D + Math.min(dHL, 200000) + Math.min(nps, 50000) + 50000;
      const taxableOld = Math.max(0, amt - totalDed);
      const taxableNew = Math.max(0, amt - 75000);
      const oldTax = Math.round(calcOld(taxableOld) * 1.04);
      const newTax = Math.round(calcNew(taxableNew) * 1.04);
      setResult({
        annualIncome: amt,
        oldRegime: { taxableIncome: taxableOld, tax: oldTax, totalDeductions: totalDed },
        newRegime: { taxableIncome: taxableNew, tax: newTax, standardDeduction: 75000 },
        recommended: oldTax <= newTax ? 'OLD' : 'NEW',
        taxSaved: Math.abs(oldTax - newTax),
        remaining80CInvestment: Math.max(0, 150000 - cap80C),
        potentialSavingFrom80C: Math.round(Math.max(0, 150000 - cap80C) * 0.2 * 1.04),
        monthlyTaxOld: Math.round(oldTax / 12),
        monthlyTaxNew: Math.round(newTax / 12),
      });
    } finally { setLoading(false); }
  }, [income, d80C, d80D, dHL, nps]);

  useEffect(() => {
    const timer = setTimeout(calculate, 400);
    return () => clearTimeout(timer);
  }, [calculate]);

  const calcOld = (t) => {
    if (t <= 250000) return 0;
    if (t <= 500000) return (t - 250000) * 0.05;
    if (t <= 1000000) return 12500 + (t - 500000) * 0.20;
    return 112500 + (t - 1000000) * 0.30;
  };
  const calcNew = (t) => {
    if (t <= 300000) return 0;
    if (t <= 700000) return (t - 300000) * 0.05;
    if (t <= 1000000) return 20000 + (t - 700000) * 0.10;
    if (t <= 1200000) return 50000 + (t - 1000000) * 0.15;
    if (t <= 1500000) return 80000 + (t - 1200000) * 0.20;
    return 140000 + (t - 1500000) * 0.30;
  };

  // Slab breakdown for chart
  const oldTax  = result ? +result.oldRegime.tax : 0;
  const newTax  = result ? +result.newRegime.tax : 0;
  const compBar = [
    { name: 'Old Regime', tax: oldTax,  fill: '#f97316' },
    { name: 'New Regime', tax: newTax,  fill: '#7c3aed' },
  ];

  const slabsOld = result ? [
    { name: 'Up to ₹2.5L', tax: 0 },
    { name: '₹2.5L–5L', tax: Math.min(12500, Math.max(0, +result.oldRegime.taxableIncome - 250000) * 0.05) },
    { name: '₹5L–10L',  tax: Math.min(100000, Math.max(0, +result.oldRegime.taxableIncome - 500000) * 0.20) },
    { name: 'Above ₹10L', tax: Math.max(0, +result.oldRegime.taxableIncome - 1000000) * 0.30 },
  ].filter(s => s.tax > 0) : [];

  return (
    <div className="space-y-5 fade-in">
      <div className="page-header">
        <h1 className="page-title">Tax Planner</h1>
        <p className="page-subtitle">Indian Income Tax · Old vs New Regime · FY 2024-25 · Auto-calculated</p>
      </div>

      {profileLoaded && (
        <div className="card border-emerald-500/20 bg-emerald-500/5 py-3">
          <p className="text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle size={14} /> Income pre-filled from your profile — adjust as needed
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Left: Inputs ── */}
        <div className="space-y-4">
          <div className="card">
            <p className="section-title mb-4">Income & Deductions</p>
            <div className="space-y-5">
              <div>
                <label className="input-label">Annual Gross Income (₹)</label>
                <input type="number" placeholder="e.g. 1200000"
                  value={income} onChange={e => setIncome(e.target.value)} className="input-field" />
                {income && <p className="text-slate-500 text-xs mt-1">= {formatINR(+income / 12)}/month</p>}
              </div>

              <div className="border-t border-slate-800 pt-4">
                <p className="text-slate-400 text-xs font-medium mb-3 flex items-center gap-1.5">
                  <Info size={12} /> Old Regime Deductions
                </p>
                {[
                  { label:'80C (ELSS, PPF, LIC…)', max:150000, val:d80C, set:setD80C, note:'Max ₹1.5L' },
                  { label:'80D (Health Insurance)', max:75000,  val:d80D, set:setD80D, note:'₹25K self + ₹50K parents' },
                  { label:'24B (Home Loan Interest)', max:200000, val:dHL, set:setDHL, note:'Max ₹2L' },
                  { label:'80CCD(1B) — NPS', max:50000, val:nps, set:setNps, note:'Extra ₹50K beyond 80C' },
                ].map(({ label, max, val, set, note }) => (
                  <div key={label} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <label className="text-slate-400 text-xs">{label}</label>
                      <span className="text-violet-400 text-xs num">{formatINR(Math.min(val, max))}</span>
                    </div>
                    <input type="range" min={0} max={max} step={1000} value={val}
                      onChange={e => set(+e.target.value)} className="w-full accent-violet-500" />
                    <p className="text-slate-600 text-[10px] mt-0.5">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Center + Right: Results ── */}
        <div className="xl:col-span-2 space-y-4">

          {!result && !loading && (
            <div className="card">
              <div className="empty-state py-10">
                <Calculator size={28} className="text-slate-700 mb-3" />
                <p className="text-slate-400 text-sm">Enter your annual income to see your tax calculation.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-slate-400">
                <RefreshCw size={16} className="animate-spin" /> Calculating…
              </div>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Recommendation banner */}
              <div className={`card border ${result.recommended==='OLD' ? 'border-orange-500/30 bg-orange-500/5' : 'border-violet-500/30 bg-violet-500/5'}`}>
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 flex-shrink-0">
                    <CheckCircle size={20} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">
                      <span className={result.recommended==='OLD' ? 'text-orange-400' : 'text-violet-400'}>
                        {result.recommended === 'OLD' ? 'Old Regime' : 'New Regime'}
                      </span> saves you more tax
                    </p>
                    <p className="text-slate-400 text-sm mt-0.5">
                      Annual saving: <span className="text-emerald-400 font-bold num">{formatINR(+result.taxSaved)}</span>
                      {' '}· Monthly: <span className="text-emerald-400 font-bold num">
                        {formatINR(Math.abs(+result.monthlyTaxOld - +result.monthlyTaxNew))}
                      </span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-slate-400 text-xs">You pay</p>
                    <p className="text-2xl font-bold num text-white">
                      {formatINR(result.recommended === 'OLD' ? +result.oldRegime.tax : +result.newRegime.tax)}
                    </p>
                    <p className="text-slate-400 text-xs">per year</p>
                  </div>
                </div>
              </div>

              {/* Regime toggle comparison */}
              <div className="flex gap-1 mb-0">
                {['COMPARE','OLD','NEW'].map(r => (
                  <button key={r} onClick={() => setActiveRegime(r)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                      activeRegime === r ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}>
                    {r === 'COMPARE' ? 'Compare' : r === 'OLD' ? 'Old Regime' : 'New Regime'}
                  </button>
                ))}
              </div>

              {activeRegime === 'COMPARE' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Old regime card */}
                  <div className={`card ${result.recommended==='OLD'?'border-orange-500/40':''}`}>
                    <div className="flex items-center gap-2 mb-3">
                      {result.recommended==='OLD' && <span className="badge badge-yellow">✓ Recommended</span>}
                      <p className="section-title">Old Regime</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Gross Income</span><span className="text-white num">{formatINR(+result.annualIncome)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Total Deductions</span><span className="text-red-400 num">-{formatINR(+result.oldRegime.totalDeductions)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Taxable Income</span><span className="text-white num">{formatINR(+result.oldRegime.taxableIncome)}</span></div>
                      <div className="divider" />
                      <div className="flex justify-between">
                        <span className="text-slate-300 font-medium">Tax + 4% Cess</span>
                        <span className="text-orange-400 font-bold num">{formatINR(+result.oldRegime.tax)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Monthly tax</span>
                        <span className="text-orange-400 num">{formatINR(+result.monthlyTaxOld)}</span>
                      </div>
                    </div>
                  </div>

                  {/* New regime card */}
                  <div className={`card ${result.recommended==='NEW'?'border-violet-500/40':''}`}>
                    <div className="flex items-center gap-2 mb-3">
                      {result.recommended==='NEW' && <span className="badge badge-blue">✓ Recommended</span>}
                      <p className="section-title">New Regime</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Gross Income</span><span className="text-white num">{formatINR(+result.annualIncome)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Std. Deduction</span><span className="text-red-400 num">-₹75,000</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Taxable Income</span><span className="text-white num">{formatINR(+result.newRegime.taxableIncome)}</span></div>
                      <div className="divider" />
                      <div className="flex justify-between">
                        <span className="text-slate-300 font-medium">Tax + 4% Cess</span>
                        <span className="text-violet-400 font-bold num">{formatINR(+result.newRegime.tax)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Monthly tax</span>
                        <span className="text-violet-400 num">{formatINR(+result.monthlyTaxNew)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="card">
                <p className="section-title mb-4">Tax Comparison</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={compBar} barGap={16}>
                    <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${Math.round(v/1000)}k`} />
                    <Tooltip formatter={v => formatINR(v)} />
                    <Bar dataKey="tax" radius={[6,6,0,0]} name="Tax">
                      {compBar.map((e,i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 80C savings tip */}
              {+result.remaining80CInvestment > 0 && (
                <div className="card border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={16} className="text-emerald-400" />
                    <p className="section-title text-emerald-400">Tax Saving Opportunity</p>
                  </div>
                  <p className="text-slate-300 text-sm">
                    Invest <span className="text-emerald-400 font-bold">{formatINR(+result.remaining80CInvestment)}</span> more in 80C instruments
                    (ELSS, PPF, NPS) to save an additional{' '}
                    <span className="text-emerald-400 font-bold">{formatINR(+result.potentialSavingFrom80C)}</span> in tax under the Old Regime.
                  </p>
                </div>
              )}

              {/* Tips grid */}
              <div className="card">
                <p className="section-title mb-3">Tax Saving Strategies</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { t:'Max 80C', d:'Invest full ₹1.5L in ELSS or PPF. Save up to ₹46,800.' },
                    { t:'NPS 80CCD(1B)', d:'Extra ₹50K deduction. Save another ₹15,600.' },
                    { t:'Health Insurance', d:'₹25K for self + ₹50K for senior parents.' },
                    { t:'HRA Exemption', d:'Claim if living in rented accommodation.' },
                    { t:'Home Loan 24B', d:'₹2L interest deduction for self-occupied property.' },
                    { t:'Education Loan 80E', d:'Full interest deductible for 8 years.' },
                  ].map(({ t, d }) => (
                    <div key={t} className="bg-slate-800/40 rounded-xl p-3">
                      <p className="text-white font-medium text-xs mb-1">{t}</p>
                      <p className="text-slate-400 text-xs leading-relaxed">{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
