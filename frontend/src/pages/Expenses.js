import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatINR, formatDate, getCategoryColor } from '../utils/helpers';
import api from '../utils/api';

const CATEGORIES = ['Food','Rent','Transport','Entertainment','Utilities','Health','Education','Shopping','Investment','Salary','Freelance','Other'];

export default function Expenses() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ type:'EXPENSE', amount:'', category:'Food', description:'', date:new Date().toISOString().split('T')[0] });
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter]     = useState('ALL');
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    try { const r = await api.get('/transactions'); setTransactions(r.data); }
    catch { /* empty */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTxn = async (e) => {
    e.preventDefault();
    if (+form.amount <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      await api.post('/transactions', { ...form, amount: +form.amount });
      toast.success('Added!');
      setForm(f => ({ ...f, amount:'', description:'' }));
      setShowForm(false);
      load();
    } catch { toast.error('Failed to add'); }
    finally { setSaving(false); }
  };

  const deleteTxn = async (id) => {
    try { await api.delete(`/transactions/${id}`); setTransactions(t=>t.filter(x=>x.id!==id)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const shown = filter === 'ALL' ? transactions : transactions.filter(t=>t.type===filter);
  const totalIncome  = transactions.filter(t=>t.type==='INCOME').reduce((s,t)=>s + +t.amount,0);
  const totalExpense = transactions.filter(t=>t.type==='EXPENSE').reduce((s,t)=>s + +t.amount,0);

  const catMap = {};
  transactions.filter(t=>t.type==='EXPENSE').forEach(t=>{ catMap[t.category]=(catMap[t.category]||0)+ +t.amount; });
  const pieData = Object.entries(catMap).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track every rupee — income and expenses</p>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} className="btn-primary text-sm">
          <Plus size={15}/> Add
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-slate-400 text-xs mb-1">Total Income</p>
          <p className="text-emerald-400 text-xl font-bold num">{formatINR(totalIncome)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-xs mb-1">Total Expense</p>
          <p className="text-red-400 text-xl font-bold num">{formatINR(totalExpense)}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-xs mb-1">Net Balance</p>
          <p className={`text-xl font-bold num ${totalIncome-totalExpense>=0?'text-violet-400':'text-red-400'}`}>
            {formatINR(totalIncome-totalExpense)}
          </p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card border-violet-500/30 slide-up">
          <p className="section-title mb-4">New Transaction</p>
          <form onSubmit={addTxn} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="input-label">Type</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="input-field">
                <option value="INCOME">Income</option><option value="EXPENSE">Expense</option>
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
              <input type="text" placeholder="Grocery run..." value={form.description}
                onChange={e=>setForm({...form,description:e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="input-label">Date</label>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="input-field" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                {saving?<span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>:'Save'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* List */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title">Transactions</p>
            <div className="flex gap-1.5">
              {['ALL','INCOME','EXPENSE'].map(f=>(
                <button key={f} onClick={()=>setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${filter===f?'bg-violet-600 text-white':'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="empty-state">
              <Wallet size={28} className="text-slate-700 mb-3"/>
              <p className="text-slate-500 text-sm">No transactions yet</p>
              <button onClick={()=>setShowForm(true)} className="btn-primary text-sm mt-4">
                <Plus size={14}/> Add your first transaction
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {shown.map(t=>(
                <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl hover:bg-slate-800/70 transition-colors group">
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{background:`${getCategoryColor(t.category)}18`}}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{background:getCategoryColor(t.category)}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{t.description||t.category}</p>
                    <p className="text-slate-500 text-xs">{formatDate(t.date)} · {t.category}</p>
                  </div>
                  <p className={`num text-sm font-bold ${t.type==='INCOME'?'text-emerald-400':'text-red-400'}`}>
                    {t.type==='INCOME'?'+':'-'}{formatINR(t.amount)}
                  </p>
                  <button onClick={()=>deleteTxn(t.id)}
                    className="text-slate-700 hover:text-red-400 transition-colors ml-1 opacity-0 group-hover:opacity-100">
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="card">
          <p className="section-title mb-4">By Category</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} paddingAngle={2} dataKey="value">
                    {pieData.map((e,i)=><Cell key={i} fill={getCategoryColor(e.name)}/>)}
                  </Pie>
                  <Tooltip formatter={v=>formatINR(v)}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pieData.slice(0,6).map(c=>(
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
          ) : (
            <div className="empty-state py-8">
              <p className="text-slate-600 text-sm">No expense data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
