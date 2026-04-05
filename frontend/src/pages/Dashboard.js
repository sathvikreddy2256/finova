import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Plus, ArrowRight } from 'lucide-react';
import { formatINR, getCategoryColor, pct } from '../utils/helpers';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food','Rent','Transport','Entertainment','Utilities','Health','Education','Shopping','Investment','Salary','Other'];

function StatCard({ title, value, sub, icon: Icon, color, empty }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium">{title}</p>
          {empty
            ? <p className="text-slate-600 text-lg font-semibold mt-0.5">No data yet</p>
            : <p className={`text-2xl font-bold mt-0.5 num ${color}`}>{formatINR(value)}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color.includes('emerald') ? 'bg-emerald-500/10' : color.includes('red') ? 'bg-red-500/10' : 'bg-violet-500/10'}`}>
          <Icon size={18} className={color} />
        </div>
      </div>
      {!empty && <p className="text-slate-500 text-xs">{sub}</p>}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{color:p.color}} className="num">{p.name}: {formatINR(p.value)}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [recent, setRecent]   = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type:'EXPENSE', amount:'', category:'Food', description:'', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, c, r] = await Promise.all([
        api.get('/transactions/summary'),
        api.get('/transactions/chart'),
        api.get('/transactions/recent'),
      ]);
      setSummary(s.data);
      setChartData(c.data);
      setRecent(r.data);
    } catch { /* stay empty on error */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTransaction = async (e) => {
    e.preventDefault();
    if (!form.amount || +form.amount <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      await api.post('/transactions', { ...form, amount: +form.amount });
      toast.success('Transaction added!');
      setForm(f => ({ ...f, amount:'', description:'' }));
      setShowForm(false);
      load();
    } catch { toast.error('Failed to add transaction'); }
    finally { setSaving(false); }
  };

  const hasData = summary && (+summary.totalIncome > 0 || +summary.totalExpense > 0);
  const savingsRate = summary && +summary.totalIncome > 0
    ? +pct(+summary.savings, +summary.totalIncome) : 0;

  // Expense breakdown for pie chart
  const catMap = {};
  recent.filter(t=>t.type==='EXPENSE').forEach(t => {
    catMap[t.category] = (catMap[t.category]||0) + +t.amount;
  });
  const pieData = Object.entries(catMap).map(([name,value]) => ({ name, value }));

  return (
    <div className="space-y-5 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-IN',{month:'long', year:'numeric'})} · real data only
          </p>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} className="btn-primary text-sm">
          <Plus size={15}/> Add Transaction
        </button>
      </div>

      {/* Quick-add form */}
      {showForm && (
        <div className="card border-violet-500/30 slide-up">
          <p className="section-title mb-4">New Transaction</p>
          <form onSubmit={addTransaction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="input-label">Type</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="input-field">
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div>
              <label className="input-label">Amount (₹)</label>
              <input type="number" placeholder="5000" value={form.amount}
                onChange={e=>setForm({...form,amount:e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Category</label>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="input-field">
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Description</label>
              <input type="text" placeholder="e.g. Grocery run" value={form.description}
                onChange={e=>setForm({...form,description:e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="input-label">Date</label>
              <input type="date" value={form.date}
                onChange={e=>setForm({...form,date:e.target.value})} className="input-field" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : 'Save'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {!hasData && !showForm && (
        <div className="card">
          <div className="empty-state">
            <div className="w-14 h-14 bg-violet-500/10 rounded-full flex items-center justify-center mb-4">
              <Wallet size={26} className="text-violet-400"/>
            </div>
            <h3 className="font-display font-semibold text-white mb-1">No financial data yet</h3>
            <p className="text-slate-400 text-sm max-w-xs mb-5">
              Add your first income or expense to see your personalised dashboard come to life.
            </p>
            <div className="flex gap-3">
              <button onClick={()=>{setForm(f=>({...f,type:'INCOME'}));setShowForm(true);}} className="btn-primary text-sm">
                <Plus size={14}/> Add Income
              </button>
              <button onClick={()=>{setForm(f=>({...f,type:'EXPENSE'}));setShowForm(true);}} className="btn-secondary text-sm">
                <Plus size={14}/> Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      {hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Monthly Income"  value={summary.totalIncome}  sub="This month" icon={TrendingUp}   color="text-emerald-400" />
          <StatCard title="Monthly Expense" value={summary.totalExpense} sub="This month" icon={TrendingDown} color="text-red-400"     />
          <StatCard title="Net Savings"     value={summary.savings}      sub={`${savingsRate}% savings rate`} icon={PiggyBank} color="text-violet-400" />
          <StatCard title="Portfolio Value" value={summary.investments}  sub="Total investments" icon={Wallet} color="text-blue-400" />
        </div>
      )}

      {/* Charts — only show when there's chart data */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Area chart */}
          <div className="card xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <p className="section-title">Income vs Expenses</p>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-3 h-0.5 bg-emerald-400 rounded"/>Income</span>
                <span className="flex items-center gap-1.5 text-red-400"><span className="w-3 h-0.5 bg-red-400 rounded"/>Expense</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v/1000}k`}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Area type="monotone" dataKey="income"  stroke="#10b981" strokeWidth={2} fill="url(#gi)" name="Income"/>
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#ge)" name="Expense"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="card">
            <p className="section-title mb-4">Expense Breakdown</p>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                      {pieData.map((e,i)=><Cell key={i} fill={getCategoryColor(e.name)}/>)}
                    </Pie>
                    <Tooltip formatter={v=>formatINR(v)}/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.slice(0,5).map(c=>(
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{background:getCategoryColor(c.name)}}/>
                        <span className="text-slate-400">{c.name}</span>
                      </div>
                      <span className="text-white num">{formatINR(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-slate-600 text-sm text-center py-8">No expenses yet</p>}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      {recent.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title">Recent Transactions</p>
            <button onClick={()=>navigate('/expenses')} className="btn-ghost text-xs">
              View all <ArrowRight size={12}/>
            </button>
          </div>
          <div className="space-y-2">
            {recent.slice(0,6).map(t=>(
              <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl hover:bg-slate-800/70 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{background:`${getCategoryColor(t.category)}18`}}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{background:getCategoryColor(t.category)}}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.description || t.category}</p>
                  <p className="text-slate-500 text-xs">{t.category} · {t.date}</p>
                </div>
                <p className={`num text-sm font-semibold ${t.type==='INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.type==='INCOME' ? '+' : '-'}{formatINR(t.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
