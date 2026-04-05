import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Target } from 'lucide-react';
import { formatINR, calcSIPFV } from '../utils/helpers';
import api from '../utils/api';

export default function Retirement() {
  const [p, setP] = useState({ currentAge:30, retirementAge:60, lifeExpectancy:85,
    monthlyExpense:60000, currentSavings:0, inflation:6, expectedReturn:12, postRetirementReturn:7 });
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    api.get('/user/profile').then(r => {
      const prof = r.data;
      if (prof?.age || prof?.monthlyIncome) {
        setP(prev => ({
          ...prev,
          currentAge:      prof.age || prev.currentAge,
          monthlyExpense:  prof.fixedExpenses ? +prof.fixedExpenses : prev.monthlyExpense,
          expectedReturn:  prof.riskLevel === 'HIGH' ? 14 : prof.riskLevel === 'LOW' ? 8 : 12,
        }));
        setProfileLoaded(true);
      }
    }).catch(()=>{});
  }, []);

  const res = useMemo(() => {
    const ytr  = p.retirementAge - p.currentAge;
    const dur  = p.lifeExpectancy - p.retirementAge;
    const expAtRetirement = p.monthlyExpense * Math.pow(1 + p.inflation/100, ytr);
    const realRate = Math.max(0.001, (p.postRetirementReturn - p.inflation) / 100 / 12);
    const n = dur * 12;
    const corpusNeeded = expAtRetirement * ((1 - Math.pow(1+realRate,-n)) / realRate);
    const savedCorpus  = p.currentSavings * Math.pow(1 + p.expectedReturn/100, ytr);
    const gap          = Math.max(0, corpusNeeded - savedCorpus);
    const r = p.expectedReturn/100/12;
    const months = ytr * 12;
    const sipReq = r > 0 && months > 0
      ? gap / (((Math.pow(1+r,months)-1)/r)*(1+r)) : gap/Math.max(1,months);

    const projection = Array.from({length:ytr+1},(_,i)=>{
      const corpus = p.currentSavings * Math.pow(1+p.expectedReturn/100,i)
        + calcSIPFV(Math.max(sipReq,1000), p.expectedReturn, i);
      return { age: p.currentAge+i, corpus: Math.round(corpus) };
    });

    return { ytr, corpusNeeded, savedCorpus, gap, sipReq:Math.round(sipReq), expAtRetirement, projection };
  }, [p]);

  const set = (k,v) => setP(prev => ({...prev,[k]:+v}));

  const SLIDERS = [
    {k:'currentAge',        l:'Current Age',              min:18, max:60,       suf:'yrs'},
    {k:'retirementAge',     l:'Retirement Age',           min:45, max:75,       suf:'yrs'},
    {k:'lifeExpectancy',    l:'Life Expectancy',          min:70, max:100,      suf:'yrs'},
    {k:'monthlyExpense',    l:'Current Monthly Expenses', min:10000,max:500000,step:5000,suf:'₹'},
    {k:'currentSavings',    l:'Current Savings',          min:0,max:50000000,step:50000,suf:'₹'},
    {k:'inflation',         l:'Inflation Rate',           min:3,  max:12,step:0.5,suf:'%'},
    {k:'expectedReturn',    l:'Investment Return',        min:6,  max:20, step:0.5,suf:'%'},
    {k:'postRetirementReturn',l:'Post-Retirement Return', min:4,  max:12, step:0.5,suf:'%'},
  ];

  return (
    <div className="space-y-5 fade-in">
      <div className="page-header">
        <h1 className="page-title">Retirement Planner</h1>
        <p className="page-subtitle">Inflation-adjusted corpus · SIP requirement · Wealth projection</p>
      </div>

      {profileLoaded && (
        <div className="card border-emerald-500/20 bg-emerald-500/5 py-3">
          <p className="text-emerald-400 text-sm">✓ Pre-filled from your profile — adjust sliders as needed.</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Sliders */}
        <div className="card">
          <p className="section-title mb-4">Your Parameters</p>
          <div className="space-y-4">
            {SLIDERS.map(({k,l,min,max,step=1,suf})=>(
              <div key={k}>
                <div className="flex justify-between mb-1">
                  <label className="text-slate-400 text-xs">{l}</label>
                  <span className="text-white text-xs num">
                    {suf==='₹' ? formatINR(p[k]) : `${p[k]}${suf}`}
                  </span>
                </div>
                <input type="range" min={min} max={max} step={step} value={p[k]}
                  onChange={e=>set(k,e.target.value)} className="w-full accent-violet-500"/>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="xl:col-span-2 space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card text-center"><p className="text-slate-400 text-xs">Years to Retire</p><p className="text-white text-3xl font-bold">{res.ytr}</p></div>
            <div className="card text-center"><p className="text-slate-400 text-xs">Need at Retirement</p><p className="text-orange-400 font-bold num">{formatINR(Math.round(res.expAtRetirement))}/mo</p></div>
            <div className="card text-center border-violet-500/30"><p className="text-slate-400 text-xs">Corpus Required</p><p className="text-violet-400 font-bold num text-sm">{formatINR(Math.round(res.corpusNeeded))}</p></div>
            <div className={`card text-center border ${res.gap>0?'border-red-500/30':'border-emerald-500/30'}`}>
              <p className="text-slate-400 text-xs">{res.gap>0?'Corpus Gap':'Surplus'}</p>
              <p className={`font-bold num text-sm ${res.gap>0?'text-red-400':'text-emerald-400'}`}>
                {formatINR(res.gap>0?res.gap:res.savedCorpus-res.corpusNeeded)}
              </p>
            </div>
          </div>

          {/* SIP recommendation */}
          {res.sipReq > 0 && (
            <div className="card bg-violet-600/5 border-violet-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-600/20 rounded-xl flex-shrink-0">
                  <Target size={20} className="text-violet-400"/>
                </div>
                <div>
                  <p className="text-slate-300 text-sm">Monthly SIP needed to retire comfortably</p>
                  <p className="text-violet-400 text-3xl font-bold num">
                    {formatINR(res.sipReq)}<span className="text-base text-slate-400">/month</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="card">
            <p className="section-title mb-4">Wealth Projection</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={res.projection}>
                <XAxis dataKey="age" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} label={{value:'Age',position:'insideBottom',fill:'#475569',fontSize:11}}/>
                <YAxis tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/10000000).toFixed(1)}Cr`}/>
                <Tooltip formatter={v=>formatINR(v)} labelFormatter={l=>`Age ${l}`}/>
                <ReferenceLine x={p.retirementAge} stroke="#f97316" strokeDasharray="4 4" label={{value:'Retire',fill:'#f97316',fontSize:10}}/>
                <Line type="monotone" dataKey="corpus" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Corpus"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
