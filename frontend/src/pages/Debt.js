import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Plus, Trash2, Landmark, Calculator, TrendingDown, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatINR } from '../utils/helpers';
import api from '../utils/api';

const EMI_TIP = 'P × R × (1+R)^N / ((1+R)^N − 1)  where R = monthly rate';

export default function Debt() {
  const [strategyData, setStrategyData] = useState(null);
  const [strategy, setStrategy]         = useState('AVALANCHE');
  const [showForm, setShowForm]         = useState(false);
  const [showEMICalc, setShowEMICalc]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [emiResult, setEmiResult]       = useState(null);
  const [loanForm, setLoanForm] = useState({
    name:'', type:'personal', principalAmount:'', outstandingAmount:'',
    interestRate:'', tenureMonths:'', startDate:'',
  });
  const [emiForm, setEmiForm] = useState({ principal:'', annualRate:'', tenureMonths:'' });

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/debt/strategy?type=${strategy}`);
      setStrategyData(res.data);
    } catch { /* empty */ }
  }, [strategy]);

  useEffect(() => { load(); }, [load]);

  const addLoan = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/debt/loans', {
        ...loanForm,
        principalAmount:   +loanForm.principalAmount,
        outstandingAmount: +loanForm.outstandingAmount,
        interestRate:      +loanForm.interestRate,
        tenureMonths:      +loanForm.tenureMonths,
      });
      toast.success('Loan added!');
      setShowForm(false);
      setLoanForm({ name:'', type:'personal', principalAmount:'', outstandingAmount:'', interestRate:'', tenureMonths:'', startDate:'' });
      load();
    } catch { toast.error('Failed to add loan'); }
    finally { setLoading(false); }
  };

  const deleteLoan = async (id) => {
    try {
      await api.delete(`/debt/loans/${id}`);
      toast.success('Loan removed');
      load();
    } catch { toast.error('Failed to remove'); }
  };

  const calcEMI = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/debt/loans/calculate-emi', {
        principal: +emiForm.principal, annualRate: +emiForm.annualRate, tenureMonths: +emiForm.tenureMonths,
      });
      setEmiResult(res.data);
    } catch { toast.error('Calculation failed'); }
  };

  const loans        = strategyData?.loans || [];
  const summary      = strategyData?.summary || {};
  const nextFocus    = strategyData?.nextFocus;

  // Payoff timeline for chart (cumulative balance)
  const timelineData = loans.slice(0, 1).flatMap(l => {
    const months = +l.tenureMonths;
    const data = [];
    let bal = +l.outstandingAmount;
    const emi = +l.emi;
    const rate = +l.interestRate / 12 / 100;
    for (let m = 0; m <= Math.min(months, 36); m += 3) {
      data.push({ month: `M${m}`, balance: Math.max(0, Math.round(bal)) });
      for (let i = 0; i < 3 && bal > 0; i++) {
        const interest = bal * rate;
        bal = bal - (emi - interest);
      }
    }
    return data;
  });

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Debt Tracker</h1>
          <p className="page-subtitle">Avalanche & snowball strategies · EMI calculator · Debt-free timeline</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEMICalc(v => !v)} className="btn-ghost text-sm">
            <Calculator size={14} /> EMI Calc
          </button>
          <button onClick={() => setShowForm(v => !v)} className="btn-primary text-sm">
            <Plus size={15} /> Add Loan
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {loans.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card"><p className="text-slate-400 text-xs mb-1">Total Outstanding</p><p className="text-red-400 text-xl font-bold num">{formatINR(+summary.totalOutstanding)}</p></div>
          <div className="card"><p className="text-slate-400 text-xs mb-1">Monthly EMI Burden</p><p className="text-orange-400 text-xl font-bold num">{formatINR(+summary.totalMonthlyEMI)}</p></div>
          <div className="card"><p className="text-slate-400 text-xs mb-1">Total Interest Cost</p><p className="text-red-400 text-xl font-bold num">{formatINR(+summary.totalInterestCost)}</p></div>
          <div className="card border-emerald-500/20 bg-emerald-500/5">
            <p className="text-emerald-300 text-xs mb-1">Debt-Free By</p>
            <p className="text-emerald-400 text-xl font-bold">{summary.debtFreeDate || '—'}</p>
            <p className="text-slate-500 text-xs">{summary.debtFreeInMonths} months away</p>
          </div>
        </div>
      )}

      {/* Strategy selector */}
      {loans.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Payoff Strategy</p>
            {nextFocus && (
              <div className="badge badge-violet bg-violet-600/20 border-violet-500/30 text-violet-300">
                Focus: {nextFocus}
              </div>
            )}
          </div>
          <div className="flex gap-3 mb-3">
            {[
              { v:'AVALANCHE', label:'🏔 Avalanche', desc:'Highest interest first — saves most money' },
              { v:'SNOWBALL',  label:'❄️ Snowball',  desc:'Smallest balance first — builds momentum' },
            ].map(({ v, label, desc }) => (
              <button key={v} onClick={() => setStrategy(v)}
                className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                  strategy === v
                    ? 'bg-violet-600/15 border-violet-500 text-violet-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs mt-0.5 opacity-70">{desc}</p>
              </button>
            ))}
          </div>
          {strategyData?.strategyRationale && (
            <p className="text-slate-400 text-sm bg-slate-800/40 rounded-xl p-3">
              💡 {strategyData.strategyRationale}
            </p>
          )}
          {summary.interestSavedVsMinimum && +summary.interestSavedVsMinimum > 0 && (
            <div className="flex items-center gap-2 mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <TrendingDown size={14} className="text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-400 text-sm">
                Using this strategy saves approximately{' '}
                <strong>{formatINR(+summary.interestSavedVsMinimum)}</strong> in interest vs minimum payments only.
              </p>
            </div>
          )}
        </div>
      )}

      {/* EMI Calculator */}
      {showEMICalc && (
        <div className="card border-violet-500/30 slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={16} className="text-violet-400" />
            <p className="section-title">EMI Calculator</p>
          </div>
          <p className="text-slate-500 text-xs mb-4 font-mono">{EMI_TIP}</p>
          <form onSubmit={calcEMI} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="input-label">Loan Amount (₹)</label>
              <input type="number" placeholder="500000" value={emiForm.principal}
                onChange={e => setEmiForm({ ...emiForm, principal:e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Interest Rate (% p.a.)</label>
              <input type="number" step="0.1" placeholder="10.5" value={emiForm.annualRate}
                onChange={e => setEmiForm({ ...emiForm, annualRate:e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Tenure (months)</label>
              <input type="number" placeholder="60" value={emiForm.tenureMonths}
                onChange={e => setEmiForm({ ...emiForm, tenureMonths:e.target.value })} className="input-field" required />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className="btn-primary"><Calculator size={14} /> Calculate EMI</button>
            </div>
          </form>
          {emiResult && (
            <div className="grid grid-cols-3 gap-4 slide-up">
              <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-4 text-center">
                <p className="text-violet-300 text-xs">Monthly EMI</p>
                <p className="text-violet-400 text-2xl font-bold num">{formatINR(+emiResult.emi)}</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-xs">Total Payable</p>
                <p className="text-white text-xl font-bold num">{formatINR(+emiResult.totalPayable)}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-red-300 text-xs">Total Interest</p>
                <p className="text-red-400 text-xl font-bold num">{formatINR(+emiResult.totalInterest)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Loan Form */}
      {showForm && (
        <div className="card border-violet-500/30 slide-up">
          <p className="section-title mb-4">Add Loan</p>
          <form onSubmit={addLoan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div><label className="input-label">Loan Name</label>
              <input type="text" placeholder="SBI Home Loan" value={loanForm.name}
                onChange={e => setLoanForm({ ...loanForm, name:e.target.value })} className="input-field" required /></div>
            <div><label className="input-label">Type</label>
              <select value={loanForm.type} onChange={e => setLoanForm({ ...loanForm, type:e.target.value })} className="input-field">
                {['home','car','personal','education','credit_card','other'].map(t =>
                  <option key={t} value={t}>{t.replace('_',' ').toUpperCase()}</option>)}</select></div>
            <div><label className="input-label">Original Principal (₹)</label>
              <input type="number" placeholder="500000" value={loanForm.principalAmount}
                onChange={e => setLoanForm({ ...loanForm, principalAmount:e.target.value })} className="input-field" required /></div>
            <div><label className="input-label">Outstanding Balance (₹)</label>
              <input type="number" placeholder="350000" value={loanForm.outstandingAmount}
                onChange={e => setLoanForm({ ...loanForm, outstandingAmount:e.target.value })} className="input-field" required /></div>
            <div><label className="input-label">Interest Rate (% p.a.)</label>
              <input type="number" step="0.1" placeholder="10.5" value={loanForm.interestRate}
                onChange={e => setLoanForm({ ...loanForm, interestRate:e.target.value })} className="input-field" required /></div>
            <div><label className="input-label">Remaining Tenure (months)</label>
              <input type="number" placeholder="48" value={loanForm.tenureMonths}
                onChange={e => setLoanForm({ ...loanForm, tenureMonths:e.target.value })} className="input-field" required /></div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : 'Save Loan'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Loan Cards */}
      {loans.length === 0 && !showForm ? (
        <div className="card">
          <div className="empty-state">
            <Landmark size={28} className="text-slate-700 mb-3" />
            <h3 className="font-display font-semibold text-white mb-1">No loans tracked</h3>
            <p className="text-slate-400 text-sm mb-5">Add your home loan, car loan, or any EMI to see strategies.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              <Plus size={14} /> Add Loan
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Loan cards */}
          <div className="xl:col-span-2 space-y-3">
            {loans.map((loan, idx) => (
              <div key={loan.id} className="card-hover group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">{loan.name}</span>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${idx===0?'bg-violet-600':'bg-slate-700'}`}>{idx+1}</span>
                    </div>
                    <span className="badge badge-gray capitalize">{loan.type?.replace('_',' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {idx === 0 && <span className="badge badge-blue text-[10px]">Focus first</span>}
                    <button onClick={() => deleteLoan(loan.id)}
                      className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                  <div><p className="text-slate-500">Outstanding</p><p className="text-red-400 font-bold num">{formatINR(+loan.outstandingAmount)}</p></div>
                  <div><p className="text-slate-500">EMI / month</p><p className="text-orange-400 font-bold num">{formatINR(+loan.emi)}</p></div>
                  <div><p className="text-slate-500">Rate</p><p className="text-white font-bold">{loan.interestRate}% p.a.</p></div>
                  <div><p className="text-slate-500">Total Interest</p><p className="text-red-400 num">{formatINR(+loan.totalInterest)}</p></div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{loan.paidPct}% paid off</span>
                    <div className="flex items-center gap-1">
                      <Calendar size={10} />
                      <span>Debt-free: {loan.debtFreeDate}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full">
                    <div className="h-2 bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, +loan.paidPct)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right column: chart + debt breakdown */}
          <div className="space-y-4">
            {/* Debt breakdown bar */}
            {loans.length > 0 && (
              <div className="card">
                <p className="section-title mb-3">Debt Breakdown</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={loans.map(l => ({
                    name: l.name.length > 10 ? l.name.slice(0,10)+'…' : l.name,
                    outstanding: +l.outstandingAmount,
                    paid: +l.principalAmount - +l.outstandingAmount,
                  }))} layout="vertical">
                    <XAxis type="number" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${Math.round(v/100000)}L`} />
                    <YAxis type="category" dataKey="name" tick={{ fill:'#64748b', fontSize:10 }}
                      axisLine={false} tickLine={false} width={70} />
                    <Tooltip formatter={v => formatINR(v)} />
                    <Bar dataKey="paid" fill="#10b981" stackId="a" name="Paid" />
                    <Bar dataKey="outstanding" fill="#ef4444" stackId="a" name="Outstanding" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Balance decline timeline */}
            {timelineData.length > 1 && (
              <div className="card">
                <p className="section-title mb-3">Balance Decline ({loans[0]?.name})</p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={timelineData}>
                    <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `₹${Math.round(v/100000)}L`} />
                    <Tooltip formatter={v => formatINR(v)} />
                    <Line type="monotone" dataKey="balance" stroke="#7c3aed" strokeWidth={2} dot={false} name="Balance" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Interest saved highlight */}
            {summary.interestSavedVsMinimum && +summary.interestSavedVsMinimum > 0 && (
              <div className="card border-emerald-500/20 bg-emerald-500/5">
                <p className="text-emerald-400 text-xs font-medium mb-1">Interest Saved by Strategy</p>
                <p className="text-emerald-400 text-2xl font-bold num">{formatINR(+summary.interestSavedVsMinimum)}</p>
                <p className="text-slate-400 text-xs mt-1">vs paying only minimum each month</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
