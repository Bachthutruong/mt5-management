import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  LogOut,
  Bell,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Zap,
  Filter,
  Search,
  PlusSquare,
  BarChart2
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
  
  // Filters
  const [selectedLogSymbol, setSelectedLogSymbol] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('');
  const [newSymbol, setNewSymbol] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accRes, posRes, histRes, logRes, symRes] = await Promise.all([
        axios.get(`${API_BASE}/account`),
        axios.get(`${API_BASE}/positions`),
        axios.get(`${API_BASE}/history?days=7`),
        axios.get(`${API_BASE}/logs?symbol=${selectedLogSymbol || ''}&lines=50`),
        axios.get(`${API_BASE}/symbols`)
      ]);
      setAccount(accRes.data);
      setPositions(posRes.data);
      setHistory(histRes.data);
      setLogs(logRes.data);
      setSymbols(symRes.data);
      
      if (!selectedLogSymbol && symRes.data.length > 0) {
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
  }, [selectedLogSymbol]);

  const todayPnl = history.reduce((sum, trade) => sum + trade.profit, 0);
  const winRate = history.length > 0 ? (history.filter(t => t.profit > 0).length / history.length * 100) : 0;
  
  const filteredHistory = history.filter(h => 
    h.symbol.toLowerCase().includes(historyFilter.toLowerCase())
  );

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
              <motion.div key="history" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="glass-card rounded-3xl p-4 lg:p-6 overflow-hidden mx-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="font-bold text-base lg:text-lg">Recent Performance (24h)</h3>
                    <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Filter by Symbol (e.g. XAUUSD)"
                            value={historyFilter}
                            onChange={(e) => setHistoryFilter(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="text-[10px] lg:text-xs font-bold text-gray-500 uppercase border-b border-white/5">
                        <th className="pb-4">Ticket</th><th className="pb-4">Symbol</th><th className="pb-4">Vol</th><th className="pb-4">Entry</th><th className="pb-4">Time</th><th className="pb-4 text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-sm">
                      {filteredHistory.length === 0 ? (
                        <tr><td colSpan="6" className="py-10 text-center text-gray-500 italic">No historical data records found</td></tr>
                      ) : filteredHistory.map((t, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                          <td className="py-4 text-[10px] text-gray-500 group-hover:text-white transition-colors">#{t.ticket}</td>
                          <td className="py-4 font-bold text-primary">{t.symbol}</td>
                          <td className="py-4 text-xs font-bold">{t.volume}</td>
                          <td className="py-4 text-[10px] opacity-70">{t.price.toFixed(2)}</td>
                          <td className="py-4 text-[10px] opacity-50">{t.time}</td>
                          <td className={`py-4 text-right font-bold ${t.profit >= 0 ? 'text-success' : 'text-error'}`}>
                              {t.profit >= 0 ? '+' : ''}${t.profit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;
