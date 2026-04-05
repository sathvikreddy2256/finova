import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, BarChart, Bar
} from 'recharts';
import {
  TrendingUp, TrendingDown, Plus, Trash2, Zap, Star,
  RefreshCw, ArrowUpRight, ArrowDownRight, Info, Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatINR, calcSIPFV } from '../utils/helpers';
import api from '../utils/api';

const CAT_COLORS = {
  LARGE_CAP:'#7c3aed', MID_CAP:'#2563eb', SMALL_CAP:'#dc2626',
  GOLD:'#d97706', SILVER:'#6b7280', MUTUAL_FUND:'#059669',
};
const CAT_LABELS = {
  LARGE_CAP:'Large Cap', MID_CAP:'Mid Cap', SMALL_CAP:'Small Cap',
  GOLD:'Gold', SILVER:'Silver', MUTUAL_FUND:'Mutual Fund',
};

const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs shadow-xl">
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="num">{p.name}: {formatINR(p.value)}</p>
      ))}
    </div>
  );
};

export default function Investments() {
  const [market, setMarket]         = useState([]);
  const [portfolio, setPortfolio]   = useState([]);
  const [best, setBest]             = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [profile, setProfile]       = useState(null);
  const [activeTab, setActiveTab]   = useState('market');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [buyForm, setBuyForm]       = useState({ marketOptionId:'', amount:'', monthlySip:'' });
  const [buying, setBuying]         = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mkt, port, b, prof] = await Promise.all([
        api.get('/investments/market'),
        api.get('/investments/portfolio'),
        api.get('/investments/market/best'),
        api.get('/user/profile'),
      ]);
      setMarket(mkt.data);
      setPortfolio(port.data);
      setBest(b.data);
      setProfile(prof.data);
      if (prof.data?.riskLevel) {
        const sug = await api.get(`/investments/suggest?risk=${prof.data.riskLevel}`);
        setSuggestions(sug.data);
      }
    } catch { /* empty state */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setTimeout(() => setRefreshing(false), 800);
    toast.success('Prices refreshed');
  };

  const buyInvestment = async (e) => {
    e.preventDefault();
    if (!buyForm.marketOptionId) { toast.error('Select an investment'); return; }
    if (+buyForm.amount <= 0)    { toast.error('Enter a valid amount'); return; }
    setBuying(true);
    try {
      await api.post('/investments/portfolio', {
        marketOptionId: +buyForm.marketOptionId,
        amount: +buyForm.amount,
        monthlySip: buyForm.monthlySip ? +buyForm.monthlySip : null,
      });
      toast.success('Investment added to portfolio!');
      setShowBuyForm(false);
      setBuyForm({ marketOptionId:'', amount:'', monthlySip:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add'); }
    finally { setBuying(false); }
  };

  const deletePosition = async (id) => {
    try {
      await api.delete(`/investments/portfolio/${id}`);
      setPortfolio(p => p.filter(x => x.id !== id));
      toast.success('Position removed');
    } catch { toast.error('Failed to remove'); }
  };

  // Derived values
  const totalInvested  = portfolio.reduce((s, p) => s + +p.investedAmount, 0);
  const totalCurrent   = portfolio.reduce((s, p) => s + +p.currentValue, 0);
  const totalProfit    = totalCurrent - totalInvested;
  const overallRetPct  = totalInvested > 0 ? (totalProfit / totalInvested * 100).toFixed(2) : 0;

  // Portfolio allocation pie data
  const allocMap = {};
  portfolio.forEach(p => { allocMap[p.category] = (allocMap[p.category] || 0) + +p.currentValue; });
  const pieData = Object.entries(allocMap).map(([name, value]) => ({ name, value }));

  const filteredMarket = selectedCat === 'ALL' ? market : market.filter(m => m.category === selectedCat);
  const cats = ['ALL', ...new Set(market.map(m => m.category))];

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Investments</h1>
          <p className="page-subtitle">Live market data · Portfolio P&L · AI-driven suggestions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} disabled={refreshing} className="btn-ghost text-sm">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowBuyForm(v => !v)} className="btn-primary text-sm">
            <Plus size={15} /> Invest
          </button>
        </div>
      </div>

      {/* Best Today Banner */}
      {best && (
        <div className="card border-amber-500/20 bg-amber-500/5 flex items-center gap-4">
          <div className="p-2.5 bg-amber-500/20 rounded-xl flex-shrink-0">
            <Star size={18} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 text-xs font-medium">🏆 Best Performer Today</p>
            <p className="text-white font-semibold truncate">{best.name}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-emerald-400 font-bold num">+{best.dailyChangePct}%</p>
            <p className="text-slate-400 text-xs">{CAT_LABELS[best.category]}</p>
          </div>
        </div>
      )}

      {/* Portfolio Summary */}
      {portfolio.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Total Invested', value:formatINR(totalInvested), color:'text-white' },
            { label:'Current Value',  value:formatINR(totalCurrent),  color:'text-emerald-400' },
            { label:'Total P&L',      value:`${totalProfit>=0?'+':''}${formatINR(totalProfit)}`, color:totalProfit>=0?'text-emerald-400':'text-red-400' },
            { label:'Overall Return', value:`${overallRetPct}%`, color:+overallRetPct>=0?'text-emerald-400':'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card">
              <p className="text-slate-400 text-xs mb-1">{label}</p>
              <p className={`text-xl font-bold num ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Buy Form */}
      {showBuyForm && (
        <div className="card border-violet-500/30 slide-up">
          <p className="section-title mb-4">Add Investment to Portfolio</p>
          <form onSubmit={buyInvestment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2">
              <label className="input-label">Select Investment</label>
              <select value={buyForm.marketOptionId}
                onChange={e => setBuyForm({ ...buyForm, marketOptionId: e.target.value })}
                className="input-field" required>
                <option value="">— Choose —</option>
                {market.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({CAT_LABELS[m.category]}) — ₹{(+m.currentPrice).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Amount to Invest (₹)</label>
              <input type="number" placeholder="10000" value={buyForm.amount}
                onChange={e => setBuyForm({ ...buyForm, amount: e.target.value })}
                className="input-field" required min="100" />
            </div>
            <div>
              <label className="input-label">Monthly SIP (₹, optional)</label>
              <input type="number" placeholder="1000" value={buyForm.monthlySip}
                onChange={e => setBuyForm({ ...buyForm, monthlySip: e.target.value })}
                className="input-field" />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
              <button type="submit" disabled={buying} className="btn-primary">
                {buying
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : 'Confirm Investment'}
              </button>
              <button type="button" onClick={() => setShowBuyForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800 pb-0">
        {[
          { key:'market', label:'🏪 Market' },
          { key:'portfolio', label:'💼 My Portfolio' },
          { key:'suggest', label:'🤖 AI Suggestions' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all ${
              activeTab === key
                ? 'border-violet-500 text-violet-400 bg-violet-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: Market ── */}
      {activeTab === 'market' && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {cats.map(c => (
              <button key={c} onClick={() => setSelectedCat(c)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedCat === c ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}>
                {c === 'ALL' ? 'All' : CAT_LABELS[c] || c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMarket.map(opt => {
              const up = opt.dailyChangePct >= 0;
              return (
                <div key={opt.id} className="card-hover group">
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium"
                          style={{ background: `${CAT_COLORS[opt.category]}20`, color: CAT_COLORS[opt.category] }}>
                          {CAT_LABELS[opt.category]}
                        </span>
                        <span className={`badge ${opt.riskLevel==='LOW'?'badge-blue':opt.riskLevel==='HIGH'?'badge-red':'badge-yellow'} text-[10px]`}>
                          {opt.riskLevel}
                        </span>
                      </div>
                      <p className="text-white font-semibold text-sm leading-tight mt-1 pr-2">{opt.name}</p>
                      <p className="text-slate-500 text-xs">{opt.fundHouse} · {opt.symbol}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-bold num">₹{(+opt.currentPrice).toLocaleString('en-IN', {maximumFractionDigits:2})}</p>
                      <div className={`flex items-center gap-0.5 justify-end text-xs font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                        {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        <span className="num">{up ? '+' : ''}{opt.dailyChangePct}%</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed mb-3 line-clamp-2">{opt.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-[10px]">1Y Return</p>
                      <p className="text-emerald-400 font-bold text-sm num">+{opt.oneYearReturn}%</p>
                    </div>
                    <button
                      onClick={() => {
                        setBuyForm({ marketOptionId: String(opt.id), amount:'', monthlySip:'' });
                        setShowBuyForm(true);
                      }}
                      className="btn-primary text-xs py-1.5 px-3">
                      <Plus size={12} /> Invest
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: Portfolio ── */}
      {activeTab === 'portfolio' && (
        <div className="space-y-5">
          {portfolio.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <TrendingUp size={28} className="text-slate-700 mb-3" />
                <h3 className="font-display font-semibold text-white mb-1">Portfolio is empty</h3>
                <p className="text-slate-400 text-sm mb-5">Go to Market tab and invest to build your portfolio.</p>
                <button onClick={() => setActiveTab('market')} className="btn-primary text-sm">
                  <TrendingUp size={14} /> Browse Market
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* Holdings */}
              <div className="xl:col-span-2 space-y-3">
                {portfolio.map(pos => {
                  const up = +pos.profit >= 0;
                  return (
                    <div key={pos.id} className="card-hover group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-semibold text-sm">{pos.name}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded font-medium"
                              style={{ background: `${CAT_COLORS[pos.category]}20`, color: CAT_COLORS[pos.category] }}>
                              {CAT_LABELS[pos.category]}
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs">{pos.units} units · Bought @ ₹{(+pos.buyPrice).toLocaleString('en-IN', {maximumFractionDigits:2})}</p>
                        </div>
                        <button onClick={() => deletePosition(pos.id)}
                          className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-xs mt-3">
                        <div><p className="text-slate-500">Invested</p><p className="text-white num">{formatINR(pos.investedAmount)}</p></div>
                        <div><p className="text-slate-500">Current</p><p className="text-white num">{formatINR(pos.currentValue)}</p></div>
                        <div>
                          <p className="text-slate-500">P&L</p>
                          <p className={`num font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                            {up ? '+' : ''}{formatINR(pos.profit)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Return</p>
                          <p className={`num font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                            {up ? '+' : ''}{pos.returnPct}%
                          </p>
                        </div>
                      </div>
                      {/* Return bar */}
                      <div className="mt-3">
                        <div className="h-1 bg-slate-800 rounded-full">
                          <div className={`h-1 rounded-full ${up ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, Math.abs(pos.returnPct))}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Allocation chart */}
              <div className="space-y-4">
                <div className="card">
                  <p className="section-title mb-4">Allocation</p>
                  {pieData.length > 0 && (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                            {pieData.map((e, i) => <Cell key={i} fill={CAT_COLORS[e.name] || '#7c3aed'} />)}
                          </Pie>
                          <Tooltip formatter={v => formatINR(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-2">
                        {pieData.map(c => (
                          <div key={c.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[c.name] || '#7c3aed' }} />
                              <span className="text-slate-400">{CAT_LABELS[c.name]}</span>
                            </div>
                            <span className="text-white num">{formatINR(c.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="card">
                  <p className="section-title mb-3">Portfolio Health</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Invested</span>
                      <span className="text-white num">{formatINR(totalInvested)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current</span>
                      <span className="text-emerald-400 num">{formatINR(totalCurrent)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2">
                      <span className="text-slate-300 font-medium">Total P&L</span>
                      <span className={`num font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {totalProfit >= 0 ? '+' : ''}{formatINR(totalProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-medium">XIRR</span>
                      <span className={`num font-bold ${+overallRetPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {overallRetPct}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: AI Suggestions ── */}
      {activeTab === 'suggest' && (
        <div className="space-y-4">
          <div className="card border-violet-500/20 bg-violet-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-violet-400" />
              <p className="section-title">Based on your profile</p>
            </div>
            <p className="text-slate-400 text-sm">
              Risk profile: <span className="text-violet-400 font-semibold">{profile?.riskLevel || 'MEDIUM'}</span> ·
              Showing top 3 options ranked by 1-year return within your risk bracket.
            </p>
          </div>

          {suggestions.length === 0 ? (
            <div className="card">
              <div className="empty-state py-8">
                <p className="text-slate-500 text-sm">Complete onboarding to get personalised suggestions.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {suggestions.map((opt, i) => (
                <div key={opt.id} className={`card-hover ${i === 0 ? 'border-violet-500/40' : ''}`}>
                  {i === 0 && (
                    <div className="badge badge-blue mb-3 gap-1">
                      <Star size={10} /> Best for you
                    </div>
                  )}
                  <p className="text-white font-semibold text-sm mb-0.5">{opt.name}</p>
                  <p className="text-slate-500 text-xs mb-3">{opt.fundHouse}</p>
                  <div className="space-y-1.5 text-xs mb-4">
                    <div className="flex justify-between"><span className="text-slate-400">1Y Return</span><span className="text-emerald-400 num font-bold">+{opt.oneYearReturn}%</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Price</span><span className="text-white num">₹{(+opt.currentPrice).toLocaleString('en-IN', {maximumFractionDigits:2})}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Risk</span><span className="text-white">{opt.riskLevel}</span></div>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed mb-3">{opt.description}</p>
                  <button onClick={() => {
                    setBuyForm({ marketOptionId: String(opt.id), amount:'', monthlySip:'' });
                    setShowBuyForm(true);
                    setActiveTab('market');
                  }} className="btn-primary text-xs w-full justify-center">
                    <Plus size={12} /> Invest Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
