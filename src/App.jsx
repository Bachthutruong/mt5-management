import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  History,
  Settings as SettingsIcon,
  Terminal,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Activity,
  LogOut,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Zap,
  Filter,
  Search,
  PlusSquare,
  BarChart2,
  Newspaper
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// --- CONFIGURATION ---
const API_BASE = "https://bot.jiudi.cloud/api";
axios.defaults.timeout = 15000; 

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-gradient-main text-white shadow-lg' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium text-sm lg:text-base">{label}</span>
    {active && <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
  </button>
);

const StatCard = ({ title, value, subValue, icon: Icon, trend, prefix = "$" }) => (
  <div className="glass-card bg-neutral-900/50 p-4 lg:p-6 rounded-2xl flex flex-col gap-3 border border-white/10">
    <div className="flex justify-between items-start">
      <div className="p-2 lg:p-2.5 rounded-xl bg-white/5 text-primary group-hover:scale-110 transition-all duration-300">
        <Icon size={window.innerWidth < 640 ? 20 : 24} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs lg:text-sm font-semibold ${trend >= 0 ? 'text-success' : 'text-error'}`}>
          {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-gray-400 text-xs lg:text-sm font-medium">{title}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <h3 className="text-xl lg:text-2xl font-bold tracking-tight">
          {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}
        </h3>
        {subValue && <span className="text-gray-500 text-[10px] lg:text-xs truncate">{subValue}</span>}
      </div>
    </div>
  </div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Log filters
  const [selectedLogSymbol, setSelectedLogSymbol] = useState(null);
  const [newSymbol, setNewSymbol] = useState('');

  // History filters & pagination
  const [historySymbol, setHistorySymbol] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [historyDays, setHistoryDays] = useState(30);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyRows, setHistoryRows] = useState(25);
  const [newsData, setNewsData] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, posRes, histRes, logRes, symRes] = await Promise.all([
        axios.get(`${API_BASE}/account`),
        axios.get(`${API_BASE}/positions`),
        axios.get(`${API_BASE}/history?days=${historyDays}`),
        axios.get(`${API_BASE}/logs?symbol=${selectedLogSymbol || ''}&lines=50`),
        axios.get(`${API_BASE}/symbols`)
      ]);
      setAccount(accRes.data);
      setPositions(Array.isArray(posRes.data) ? posRes.data : []);
      setHistory(Array.isArray(histRes.data) ? histRes.data : []);
      setLogs(Array.isArray(logRes.data) ? logRes.data : []);
      setSymbols(Array.isArray(symRes.data) ? symRes.data : []);
      if (!selectedLogSymbol && Array.isArray(symRes.data) && symRes.data.length > 0) {
        setSelectedLogSymbol(symRes.data[0]);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to VPS API. check HTTPS/DNS or Service status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [selectedLogSymbol, historyDays]);

  const fetchNews = async () => {
    try {
      const res = await axios.get(`${API_BASE}/news`);
      setNewsData(res.data || {});
    } catch (err) { /* silent — news is optional */ }
  };

  useEffect(() => {
    fetchNews();
    const newsInterval = setInterval(fetchNews, 300000); // refresh mỗi 5 phút
    return () => clearInterval(newsInterval);
  }, []);

  const safeHistory = Array.isArray(history) ? history : [];
  const todayPnl = safeHistory.reduce((sum, trade) => sum + (trade.profit || 0), 0);
  const winRate = safeHistory.length > 0 ? (safeHistory.filter(t => t.profit > 0).length / safeHistory.length * 100) : 0;

  // History — filter + sort newest first + paginate
  const filteredHistory = [...safeHistory]
    .filter(h => historySymbol === 'ALL' || h.symbol === historySymbol)
    .filter(h => {
      if (!historySearch) return true;
      const q = historySearch.toLowerCase();
      return h.symbol.toLowerCase().includes(q) || String(h.ticket).includes(q);
    })
    .sort((a, b) => new Date(b.time) - new Date(a.time));

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / historyRows));
  const pagedHistory = filteredHistory.slice((historyPage - 1) * historyRows, historyPage * historyRows);

  // Summary stats for filtered result
  const histWins   = filteredHistory.filter(t => t.profit > 0).length;
  const histLosses = filteredHistory.filter(t => t.profit < 0).length;
  const histPnl    = filteredHistory.reduce((s, t) => s + (t.profit || 0), 0);

  // Unique symbols from history for filter tabs
  const historySymbols = ['ALL', ...Array.from(new Set(safeHistory.map(h => h.symbol))).sort()];

  const equityCurveData = [...safeHistory]
    .sort((a, b) => new Date(a.time) - new Date(b.time))
    .reduce((acc, trade) => {
      const last = acc.length > 0 ? acc[acc.length - 1].cumPnL : 0;
      acc.push({
        time: (trade.time || "").slice(5, 16),
        cumPnL: +(last + (trade.profit || 0)).toFixed(2)
      });
      return acc;
    }, []);

  const handleAddSymbol = async (e) => {
    e.preventDefault();
    if (!newSymbol) return;
    try {
      await axios.post(`${API_BASE}/symbols/add?symbol=${newSymbol.toUpperCase()}`);
      alert(`Đã thêm yêu cầu mã ${newSymbol.toUpperCase()}. Bot sẽ khởi chạy sau ít phút.`);
      setNewSymbol('');
      fetchData();
    } catch (err) {
      alert("Lỗi khi thêm mã!");
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-main flex items-center justify-center shadow-lg">
          <Activity className="text-white" size={24} />
        </div>
        <div>
          <h2 className="font-bold text-lg lg:text-xl tracking-tight">Antigravity</h2>
          <p className="text-[10px] text-secondary font-semibold uppercase tracking-wider">Quant Suite v3.2</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
        <SidebarItem icon={History} label="Trade History" active={activeTab === 'history'} onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} />
        <SidebarItem icon={Terminal} label="Real-time Logs" active={activeTab === 'logs'} onClick={() => { setActiveTab('logs'); setIsSidebarOpen(false); }} />
        <SidebarItem icon={SettingsIcon} label="Trading Setup" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} />
        <SidebarItem icon={Newspaper} label="Market News" active={activeTab === 'news'} onClick={() => { setActiveTab('news'); setIsSidebarOpen(false); fetchNews(); }} />
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-4">
        <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/10">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bach" alt="Avatar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs lg:text-sm truncate">Bach Anh</p>
            <p className="text-[10px] text-gray-500 truncate">Pro Account</p>
          </div>
          <LogOut size={14} className="text-gray-500 hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] lg:w-[40%] lg:h-[40%] bg-primary/20 rounded-full blur-[100px] lg:blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] lg:w-[40%] lg:h-[40%] bg-accent/10 rounded-full blur-[100px] lg:blur-[120px]" />
      </div>

      <div className="relative z-10 flex h-screen p-2 lg:p-4 gap-4 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 glass rounded-3xl p-6 flex-col h-full">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              />
              <motion.aside 
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="fixed left-0 top-0 bottom-0 w-72 glass z-50 p-6 flex flex-col lg:hidden"
              >
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 h-full overflow-y-auto pr-1 lg:pr-2 custom-scrollbar flex flex-col gap-4 lg:gap-6">
          {/* Top Navbar */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 px-2 gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 bg-white/5 rounded-xl border border-white/10"
              >
                <Activity size={20} />
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
                  {activeTab === 'dashboard' ? 'Market Overview' : 
                   activeTab === 'history' ? 'Trade History' : 
                   activeTab === 'logs' ? 'System Console' : 'Trading Setup'}
                </h1>
                <p className="text-gray-400 text-xs lg:text-sm hidden sm:block">Real-time Quant Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-white/5 rounded-full border border-white/10 text-[10px] lg:text-sm font-medium">
                <div className={`w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full ${error ? 'bg-error' : 'bg-success animate-pulse'}`} />
                <span className="truncate max-w-[80px] sm:max-w-none">{error ? 'Offline' : 'Online'}</span>
                <span className="text-white/20 mx-1">|</span>
                <span className="text-gray-400 truncate max-w-[100px]">{account?.server || 'Sync...'}</span>
              </div>
              <button onClick={fetchData} className={`p-2 lg:p-2.5 rounded-full ${loading ? 'animate-spin' : ''} bg-primary/10 text-primary hover:bg-primary/20 transition-colors`}>
                <RefreshCw size={18} />
              </button>
            </div>
          </header>

          {error && (
            <div className="p-3 lg:p-4 bg-error/10 border border-error/30 rounded-2xl text-error text-xs lg:text-sm font-medium flex items-center gap-2 lg:gap-3 mx-2">
               <ShieldCheck size={18} />
               <span className="flex-1">{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 lg:gap-6 pb-6 mx-2">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  <StatCard title="Balance" value={account?.balance || 0} subValue={account?.currency} icon={DollarSign} />
                  <StatCard title="Equity" value={account?.equity || 0} subValue={`Margin: $${account?.margin?.toFixed(0) || 0}`} icon={TrendingUp} />
                  <StatCard title="Total P&L" value={todayPnl} subValue="24h History" icon={Zap} trend={todayPnl >= 0 ? 1 : -1} />
                  <StatCard title="Win Rate" value={winRate} prefix="" subValue="%" icon={Percent} />
                </div>

                {/* P&L Equity Curve */}
                {equityCurveData.length > 0 && (
                  <div className="glass-card rounded-3xl p-4 lg:p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-base lg:text-lg flex items-center gap-2">
                        <TrendingUp size={18} className="text-success" /> 7-Day P&amp;L Curve
                      </h3>
                      <span className={`text-sm font-bold font-mono ${todayPnl >= 0 ? 'text-success' : 'text-error'}`}>
                        {todayPnl >= 0 ? '+' : ''}${todayPnl.toFixed(2)}
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={equityCurveData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                        <Tooltip
                          contentStyle={{ background: '#1a1b23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                          formatter={v => [`$${v}`, 'Cum. P&L']}
                        />
                        <Area type="monotone" dataKey="cumPnL" stroke="#6366f1" strokeWidth={2} fill="url(#pnlGrad)" dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                  {/* Positions */}
                  <div className="lg:col-span-2 glass-card rounded-3xl p-4 lg:p-6 flex flex-col gap-4 min-h-[300px]">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-base lg:text-lg flex items-center gap-2">
                        <BarChart2 size={18} className="text-primary" /> Active Positions
                      </h3>
                      <span className="text-[10px] lg:text-xs text-gray-500">{positions.length} trades</span>
                    </div>
                    
                    {positions.length === 0 ? (
                       <div className="flex-1 flex flex-col items-center justify-center text-gray-500 italic gap-2 py-10 opacity-50">
                         <Activity size={32} />
                         <span className="text-sm">No active positions at the moment</span>
                       </div>
                    ) : (
                      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
                        <table className="w-full text-left">
                          <thead className="text-[10px] lg:text-xs font-bold text-gray-500 uppercase border-b border-white/5">
                            <tr><th className="pb-3 pr-2">Symbol</th><th className="pb-3 pr-2">Type</th><th className="pb-3 text-right">Profit</th></tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono text-sm">
                            {positions.map((p, i) => (
                              <tr key={i} className="group hover:bg-white/5 transition-colors">
                                <td className="py-3 font-bold">{p.symbol}</td>
                                <td className="py-3">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.type === 'BUY' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                                    {p.type} {p.volume}
                                  </span>
                                </td>
                                <td className={`py-3 text-right font-bold ${p.profit >= 0 ? 'text-success' : 'text-error'}`}>
                                  ${p.profit.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Infrastructure Status */}
                  <div className="glass-card rounded-3xl p-4 lg:p-6 flex flex-col gap-4">
                    <h3 className="font-bold text-base lg:text-lg">Bot Infrastructure</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Cloud API', value: 'Connected', icon: Zap, color: 'text-success' },
                        { label: 'Node Load', value: '8.4%', icon: Cpu, color: 'text-primary' },
                        { label: 'Execution', value: '42ms', icon: RefreshCw, color: 'text-secondary' },
                        { label: 'Active Pairs', value: symbols.length, icon: Filter, color: 'text-warning' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 transition-all cursor-default">
                          <div className="flex items-center gap-3">
                            <item.icon size={16} className={item.color} />
                            <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                          </div>
                          <span className="text-xs font-bold font-mono">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex-1 glass-card rounded-3xl p-4 lg:p-6 h-[calc(100vh-140px)] flex flex-col gap-4 font-mono text-[10px] lg:text-xs overflow-hidden mx-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Terminal size={18} className="text-secondary" />
                        <span className="font-bold">Real-time Bot Logs</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-xs text-gray-500 font-bold whitespace-nowrap">Source:</span>
                        <select 
                            value={selectedLogSymbol || ''} 
                            onChange={(e) => setSelectedLogSymbol(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary w-full sm:w-32"
                        >
                            {symbols.map(s => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex-1 bg-black/40 rounded-2xl p-4 lg:p-6 overflow-y-auto custom-scrollbar border border-white/10 leading-relaxed shadow-inner">
                  {logs.length === 0 ? (
                    <div className="text-gray-600 italic">No logs found for {selectedLogSymbol}...</div>
                  ) : logs.map((line, i) => {
                    const isError = line.includes('ERROR') || line.includes('CRITICAL');
                    const isSuccess = line.includes('SUCCESS') || line.includes('EXECUTED') || line.includes('DONE');
                    return (
                      <div key={i} className={`mb-1 break-words py-1 border-b border-white/5 last:border-0 ${isError ? 'text-error' : isSuccess ? 'text-success font-bold' : 'text-gray-400'}`}>
                        {line}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex flex-col gap-4 mx-2 pb-6">

                {/* ── Toolbar ── */}
                <div className="glass-card rounded-3xl p-4 lg:p-5 flex flex-col gap-4">
                  {/* Row 1: Symbol tabs + Days selector */}
                  <div className="flex flex-wrap items-center gap-2">
                    {historySymbols.map(sym => (
                      <button
                        key={sym}
                        onClick={() => { setHistorySymbol(sym); setHistoryPage(1); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          historySymbol === sym
                            ? 'bg-gradient-main text-white shadow-md'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                      >
                        {sym === 'ALL' ? 'All Symbols' : sym}
                      </button>
                    ))}
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-semibold uppercase">Period:</span>
                      {[7, 14, 30].map(d => (
                        <button
                          key={d}
                          onClick={() => { setHistoryDays(d); setHistoryPage(1); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            historyDays === d
                              ? 'bg-white/20 text-white'
                              : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Row 2: Search + Summary */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Tìm theo symbol hoặc ticket..."
                        value={historySearch}
                        onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    {/* Summary chips */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300">
                        {filteredHistory.length} lệnh
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-success/10 border border-success/20 text-[10px] font-bold text-success">
                        WIN {histWins}
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-error/10 border border-error/20 text-[10px] font-bold text-error">
                        LOSS {histLosses}
                      </span>
                      <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold font-mono ${histPnl >= 0 ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'}`}>
                        {histPnl >= 0 ? '+' : ''}${histPnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Table ── */}
                <div className="glass-card rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[620px]">
                      <thead>
                        <tr className="text-[10px] font-bold text-gray-500 uppercase border-b border-white/5 bg-white/2">
                          <th className="px-4 lg:px-6 py-3">#</th>
                          <th className="px-2 py-3">Thời gian</th>
                          <th className="px-2 py-3">Symbol</th>
                          <th className="px-2 py-3">Loại</th>
                          <th className="px-2 py-3">Vol</th>
                          <th className="px-2 py-3">Giá đóng</th>
                          <th className="px-2 py-3 text-right pr-4 lg:pr-6">P&amp;L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-xs lg:text-sm">
                        {pagedHistory.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-16 text-center text-gray-500 italic">
                              Không có dữ liệu giao dịch
                            </td>
                          </tr>
                        ) : pagedHistory.map((t, i) => (
                          <tr key={t.ticket} className="hover:bg-white/5 transition-colors group">
                            <td className="px-4 lg:px-6 py-3 text-gray-600 group-hover:text-gray-400 transition-colors">
                              #{t.ticket}
                            </td>
                            <td className="px-2 py-3 text-gray-400 text-[10px] whitespace-nowrap">{t.time}</td>
                            <td className="px-2 py-3 font-bold text-primary">{t.symbol}</td>
                            <td className="px-2 py-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${t.type === 'BUY' ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`}>
                                {t.type}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-gray-300">{t.volume}</td>
                            <td className="px-2 py-3 text-gray-400">{t.price.toFixed(t.symbol.includes('JPY') ? 3 : 2)}</td>
                            <td className={`px-2 py-3 text-right pr-4 lg:pr-6 font-bold ${t.profit >= 0 ? 'text-success' : 'text-error'}`}>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${t.profit >= 0 ? 'bg-success/10' : 'bg-error/10'}`}>
                                {t.profit >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                {t.profit >= 0 ? '+' : ''}${t.profit.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Pagination footer ── */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 lg:px-6 py-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Hiển thị</span>
                      <select
                        value={historyRows}
                        onChange={e => { setHistoryRows(Number(e.target.value)); setHistoryPage(1); }}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-primary"
                      >
                        {[10, 25, 50, 100].map(n => <option key={n} value={n} className="bg-neutral-900">{n}</option>)}
                      </select>
                      <span>/ {filteredHistory.length} lệnh</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold disabled:opacity-30 hover:bg-white/10 transition-colors"
                      >
                        ‹ Prev
                      </button>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                        const start = Math.max(1, Math.min(historyPage - 2, totalPages - 4));
                        const page = start + idx;
                        return page <= totalPages ? (
                          <button
                            key={page}
                            onClick={() => setHistoryPage(page)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                              historyPage === page
                                ? 'bg-gradient-main text-white shadow-md'
                                : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {page}
                          </button>
                        ) : null;
                      })}

                      <button
                        onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                        disabled={historyPage === totalPages}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold disabled:opacity-30 hover:bg-white/10 transition-colors"
                      >
                        Next ›
                      </button>
                    </div>

                    <span className="text-[10px] text-gray-600">
                      Trang {historyPage} / {totalPages}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" className="flex flex-col gap-6 mx-2">
                <div className="glass-card rounded-3xl p-6 lg:p-8 flex flex-col gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <PlusSquare className="text-secondary" /> Add New Trading Pair
                        </h3>
                        <p className="text-gray-400 text-sm">Deploy the bot to a new market symbol using our quant infrastructure.</p>
                    </div>

                    <form onSubmit={handleAddSymbol} className="flex flex-col sm:flex-row gap-4">
                        <input 
                            type="text" 
                            placeholder="Enter Symbol (e.g. BTCUSD, EURUSD, XAUUSD)"
                            value={newSymbol}
                            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-secondary outline-none transition-all placeholder:text-gray-600 font-bold tracking-widest"
                        />
                        <button 
                            type="submit"
                            className="bg-gradient-main hover:opacity-90 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Activity size={18} /> Initialize Bot
                        </button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                            <div className="p-3 bg-success/10 rounded-xl text-success"><Activity size={20} /></div>
                            <div>
                                <p className="text-xs text-gray-400">Current Active</p>
                                <p className="font-bold uppercase tracking-tighter">{symbols.join(', ')}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                            <div className="p-3 bg-secondary/10 rounded-xl text-secondary"><Cpu size={20} /></div>
                            <div>
                                <p className="text-xs text-gray-400">Trading Environment</p>
                                <p className="font-bold">MetaAPI Cloud / MT5 Linux Hub</p>
                            </div>
                        </div>
                    </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'news' && (
              <motion.div key="news" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 mx-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Newspaper size={20} className="text-secondary" /> Market News Analysis</h2>
                  <button onClick={fetchNews} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all">
                    <RefreshCw size={13} /> Làm mới
                  </button>
                </div>

                {['XAUUSD', 'USDJPY'].map(sym => {
                  const nd = newsData[sym];
                  if (!nd) return (
                    <div key={sym} className="glass-card bg-neutral-900/50 rounded-2xl p-5 text-gray-500 text-sm">
                      ⏳ Chưa có dữ liệu tin tức {sym}... Bot cần chạy ít nhất 1 chu kỳ phân tích.
                    </div>
                  );

                  const scoreColor = nd.sentiment_score > 0.2 ? 'text-green-400' : nd.sentiment_score < -0.2 ? 'text-red-400' : 'text-gray-400';
                  const strengthBadge = ({
                    STRONG_BULLISH: 'bg-green-500/20 text-green-400 border border-green-500/30',
                    BULLISH:        'bg-green-500/10 text-green-300 border border-green-500/20',
                    NEUTRAL:        'bg-gray-500/20 text-gray-400 border border-gray-500/20',
                    BEARISH:        'bg-red-500/10 text-red-300 border border-red-500/20',
                    STRONG_BEARISH: 'bg-red-500/20 text-red-400 border border-red-500/30',
                  })[nd.news_strength] || 'bg-gray-500/20 text-gray-400';

                  const scoreBarPct = Math.abs(nd.sentiment_score || 0) * 100;
                  const scoreBarLeft = nd.sentiment_score < 0 ? `${(1 + nd.sentiment_score) * 50}%` : '50%';

                  const srcLabel = { finnhub: 'FH', alphavantage: 'AV', marketaux: 'MA' };

                  return (
                    <div key={sym} className="glass-card bg-neutral-900/50 rounded-2xl p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">{sym}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${strengthBadge}`}>{nd.news_strength}</span>
                          {nd.contradiction && <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">⚠️ Mâu thuẫn</span>}
                          {nd.blackout_active && <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">🚫 Blackout</span>}
                        </div>
                        <span className="text-xs text-gray-500">
                          📡 {nd.active_sources}/3 nguồn &nbsp;·&nbsp; 🕒 {nd.timestamp ? new Date(nd.timestamp).toLocaleTimeString('vi-VN') : 'N/A'}
                        </span>
                      </div>

                      {/* Score meter */}
                      <div className="flex items-center gap-4">
                        <span className={`text-3xl font-bold tabular-nums ${scoreColor}`}>
                          {(nd.sentiment_score >= 0 ? '+' : '') + (nd.sentiment_score?.toFixed(3) ?? '0.000')}
                        </span>
                        <div className="flex-1">
                          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: '50%' }} />
                            <div
                              className={`absolute top-0 bottom-0 rounded-full ${nd.sentiment_score >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${scoreBarPct / 2}%`, left: scoreBarLeft }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-600 mt-1 px-0.5">
                            <span>-1.0 BEARISH</span><span className="text-gray-500">{nd.direction}</span><span>BULLISH +1.0</span>
                          </div>
                        </div>
                      </div>

                      {/* Source breakdown */}
                      <div className="grid grid-cols-3 gap-2">
                        {['finnhub', 'alphavantage', 'marketaux'].map(src => {
                          const v = nd.source_scores?.[src];
                          const c = v > 0 ? 'text-green-400' : v < 0 ? 'text-red-400' : 'text-gray-500';
                          return (
                            <div key={src} className="bg-white/5 rounded-xl p-3 text-center">
                              <div className="text-gray-500 text-[10px] uppercase font-semibold mb-1">{srcLabel[src]}</div>
                              <div className={`font-bold text-sm tabular-nums ${c}`}>
                                {v != null ? (v >= 0 ? '+' : '') + v.toFixed(3) : 'N/A'}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Headlines */}
                      {nd.top_headlines?.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                            Bài báo liên quan · {nd.news_count} bài phân tích ({nd.bullish_signals}🟢 / {nd.bearish_signals}🔴)
                          </div>
                          {nd.top_headlines.map((h, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed bg-white/3 rounded-xl px-3 py-2">
                              <span className="shrink-0 mt-0.5 text-gray-600">•</span>
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Summary */}
                      {nd.summary && (
                        <div className="text-xs text-gray-500 bg-white/3 rounded-xl px-3 py-2 leading-relaxed">
                          {nd.summary}
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;
