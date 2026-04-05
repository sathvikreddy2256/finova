import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, Zap, AlertTriangle, TrendingUp, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatINR } from '../utils/helpers';
import { aiApi } from '../utils/api';
import api from '../utils/api';

export default function AIInsights() {
  const [prediction, setPrediction] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [fraud, setFraud]           = useState(null);
  const [loading, setLoading]       = useState({ predict:false, simulate:false, fraud:false });

  const [expForm, setExpForm] = useState({ income:90000, current_expense:58000, category:'food', month: new Date().getMonth()+1 });
  const [simForm, setSimForm] = useState({ income:90000, expense:58000, years:5, inflation:6 });
  const [fraudForm, setFraudForm] = useState({ amount:5000, merchant:'Online Store', category:'Shopping', hour:14, location:'Same City' });

  // Load real profile data on mount
  React.useEffect(() => {
    api.get('/user/profile').then(r => {
      if (r.data?.monthlyIncome) {
        const inc = +r.data.monthlyIncome;
        const exp = r.data.fixedExpenses ? +r.data.fixedExpenses : Math.round(inc * 0.6);
        setExpForm(f => ({ ...f, income: inc, current_expense: exp }));
        setSimForm(f => ({ ...f, income: inc, expense: exp }));
      }
    }).catch(() => {});
    // Also load avg expenses from real transaction data
    api.get('/transactions/avg-by-cat').then(r => {
      if (r.data && Object.keys(r.data).length > 0) {
        const topCat = Object.entries(r.data).sort((a,b)=>b[1]-a[1])[0];
        if (topCat) setExpForm(f => ({ ...f, category: topCat[0], current_expense: Math.round(topCat[1]) }));
      }
    }).catch(() => {});
  }, []);

  const callAI = async (endpoint, data, key, setter) => {
    setLoading(l => ({ ...l, [key]: true }));
    try {
      const res = await aiApi.post(endpoint, data);
      setter(res.data);
      toast.success('Analysis complete!');
    } catch {
      toast('AI service offline — showing rule-based result', { icon: '⚡' });
      // Rule-based fallback — no random values
      if (key === 'predict') {
        const avg = data.current_expense;
        const seasonal = [1,0.93,1.05,0.98,0.96,0.95,0.97,0.96,1.0,1.08,1.1,1.12][data.month-1] || 1;
        const predicted = Math.round(avg * seasonal);
        setter({
          predicted_expense: predicted,
          category: data.category,
          confidence: 0.82,
          trend: predicted > avg ? 'increasing' : 'stable',
          advice: `Based on your ₹${avg.toLocaleString('en-IN')} average in ${data.category}, next month is expected to be ₹${predicted.toLocaleString('en-IN')} (${seasonal > 1 ? 'seasonal uptick' : 'normal period'}).`,
        });
      } else if (key === 'simulate') {
        const savings = data.income - data.expense;
        const r = 0.12/12;
        const projections = Array.from({length: data.years+1}, (_,y) => ({
          year: y,
          savings: Math.round(savings * 12 * y),
          expenses: Math.round(data.expense * 12 * Math.pow(1 + data.inflation/100, y)),
          net_worth: y === 0 ? 0 : Math.round(savings * ((Math.pow(1+r, y*12)-1)/r) * (1+r)),
        }));
        setter({
          year_projections: projections,
          summary: {
            projected_net_worth: projections[projections.length-1].net_worth,
            inflation_impact: `Your ₹${data.expense.toLocaleString('en-IN')}/mo expense becomes ₹${Math.round(data.expense*Math.pow(1+data.inflation/100, data.years)).toLocaleString('en-IN')}/mo in ${data.years} years at ${data.inflation}% inflation.`,
          },
        });
      } else if (key === 'fraud') {
        let score = 0;
        const flags = [];
        if (data.amount > 50000) { score += 0.35; flags.push('Amount exceeds ₹50,000 threshold'); }
        else if (data.amount > 20000) { score += 0.15; flags.push('Above-average transaction amount'); }
        if (data.hour < 5 || data.hour > 23) { score += 0.25; flags.push(`Unusual hour: ${data.hour}:00`); }
        if (['casino','lottery','crypto','unknown'].some(k=>data.merchant.toLowerCase().includes(k))) { score += 0.30; flags.push('High-risk merchant keyword'); }
        if (['ATM','International'].includes(data.category)) { score += 0.2; flags.push(`High-risk category: ${data.category}`); }
        if (flags.length === 0) flags.push('No suspicious patterns detected');
        score = Math.min(1, score);
        setter({
          risk_score: score,
          risk_level: score >= 0.7 ? 'HIGH' : score >= 0.4 ? 'MEDIUM' : 'LOW',
          is_fraudulent: score >= 0.7,
          flags,
          recommendation: score >= 0.7
            ? '⚠️ Block and verify immediately — high fraud probability.'
            : score >= 0.4
            ? '🔍 Monitor closely — verify with merchant.'
            : '✅ Transaction appears normal.',
        });
      }
    } finally { setLoading(l => ({ ...l, [key]: false })); }
  };

  const riskColor = s => s >= 0.7 ? 'text-red-400' : s >= 0.4 ? 'text-amber-400' : 'text-emerald-400';
  const riskBorder = s => s >= 0.7 ? 'border-red-500/30 bg-red-500/5' : s >= 0.4 ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5';

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center gap-3 page-header">
        <div className="p-2.5 bg-violet-600/15 border border-violet-500/20 rounded-xl">
          <Brain size={20} className="text-violet-400"/>
        </div>
        <div>
          <h1 className="page-title">AI Insights</h1>
          <p className="page-subtitle">Rule-based analysis — no random values, real data driven</p>
        </div>
        <div className="ml-auto badge badge-blue gap-1.5">
          <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse"/>
          Engine Active
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Expense Prediction ── */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-violet-400"/>
            <p className="section-title">Expense Prediction</p>
          </div>
          <div className="space-y-3 mb-4">
            <div>
              <label className="input-label">Monthly Income (₹)</label>
              <input type="number" value={expForm.income} onChange={e=>setExpForm({...expForm,income:+e.target.value})} className="input-field text-sm"/>
            </div>
            <div>
              <label className="input-label">Current Month Expense (₹)</label>
              <input type="number" value={expForm.current_expense} onChange={e=>setExpForm({...expForm,current_expense:+e.target.value})} className="input-field text-sm"/>
            </div>
            <div>
              <label className="input-label">Category</label>
              <select value={expForm.category} onChange={e=>setExpForm({...expForm,category:e.target.value})} className="input-field text-sm">
                {['food','transport','entertainment','utilities','shopping','health','rent','other'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button onClick={()=>callAI('/predict-expense', expForm, 'predict', setPrediction)}
            disabled={loading.predict} className="btn-primary w-full justify-center mb-4 text-sm">
            {loading.predict ? <Loader size={15} className="animate-spin"/> : <><Zap size={14}/>Predict Next Month</>}
          </button>
          {prediction && (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 slide-up">
              <p className="text-violet-300 text-xs mb-1">Predicted Next Month</p>
              <p className="text-violet-400 text-2xl font-bold num">{formatINR(prediction.predicted_expense)}</p>
              <p className="text-xs text-slate-400 mt-1">
                Confidence: <strong>{(prediction.confidence*100).toFixed(0)}%</strong> ·
                Trend: <span className={prediction.trend==='increasing'?'text-red-400':'text-emerald-400'}>{prediction.trend}</span>
              </p>
              <p className="text-slate-300 text-xs mt-3 leading-relaxed">{prediction.advice}</p>
            </div>
          )}
        </div>

        {/* ── Future Simulation ── */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-purple-400"/>
            <p className="section-title">Future Simulation</p>
          </div>
          <div className="space-y-3 mb-4">
            <div>
              <label className="input-label">Monthly Income (₹)</label>
              <input type="number" value={simForm.income} onChange={e=>setSimForm({...simForm,income:+e.target.value})} className="input-field text-sm"/>
            </div>
            <div>
              <label className="input-label">Monthly Expense (₹)</label>
              <input type="number" value={simForm.expense} onChange={e=>setSimForm({...simForm,expense:+e.target.value})} className="input-field text-sm"/>
            </div>
            <div>
              <label className="input-label">Years: {simForm.years}</label>
              <input type="range" min="1" max="20" value={simForm.years} onChange={e=>setSimForm({...simForm,years:+e.target.value})} className="w-full accent-violet-500"/>
            </div>
            <div>
              <label className="input-label">Inflation: {simForm.inflation}%</label>
              <input type="range" min="3" max="10" step="0.5" value={simForm.inflation} onChange={e=>setSimForm({...simForm,inflation:+e.target.value})} className="w-full accent-violet-500"/>
            </div>
          </div>
          <button onClick={()=>callAI('/simulate-future', { ...simForm, savings_rate:(simForm.income-simForm.expense)/Math.max(1,simForm.income), investment_return:12 }, 'simulate', setSimulation)}
            disabled={loading.simulate} className="btn-primary w-full justify-center mb-4 text-sm" style={{background:'rgba(124,58,237,0.8)'}}>
            {loading.simulate ? <Loader size={15} className="animate-spin"/> : <><Brain size={14}/>Run Simulation</>}
          </button>
          {simulation && (
            <div className="space-y-3 slide-up">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                <p className="text-purple-300 text-xs mb-0.5">Net Worth in {simForm.years} years</p>
                <p className="text-purple-400 text-xl font-bold num">{formatINR(simulation.summary.projected_net_worth)}</p>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">{simulation.summary.inflation_impact}</p>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={simulation.year_projections.filter((_,i)=>i%Math.max(1,Math.floor(simulation.year_projections.length/5))===0)}>
                  <XAxis dataKey="year" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`Y${v}`}/>
                  <YAxis tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/100000}L`}/>
                  <Tooltip formatter={v=>formatINR(v)}/>
                  <Bar dataKey="net_worth" fill="#7c3aed" radius={[3,3,0,0]} name="Net Worth"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Fraud Detection ── */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-400"/>
            <p className="section-title">Fraud Detection</p>
          </div>
          <div className="space-y-3 mb-4">
            <div>
              <label className="input-label">Transaction Amount (₹)</label>
              <input type="number" value={fraudForm.amount} onChange={e=>setFraudForm({...fraudForm,amount:+e.target.value})} className="input-field text-sm"/>
            </div>
            <div>
              <label className="input-label">Merchant</label>
              <input type="text" value={fraudForm.merchant} onChange={e=>setFraudForm({...fraudForm,merchant:e.target.value})} className="input-field text-sm"/>
            </div>
            <div>
              <label className="input-label">Category</label>
              <select value={fraudForm.category} onChange={e=>setFraudForm({...fraudForm,category:e.target.value})} className="input-field text-sm">
                {['Shopping','Food','Travel','ATM','Online Transfer','International','Utilities'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Transaction Hour: {fraudForm.hour}:00</label>
              <input type="range" min="0" max="23" value={fraudForm.hour} onChange={e=>setFraudForm({...fraudForm,hour:+e.target.value})} className="w-full accent-violet-500"/>
            </div>
          </div>
          <button onClick={()=>callAI('/detect-fraud', fraudForm, 'fraud', setFraud)}
            disabled={loading.fraud} className="btn-primary w-full justify-center mb-4 text-sm" style={{background:'rgba(239,68,68,0.7)'}}>
            {loading.fraud ? <Loader size={15} className="animate-spin"/> : <><AlertTriangle size={14}/>Analyse Transaction</>}
          </button>
          {fraud && (
            <div className={`border rounded-xl p-4 slide-up ${riskBorder(fraud.risk_score)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-lg font-bold ${riskColor(fraud.risk_score)}`}>{fraud.risk_level} RISK</span>
                <span className={`text-2xl font-bold num ${riskColor(fraud.risk_score)}`}>{(fraud.risk_score*100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full mb-3">
                <div className={`h-1.5 rounded-full ${fraud.risk_score>=0.7?'bg-red-500':fraud.risk_score>=0.4?'bg-amber-500':'bg-emerald-500'}`}
                  style={{width:`${fraud.risk_score*100}%`}}/>
              </div>
              <div className="space-y-1 mb-3">
                {fraud.flags.map((f,i)=>(
                  <p key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0"/>
                    {f}
                  </p>
                ))}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{fraud.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
