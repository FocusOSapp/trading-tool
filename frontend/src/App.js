import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity, BarChart3, TrendingUp, Zap, Layers, Search, RefreshCw, ArrowUpRight, ArrowDownRight,
  Clock, Target, Shield, XCircle, Newspaper, Users, DollarSign, Bell, Settings, Star,
  Plus, Minus, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, X,
  PieChart, TrendingDown, Calendar, Award, BarChart2, Hash, Filter,
  ExternalLink, Info, LayoutGrid, Globe, FileText,
  Eye, EyeOff, Maximize2, Minimize2, Copy, Download, Upload,
  Moon, Sun, Monitor, Palette, Type,
  Radio, Signal, Wifi, WifiOff,
  Cpu, Network, Lock, Unlock, Key,
  AlertCircle, Check, FileText as FileTextIcon,
  BookmarkPlus, Trash2, Edit3, Calculator,
} from 'lucide-react';
import ChartAnalyzer from './components/ChartAnalyzer';

const DATA_BASE = process.env.REACT_APP_DATA_URL || '';

// ==================== THEME SYSTEM ====================
const themes = {
  dark: {
    bg: '#060911', bg2: '#0d1117', bg3: '#161b22', bg4: '#21262d',
    border: '#30363d', borderLight: '#3d444d',
    text: '#f0f6fc', text2: '#c9d1d9', text3: '#8b949e', text4: '#6e7681',
    accent: '#58a6ff', accentDim: '#1f6feb',
    green: '#3fb950', greenDim: '#238636', greenBg: 'rgba(63,185,80,0.1)',
    red: '#f85149', redDim: '#da3633', redBg: 'rgba(248,81,73,0.1)',
    yellow: '#d29922', yellowBg: 'rgba(210,153,34,0.1)',
    purple: '#bc8cff', purpleBg: 'rgba(188,140,255,0.1)',
    cyan: '#39d2c0', cyanBg: 'rgba(57,210,192,0.1)',
    orange: '#f0883e', orangeBg: 'rgba(240,136,62,0.1)',
    gradient: 'linear-gradient(135deg, #58a6ff 0%, #bc8cff 100%)',
    gradientGreen: 'linear-gradient(135deg, #3fb950 0%, #39d2c0 100%)',
    gradientRed: 'linear-gradient(135deg, #f85149 0%, #f0883e 100%)',
    shadow: '0 8px 32px rgba(0,0,0,0.4)',
    shadowSm: '0 2px 8px rgba(0,0,0,0.3)',
    glass: 'rgba(22,27,34,0.8)',
    glassBorder: 'rgba(48,54,61,0.5)',
  },
  midnight: {
    bg: '#0a0e1a', bg2: '#111827', bg3: '#1e293b', bg4: '#334155',
    border: '#475569', borderLight: '#64748b',
    text: '#f8fafc', text2: '#e2e8f0', text3: '#94a3b8', text4: '#64748b',
    accent: '#60a5fa', accentDim: '#3b82f6',
    green: '#34d399', greenDim: '#10b981', greenBg: 'rgba(52,211,153,0.1)',
    red: '#f87171', redDim: '#ef4444', redBg: 'rgba(248,113,113,0.1)',
    yellow: '#fbbf24', yellowBg: 'rgba(251,191,36,0.1)',
    purple: '#a78bfa', purpleBg: 'rgba(167,139,250,0.1)',
    cyan: '#22d3ee', cyanBg: 'rgba(34,211,238,0.1)',
    orange: '#fb923c', orangeBg: 'rgba(251,146,60,0.1)',
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
    gradientGreen: 'linear-gradient(135deg, #34d399 0%, #22d3ee 100%)',
    gradientRed: 'linear-gradient(135deg, #f87171 0%, #fb923c 100%)',
    shadow: '0 8px 32px rgba(0,0,0,0.5)',
    shadowSm: '0 2px 8px rgba(0,0,0,0.3)',
    glass: 'rgba(30,41,59,0.8)',
    glassBorder: 'rgba(71,85,105,0.5)',
  }
};

// ==================== GLOBAL STYLES ====================
const GlobalStyles = () => (
  <style>{`
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--text4); }
    ::selection { background: var(--accent); color: white; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 5px var(--accent); } 50% { box-shadow: 0 0 20px var(--accent); } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    
    .fade-in { animation: fadeIn 0.4s ease-out; }
    .fade-in-up { animation: fadeInUp 0.5s ease-out; }
    .slide-in { animation: slideIn 0.3s ease-out; }
    .scale-in { animation: scaleIn 0.3s ease-out; }
    .pulse { animation: pulse 2s infinite; }
    
    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type="number"] { -moz-appearance: textfield; }
    select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238b949e' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; padding-right: 24px; }
    table { border-spacing: 0; }
    button { font-family: inherit; }
    a { color: inherit; text-decoration: none; }
    
    .glass { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
    .gradient-text { background: var(--gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    
    @media (max-width: 768px) {
      .grid-responsive { grid-template-columns: 1fr !important; }
      .hide-mobile { display: none !important; }
    }
  `}</style>
);

// ==================== DATA HOOK ====================
function useMarketData() {
  const [data, setData] = useState({
    sectors: [], signals: [], overview: {}, news: [], scan: null,
    global: [], commodities: [], crypto: [], currencies: [],
    fiiDii: {}, breadth: {}, shockers: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [scanRes, sectorsRes, signalsRes, overviewRes, newsRes, globalRes, breadthRes, shockersRes, fiiRes] = await Promise.all([
        fetch(`${DATA_BASE}/data/scan.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/sectors.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/signals.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/overview.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/news.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/global.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/breadth.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/shockers.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/fii_dii.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
      ]);
      setData({
        sectors: sectorsRes?.sectors || [],
        signals: signalsRes?.signals || [],
        overview: overviewRes || {},
        news: newsRes?.news || [],
        scan: scanRes,
        global: globalRes?.global_markets || [],
        commodities: globalRes?.commodities || [],
        crypto: globalRes?.crypto || [],
        currencies: globalRes?.currencies || [],
        fiiDii: fiiRes || {},
        breadth: breadthRes || {},
        shockers: shockersRes?.volume_shockers || [],
      });
      setLastFetch(new Date());
    } catch (e) { console.error('Fetch error:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 60000); return () => clearInterval(i); }, [fetchAll]);
  return { ...data, loading, lastFetch, refresh: fetchAll };
}

// ==================== LOCAL STORAGE ====================
function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : defaultValue; }
    catch { return defaultValue; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue];
}

// ==================== MAIN APP ====================
export default function App() {
  const [theme, setTheme] = useLocalStorage('theme', 'dark');
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [watchlist, setWatchlist] = useLocalStorage('watchlist', []);
  const [portfolio, setPortfolio] = useLocalStorage('portfolio', []);
  const [journal, setJournal] = useLocalStorage('journal', []);
  const [showTicker, setShowTicker] = useState(true);

  const market = useMarketData();
  const T = themes[theme] || themes.dark;

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const watchSignal = useCallback((signal) => {
    if (!watchlist.find(w => w.symbol === signal.symbol)) {
      setWatchlist(prev => [...prev, { symbol: signal.symbol, name: signal.stock, addedAt: new Date().toISOString() }]);
      addToast(`Added ${signal.stock} to watchlist`, 'success');
    }
  }, [watchlist, setWatchlist, addToast]);

  const addToPortfolio = useCallback((signal) => {
    if (!portfolio.find(p => p.symbol === signal.symbol)) {
      setPortfolio(prev => [...prev, {
        symbol: signal.symbol, name: signal.stock,
        entryPrice: parseFloat(signal.entry), quantity: 100,
        stopLoss: parseFloat(signal.stop_loss), targets: signal.targets,
        addedAt: new Date().toISOString(), status: 'open',
      }]);
      addToast(`Added ${signal.stock} to portfolio`, 'success');
    }
  }, [portfolio, setPortfolio, addToast]);

  const addJournalEntry = useCallback((signal, action) => {
    setJournal(prev => [...prev, {
      id: Date.now(), symbol: signal.symbol, name: signal.stock,
      action, price: parseFloat(signal.entry),
      confidence: signal.confidence, reason: signal.reason,
      timestamp: new Date().toISOString(),
    }]);
    addToast(`Logged ${action} for ${signal.stock}`, 'info');
  }, [setJournal, addToast]);

  const views = [
    { id: 'dashboard', label: 'Terminal', icon: Activity },
    { id: 'heatmap', label: 'Heatmap', icon: LayoutGrid },
    { id: 'signals', label: 'Signals', icon: Zap },
    { id: 'charts', label: 'Charts', icon: BarChart3 },
    { id: 'analyzer', label: 'Chart AI', icon: Search },
    { id: 'global', label: 'Global', icon: Globe },
    { id: 'commodities', label: 'Commodities', icon: DollarSign },
    { id: 'watchlist', label: 'Watchlist', icon: Star },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'breadth', label: 'Breadth', icon: BarChart2 },
    { id: 'shockers', label: 'Shockers', icon: Zap },
    { id: 'journal', label: 'Journal', icon: FileText },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'calculator', label: 'Risk Calc', icon: Calculator },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: 'hidden' }}>
      <GlobalStyles />
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', marginTop: showTicker ? 32 : 0 }}>
        {/* Ticker Tape */}
        {showTicker && <TickerTape market={market} T={T} onClose={() => setShowTicker(false)} />}

        {/* Top Bar */}
        <TopBar market={market} lastFetch={market.lastFetch} loading={market.loading} T={T} onRefresh={market.refresh} />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <Sidebar views={views} activeView={activeView} setActiveView={setActiveView}
            collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
            theme={theme} setTheme={setTheme} setShowSettings={setShowSettings} T={T} />

          {/* Main Content */}
          <main style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {activeView === 'dashboard' && <DashboardView market={market} T={T} onSignalClick={setSelectedSignal} onWatch={watchSignal} onPortfolio={addToPortfolio} />}
            {activeView === 'heatmap' && <HeatmapView sectors={market.sectors} signals={market.signals} T={T} />}
            {activeView === 'signals' && <SignalsView signals={market.signals} T={T} onSignalClick={setSelectedSignal} onWatch={watchSignal} onPortfolio={addToPortfolio} onJournal={addJournalEntry} />}
            {activeView === 'charts' && <ChartsView signals={market.signals} T={T} />}
            {activeView === 'analyzer' && <ChartAnalyzer T={T} signals={market.signals} />}
            {activeView === 'global' && <GlobalView global={market.global} currencies={market.currencies} T={T} />}
            {activeView === 'commodities' && <CommoditiesView commodities={market.commodities} crypto={market.crypto} T={T} />}
            {activeView === 'watchlist' && <WatchlistView watchlist={watchlist} setWatchlist={setWatchlist} signals={market.signals} T={T} onSignalClick={setSelectedSignal} onPortfolio={addToPortfolio} />}
            {activeView === 'portfolio' && <PortfolioView portfolio={portfolio} setPortfolio={setPortfolio} signals={market.signals} T={T} />}
            {activeView === 'breadth' && <BreadthView breadth={market.breadth} fiiDii={market.fiiDii} sectors={market.sectors} T={T} />}
            {activeView === 'shockers' && <ShockersView shockers={market.shockers} T={T} onSignalClick={setSelectedSignal} />}
            {activeView === 'journal' && <JournalView journal={journal} setJournal={setJournal} T={T} />}
            {activeView === 'news' && <NewsView news={market.news} T={T} />}
            {activeView === 'calculator' && <RiskCalculatorView T={T} />}
          </main>
        </div>
      </div>

      {selectedSignal && <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} T={T} onWatch={watchSignal} onPortfolio={addToPortfolio} onJournal={addJournalEntry} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} theme={theme} setTheme={setTheme} T={T} />}
      <ToastContainer toasts={toasts} T={T} />
    </div>
  );
}

// ==================== TICKER TAPE ====================
function TickerTape({ market, T, onClose }) {
  const { overview, sectors, global, commodities, crypto } = market;
  const items = [
    { label: 'NIFTY', value: overview.nifty, change: overview.nifty_change },
    { label: 'SENSEX', value: overview.sensex, change: overview.sensex_change },
    { label: 'VIX', value: overview.vix, change: overview.vix_change },
    ...sectors.slice(0, 4).map(s => ({ label: s.name.replace('NIFTY ', ''), value: s.change_pct, change: s.change_pct })),
    ...global.slice(0, 3).map(g => ({ label: g.name, value: g.price, change: g.change })),
    ...commodities.slice(0, 2).map(c => ({ label: c.name, value: c.price, change: c.change })),
    ...crypto.slice(0, 2).map(c => ({ label: c.name, value: c.price, change: c.change })),
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 32, background: T.bg2, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', zIndex: 100, overflow: 'hidden' }}>
      <div style={{ display: 'flex', animation: 'ticker 40s linear infinite', whiteSpace: 'nowrap' }}>
        {[...items, ...items, ...items].map((item, i) => (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 20px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
            <span style={{ color: T.text4, fontWeight: 600, letterSpacing: '0.05em' }}>{item.label}</span>
            <span style={{ color: T.text, fontWeight: 500 }}>{typeof item.value === 'number' ? (item.value > 1000 ? item.value.toLocaleString() : item.value.toFixed(2)) : item.value}</span>
            <span style={{ color: (item.change || 0) >= 0 ? T.green : T.red, fontWeight: 700, fontSize: 10 }}>
              {(item.change || 0) >= 0 ? '▲' : '▼'} {Math.abs(item.change || 0).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ position: 'absolute', right: 8, top: 6, background: 'none', border: 'none', color: T.text4, cursor: 'pointer', padding: 4, borderRadius: 4 }}
        onMouseEnter={e => e.currentTarget.style.color = T.text} onMouseLeave={e => e.currentTarget.style.color = T.text4}>
        <X size={14} />
      </button>
    </div>
  );
}

// ==================== TOP BAR ====================
function TopBar({ market, lastFetch, loading, T, onRefresh }) {
  const { overview } = market;

  return (
    <header style={{
      height: 56, background: T.bg2, borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: T.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={16} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em' }}>Trading Pro</div>
            <div style={{ fontSize: 9, color: T.text4, fontWeight: 500, letterSpacing: '0.1em' }}>AI INTELLIGENCE</div>
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: T.border }} />

        {overview.nifty && (
          <div style={{ display: 'flex', gap: 16 }}>
            <MarketPill label="NIFTY" value={overview.nifty} change={overview.nifty_change} T={T} />
            <MarketPill label="SENSEX" value={overview.sensex} change={overview.sensex_change} T={T} />
            <MarketPill label="VIX" value={overview.vix} change={overview.vix_change} T={T} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {lastFetch && (
          <span style={{ fontSize: 11, color: T.text4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> {lastFetch.toLocaleTimeString()}
          </span>
        )}
        {market.scan && (
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: T.text4 }}>
            <span>{market.scan.sectors_analyzed} sectors</span>
            <span>{market.scan.stocks_scanned} stocks</span>
            <span style={{ color: market.scan.signals_generated > 0 ? T.green : T.text4 }}>{market.scan.signals_generated} signals</span>
          </div>
        )}
        <button onClick={onRefresh} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8, border: `1px solid ${T.border}`,
          background: 'transparent', color: T.text2, cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 11, fontWeight: 600, transition: 'all 0.2s',
        }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = T.bg4; e.currentTarget.style.borderColor = T.borderLight; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = T.border; }}>
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>
    </header>
  );
}

function MarketPill({ label, value, change, T }) {
  const isPositive = (change || 0) >= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 6, background: T.bg3, border: `1px solid ${T.border}` }}>
      <span style={{ color: T.text4, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12 }}>{value?.toLocaleString()}</span>
      <span style={{ color: isPositive ? T.green : T.red, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
        {isPositive ? '+' : ''}{change?.toFixed(2)}%
      </span>
    </div>
  );
}

// ==================== SIDEBAR ====================
function Sidebar({ views, activeView, setActiveView, collapsed, setCollapsed, theme, setTheme, setShowSettings, T }) {
  return (
    <aside style={{
      width: collapsed ? 60 : 220, background: T.bg2, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 50, flexShrink: 0,
    }}>
      <div style={{ padding: collapsed ? '16px 8px' : '16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: T.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>Trading Pro</div>
              <div style={{ fontSize: 9, color: T.text4, fontWeight: 500, letterSpacing: '0.1em' }}>AI INTELLIGENCE</div>
            </div>
          </div>
        )}
        {collapsed && <TrendingUp size={20} color={T.accent} />}
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: T.text4, cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = T.text} onMouseLeave={e => e.currentTarget.style.color = T.text4}>
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      <nav style={{ flex: 1, padding: '8px 6px', overflow: 'auto' }}>
        {views.map(view => (
          <button key={view.id} onClick={() => setActiveView(view.id)} title={collapsed ? view.label : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              marginBottom: 2, border: 'none', borderRadius: 8, cursor: 'pointer',
              background: activeView === view.id ? `${T.accent}12` : 'transparent',
              color: activeView === view.id ? T.accent : T.text3,
              fontWeight: activeView === view.id ? 600 : 500,
              fontSize: 12, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (activeView !== view.id) e.currentTarget.style.background = T.bg3; }}
            onMouseLeave={e => { if (activeView !== view.id) e.currentTarget.style.background = 'transparent'; }}>
            <view.icon size={16} />
            {!collapsed && <span>{view.label}</span>}
          </button>
        ))}
      </nav>

      <div style={{ padding: '8px 6px', borderTop: `1px solid ${T.border}` }}>
        <button onClick={() => setShowSettings(true)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: collapsed ? '10px 0' : '10px 12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          border: 'none', borderRadius: 8, cursor: 'pointer',
          background: 'transparent', color: T.text4, fontSize: 12, transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = T.bg3; e.currentTarget.style.color = T.text2; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text4; }}>
          <Settings size={16} />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}

// ==================== DASHBOARD VIEW ====================
function DashboardView({ market, T, onSignalClick, onWatch, onPortfolio }) {
  const { sectors, signals, overview } = market;
  const highConf = signals.filter(s => s.confidence >= 8).length;
  const avgRR = signals.length ? (signals.reduce((a, s) => a + parseFloat(s.risk_reward.split(':')[1]), 0) / signals.length).toFixed(1) : '-';

  return (
    <div className="fade-in">
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard icon={Zap} label="Signals" value={signals.length} color={T.accent} T={T} />
        <StatCard icon={Layers} label="Sectors" value={sectors.length} color={T.purple} T={T} />
        <StatCard icon={TrendingUp} label="NIFTY" value={overview.nifty ? overview.nifty.toLocaleString() : '-'} color={overview.nifty_change >= 0 ? T.green : T.red} T={T} sub={`${overview.nifty_change >= 0 ? '+' : ''}${overview.nifty_change || 0}%`} />
        <StatCard icon={Shield} label="VIX" value={overview.vix || '-'} color={T.yellow} T={T} sub={`${overview.vix_change >= 0 ? '+' : ''}${overview.vix_change || 0}%`} />
        <StatCard icon={Award} label="High Conf" value={highConf} color={T.green} T={T} sub="≥ 8/10" />
        <StatCard icon={Target} label="Avg R:R" value={avgRR} color={T.cyan} T={T} sub="risk:reward" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Top Sectors */}
        <Panel title="Top Sectors" icon={Layers} color={T.purple} T={T}>
          {sectors.slice(0, 6).map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 5 ? `1px solid ${T.border}20` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: i === 0 ? T.purple : i === 1 ? T.accent : T.bg4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white' }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name.replace('NIFTY ', '')}</div>
                  <div style={{ fontSize: 10, color: T.text4 }}>Score: {s.score}/10</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.change_pct >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>
                {s.change_pct >= 0 ? '+' : ''}{s.change_pct}%
              </div>
            </div>
          ))}
          {sectors.length === 0 && <EmptyState icon={Layers} text="No sector data. Refresh to scan." T={T} />}
        </Panel>

        {/* Top Signals */}
        <Panel title="Top Signals" icon={Zap} color={T.yellow} T={T}>
          {signals.slice(0, 6).map((sig, i) => (
            <div key={i} onClick={() => onSignalClick(sig)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 5 ? `1px solid ${T.border}20` : 'none', cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: sig.confidence >= 8 ? T.greenBg : T.yellowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: sig.confidence >= 8 ? T.green : T.yellow, fontFamily: "'JetBrains Mono', monospace" }}>{sig.confidence}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{sig.stock}</div>
                  <div style={{ fontSize: 10, color: T.text4 }}>{sig.risk_reward} R:R</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.green }}>T: {sig.targets?.[0]}</div>
                <div style={{ fontSize: 10, color: T.text4 }}>SL: {sig.stop_loss}</div>
              </div>
            </div>
          ))}
          {signals.length === 0 && <EmptyState icon={Zap} text="No signals yet." T={T} />}
        </Panel>

        {/* Market Pulse */}
        <Panel title="Market Pulse" icon={Activity} color={T.cyan} T={T}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, background: T.bg4, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.text4, marginBottom: 4 }}>Bullish Signals</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>{signals.filter(s => s.signal === 'BUY').length}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: T.bg4, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.text4, marginBottom: 4 }}>Bearish Signals</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.red }}>{signals.filter(s => s.signal === 'SELL').length}</div>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: T.text4, marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em' }}>SECTOR STRENGTH</div>
            {sectors.slice(0, 5).map((s, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: T.text2 }}>{s.name.replace('NIFTY ', '')}</span>
                  <span style={{ fontSize: 11, color: s.change_pct >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{s.score}/10</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: T.bg4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${s.score * 10}%`, background: s.score >= 7 ? T.green : s.score >= 5 ? T.yellow : T.red, transition: 'width 0.5s ease-out' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: 10, borderRadius: 8, background: T.bg4 }}>
            <div style={{ fontSize: 10, color: T.text4, marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>MARKET REGIME</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: overview.nifty_change >= 0 ? T.green : T.red, boxShadow: `0 0 8px ${overview.nifty_change >= 0 ? T.green : T.red}40` }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{overview.nifty_change >= 0 ? 'Bullish' : 'Bearish'}</span>
              <span style={{ fontSize: 11, color: T.text4, marginLeft: 'auto' }}>VIX: {overview.vix || '-'}</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Signals Table */}
      {signals.length > 0 && (
        <div style={{ marginTop: 20, background: T.bg3, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600 }}>All Signals</h3>
            <span style={{ fontSize: 11, color: T.text4 }}>{signals.length} signals</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Signal', 'Stock', 'Conf', 'Entry', 'SL', 'T1', 'T2', 'R:R', 'Scores', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.text4, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signals.map((sig, i) => (
                  <tr key={i} onClick={() => onSignalClick(sig)} style={{ borderBottom: `1px solid ${T.border}15`, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg4} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 12px' }}><SignalBadge signal={sig.signal} T={T} /></td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 13 }}>{sig.stock}</td>
                    <td style={{ padding: '10px 12px' }}><ConfidenceBar value={sig.confidence} T={T} /></td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{sig.entry}</td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.red }}>{sig.stop_loss}</td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.green }}>{sig.targets?.[0]}</td>
                    <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.green }}>{sig.targets?.[1]}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: T.green, fontFamily: "'JetBrains Mono', monospace" }}>{sig.risk_reward}</td>
                    <td style={{ padding: '10px 12px', fontSize: 10, color: T.text4 }}>S:{sig.structure_score} V:{sig.volume_score} I:{sig.indicator_score}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={e => { e.stopPropagation(); onWatch(sig); }} style={{ background: 'none', border: 'none', color: T.text4, cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = T.yellow} onMouseLeave={e => e.currentTarget.style.color = T.text4} title="Watchlist"><Star size={14} /></button>
                        <button onClick={e => { e.stopPropagation(); onPortfolio(sig); }} style={{ background: 'none', border: 'none', color: T.text4, cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = T.green} onMouseLeave={e => e.currentTarget.style.color = T.text4} title="Add Trade"><Plus size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== REUSABLE COMPONENTS ====================
function Panel({ title, icon: Icon, color, T, children }) {
  return (
    <div style={{ background: T.bg3, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={14} color={color} />{title}
        </h3>
      </div>
      <div style={{ padding: '0 16px 16px' }}>{children}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, T, sub }) {
  return (
    <div style={{ background: T.bg3, borderRadius: 10, border: `1px solid ${T.border}`, padding: '14px 16px', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: T.text4, fontWeight: 500, letterSpacing: '0.05em' }}>{label}</span>
        <Icon size={14} color={color} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: color, marginTop: 4, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

function SignalBadge({ signal, T }) {
  const isBuy = signal === 'BUY';
  return (
    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
      background: isBuy ? T.greenBg : T.redBg,
      color: isBuy ? T.green : T.red,
      display: 'inline-flex', alignItems: 'center', gap: 4,
      border: `1px solid ${isBuy ? T.greenDim : T.redDim}30`,
    }}>
      {isBuy ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}{signal}
    </span>
  );
}

function ConfidenceBar({ value, T }) {
  const color = value >= 8 ? T.green : value >= 6 ? T.yellow : T.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: T.bg4, overflow: 'hidden' }}>
        <div style={{ width: `${value * 10}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, text, T }) {
  return (
    <div style={{ textAlign: 'center', padding: 32, color: T.text4 }}>
      <Icon size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
      <p style={{ fontSize: 12 }}>{text}</p>
    </div>
  );
}

// ==================== PLACEHOLDER VIEWS (keeping existing ones) ====================
function HeatmapView({ sectors, signals, T }) {
  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Sector Heatmap</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
        {sectors.map((s, i) => {
          const isPositive = s.change_pct >= 0;
          return (
            <div key={i} style={{ padding: '18px 14px', borderRadius: 10, background: isPositive ? `${T.green}08` : `${T.red}08`, border: `1px solid ${isPositive ? T.green : T.red}20`, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: T.text2 }}>{s.name.replace('NIFTY ', '')}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: isPositive ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>
                {s.change_pct >= 0 ? '+' : ''}{s.change_pct}%
              </div>
              <div style={{ fontSize: 10, color: T.text4, marginTop: 4 }}>Score: {s.score}/10</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SignalsView({ signals, T, onSignalClick, onWatch, onPortfolio, onJournal }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? signals : signals.filter(s => s.signal === filter);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'BUY', 'SELL'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 8, border: `1px solid ${filter === f ? T.accent : T.border}`,
            background: filter === f ? `${T.accent}12` : 'transparent',
            color: filter === f ? T.accent : T.text3, cursor: 'pointer', fontSize: 11, fontWeight: 600,
          }}>{f === 'all' ? 'All Signals' : f}</button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptyState icon={Zap} text="No signals match filter." T={T} /> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {filtered.map((sig, i) => (
            <div key={i} onClick={() => onSignalClick(sig)} style={{
              background: T.bg3, borderRadius: 12, border: sig.confidence >= 8 ? `1px solid ${T.green}30` : `1px solid ${T.border}`,
              padding: 16, cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.shadow; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SignalBadge signal={sig.signal} T={T} />
                  <span style={{ fontSize: 10, color: T.text4 }}>{sig.sector}</span>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: sig.confidence >= 8 ? T.greenBg : T.yellowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: sig.confidence >= 8 ? T.green : T.yellow, fontFamily: "'JetBrains Mono', monospace" }}>{sig.confidence}</div>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{sig.stock}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[{ l: 'Entry', v: sig.entry }, { l: 'SL', v: sig.stop_loss, c: T.red }, { l: 'T1', v: sig.targets?.[0], c: T.green }].map((b, j) => (
                  <div key={j} style={{ padding: '8px 10px', borderRadius: 8, background: T.bg4 }}>
                    <div style={{ fontSize: 9, color: T.text4, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{b.l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: b.c || T.text, fontFamily: "'JetBrains Mono', monospace" }}>{b.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: T.bg4, marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: T.text4, display: 'flex', alignItems: 'center', gap: 4 }}><Target size={12} /> R:R</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.green, fontFamily: "'JetBrains Mono', monospace" }}>{sig.risk_reward}</span>
              </div>
              <p style={{ fontSize: 11, color: T.text3, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sig.reason}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                <button onClick={e => { e.stopPropagation(); onWatch(sig); }} style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.yellow; e.currentTarget.style.color = T.yellow; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; }}><Star size={12} /> Watch</button>
                <button onClick={e => { e.stopPropagation(); onPortfolio(sig); }} style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.green; e.currentTarget.style.color = T.green; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text3; }}><Plus size={12} /> Trade</button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

function ChartsView({ signals, T }) {
  const [symbol, setSymbol] = useState('TATASTEEL');
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true, symbol: `NSE:${symbol}`, interval: 'D',
      timezone: 'Asia/Kolkata', theme: 'dark', style: '1', locale: 'en',
      toolbar_bg: '#161b22', enable_publishing: false, hide_top_toolbar: false,
      hide_legend: false, save_image: false,
      studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies', 'BB@tv-basicstudies'],
      backgroundColor: '#060911', gridColor: '#161b22',
      withdateranges: true, hide_side_toolbar: false, allow_symbol_change: true,
      details: true, hotlist: true, calendar: false,
      support_host: 'https://www.tradingview.com',
    });
    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['TATASTEEL', 'SBIN', 'BSE', 'VEDL', 'EICHERMOT', 'RELIANCE', 'INFY', 'TCS', 'HDFCBANK', 'NIFTY'].map(s => (
          <button key={s} onClick={() => setSymbol(s)} style={{
            padding: '6px 14px', borderRadius: 8, border: `1px solid ${symbol === s ? T.accent : T.border}`,
            background: symbol === s ? T.accent : 'transparent',
            color: symbol === s ? 'white' : T.text3, cursor: 'pointer', fontSize: 11, fontWeight: 600,
            transition: 'all 0.15s',
          }}>{s}</button>
        ))}
      </div>
      <div style={{ height: 540, borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      </div>
    </div>
  );
}

function WatchlistView({ watchlist, setWatchlist, signals, T, onSignalClick, onPortfolio }) {
  const [newSymbol, setNewSymbol] = useState('');
  const addSymbol = () => {
    if (!newSymbol.trim()) return;
    const sym = newSymbol.trim().toUpperCase();
    if (!watchlist.find(w => w.symbol === sym)) {
      setWatchlist(prev => [...prev, { symbol: sym, name: sym, addedAt: new Date().toISOString() }]);
    }
    setNewSymbol('');
  };
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input type="text" value={newSymbol} onChange={e => setNewSymbol(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSymbol()}
          placeholder="Add symbol (e.g., RELIANCE)" style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`,
            background: T.bg3, color: T.text, fontSize: 12, outline: 'none',
            fontFamily: "'JetBrains Mono', monospace",
          }} />
        <button onClick={addSymbol} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: T.accent, color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4,
        }}><Plus size={14} /> Add</button>
      </div>
      {watchlist.length === 0 ? <EmptyState icon={Star} text="Watchlist is empty." T={T} /> :
        <div style={{ display: 'grid', gap: 8 }}>
          {watchlist.map((w, i) => {
            const signal = signals.find(s => s.symbol === w.symbol || s.stock === w.symbol);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Star size={16} color={T.yellow} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{w.name || w.symbol}</div>
                    {signal && <div style={{ fontSize: 10, color: T.text4 }}>Conf: {signal.confidence} | {signal.risk_reward} R:R</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {signal && <button onClick={() => onPortfolio(signal)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 10 }}><Plus size={10} /> Trade</button>}
                  <button onClick={() => setWatchlist(prev => prev.filter(x => x.symbol !== w.symbol))} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'transparent', color: T.text4, cursor: 'pointer' }}><Trash2 size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

function PortfolioView({ portfolio, setPortfolio, signals, T }) {
  const openPositions = portfolio.filter(p => p.status === 'open');
  const closedPositions = portfolio.filter(p => p.status === 'closed');
  const totalPnL = openPositions.reduce((sum, p) => {
    const current = signals.find(s => s.symbol === p.symbol)?.current_price || p.entryPrice;
    return sum + (current - p.entryPrice) * p.quantity;
  }, 0);

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard icon={PieChart} label="Open Positions" value={openPositions.length} color={T.accent} T={T} />
        <StatCard icon={TrendingUp} label="Unrealized P&L" value={`₹${totalPnL.toFixed(0)}`} color={totalPnL >= 0 ? T.green : T.red} T={T} />
        <StatCard icon={CheckCircle} label="Closed Trades" value={closedPositions.length} color={T.green} T={T} />
        <StatCard icon={Award} label="Win Rate" value={closedPositions.length ? `${Math.round(closedPositions.filter(p => (p.exitPrice || 0) > p.entryPrice).length / closedPositions.length * 100)}%` : '-'} color={T.purple} T={T} />
      </div>
      <div style={{ background: T.bg3, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}><h3 style={{ fontSize: 13, fontWeight: 600 }}>Open Positions</h3></div>
        {openPositions.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: T.text4, fontSize: 12 }}>No open positions</div> :
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Symbol', 'Entry', 'Qty', 'SL', 'Targets', 'P&L', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.text4, fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {openPositions.map((p, i) => {
                  const current = signals.find(s => s.symbol === p.symbol)?.current_price || p.entryPrice;
                  const pnl = (current - p.entryPrice) * p.quantity;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}15` }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.name || p.symbol}</td>
                      <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace" }}>{p.entryPrice}</td>
                      <td style={{ padding: '10px 12px' }}>{p.quantity}</td>
                      <td style={{ padding: '10px 12px', color: T.red, fontFamily: "'JetBrains Mono', monospace" }}>{p.stopLoss}</td>
                      <td style={{ padding: '10px 12px', color: T.green, fontFamily: "'JetBrains Mono', monospace" }}>{p.targets?.join(', ')}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: pnl >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>₹{pnl.toFixed(0)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => setPortfolio(prev => prev.map((x, j) => j === i ? { ...x, status: 'closed', closedAt: new Date().toISOString() } : x))} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.red}`, background: 'transparent', color: T.red, cursor: 'pointer', fontSize: 10 }}>Close</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
}

function JournalView({ journal, setJournal, T }) {
  return (
    <div className="fade-in">
      {journal.length === 0 ? <EmptyState icon={FileText} text="No journal entries. Log trades from signals." T={T} /> :
        <div style={{ display: 'grid', gap: 8 }}>
          {journal.map((entry, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SignalBadge signal={entry.action} T={T} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{entry.name}</span>
                  <span style={{ fontSize: 10, color: T.text4 }}>Conf: {entry.confidence}</span>
                </div>
                <span style={{ fontSize: 10, color: T.text4 }}>{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
              <p style={{ fontSize: 11, color: T.text3, lineHeight: 1.5 }}>{entry.reason}</p>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

function NewsView({ news, T }) {
  const [filter, setFilter] = useState('all');
  const categories = ['all', ...new Set(news.map(n => n.category).filter(Boolean))];
  const filtered = filter === 'all' ? news : news.filter(n => n.category === filter);
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '6px 14px', borderRadius: 8, border: `1px solid ${filter === c ? T.accent : T.border}`,
            background: filter === c ? `${T.accent}12` : 'transparent',
            color: filter === c ? T.accent : T.text3, cursor: 'pointer', fontSize: 11, fontWeight: 600,
            textTransform: 'capitalize',
          }}>{c}</button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptyState icon={Newspaper} text="No news available." T={T} /> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {filtered.map((n, i) => (
            <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{
              background: T.bg3, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden',
              textDecoration: 'none', color: 'inherit', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.shadow; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              {n.image && (
                <div style={{ height: 140, overflow: 'hidden' }}>
                  <img src={n.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                </div>
              )}
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600,
                    background: n.sentiment === 'positive' ? T.greenBg : n.sentiment === 'negative' ? T.redBg : `${T.text4}15`,
                    color: n.sentiment === 'positive' ? T.green : n.sentiment === 'negative' ? T.red : T.text4,
                  }}>{n.sentiment}</span>
                  <span style={{ fontSize: 9, color: T.text4 }}>{n.source}</span>
                  {n.category && <span style={{ fontSize: 9, color: T.text4, padding: '1px 4px', borderRadius: 2, background: T.bg4 }}>{n.category}</span>}
                </div>
                <h4 style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>{n.title}</h4>
                {n.description && <p style={{ fontSize: 11, color: T.text3, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 6 }}>{n.description}</p>}
                <div style={{ fontSize: 9, color: T.text4 }}>{n.published_at ? new Date(n.published_at).toLocaleString() : ''}</div>
              </div>
            </a>
          ))}
        </div>
      }
    </div>
  );
}

function GlobalView({ global, currencies, T }) {
  const regions = {
    'US Markets': global.filter(g => ['S&P 500', 'NASDAQ', 'DOW'].includes(g.name)),
    'Europe': global.filter(g => ['FTSE', 'DAX', 'CAC'].includes(g.name)),
    'Asia Pacific': global.filter(g => ['NIKKEI', 'HANG SENG', 'SHANGHAI', 'KOSPI', 'STI', 'ASX 200'].includes(g.name)),
  };
  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Global Markets</h2>
      {Object.entries(regions).map(([region, markets]) => (
        <div key={region} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: T.text4, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{region}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {markets.map((m, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{m.name}</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{m.price?.toLocaleString()}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: m.change >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>
                  {m.change >= 0 ? '+' : ''}{m.change}%
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {currencies.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: T.text4, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Currency Pairs</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {currencies.map((c, i) => (
              <div key={i} style={{ padding: 14, borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{c.price}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: c.change >= 0 ? T.green : T.red }}>{c.change >= 0 ? '+' : ''}{c.change}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CommoditiesView({ commodities, crypto, T }) {
  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Commodities & Crypto</h2>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: T.text4, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Commodities</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {commodities.map((c, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{c.price > 100 ? c.price.toLocaleString() : c.price}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.change >= 0 ? T.green : T.red }}>{c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: T.text4, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cryptocurrency</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {crypto.map((c, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>${c.price > 100 ? c.price.toLocaleString() : c.price}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.change >= 0 ? T.green : T.red }}>{c.change >= 0 ? '▲' : '▼'} {Math.abs(c.change).toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BreadthView({ breadth, fiiDii, sectors, T }) {
  const total = breadth.advance + breadth.decline + breadth.unchanged;
  const advPct = total > 0 ? ((breadth.advance / total) * 100).toFixed(1) : 0;
  const decPct = total > 0 ? ((breadth.decline / total) * 100).toFixed(1) : 0;
  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Market Breadth & Institutional Flows</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Panel title="Advance / Decline" icon={BarChart2} color={T.cyan} T={T}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: T.green, fontWeight: 700 }}>▲ {breadth.advance || 0}</span>
              <span style={{ fontSize: 12, color: T.text4 }}>Total: {total || '-'}</span>
              <span style={{ fontSize: 14, color: T.red, fontWeight: 700 }}>▼ {breadth.decline || 0}</span>
            </div>
            <div style={{ height: 28, borderRadius: 14, overflow: 'hidden', display: 'flex', background: T.bg4 }}>
              <div style={{ width: `${advPct}%`, background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>{advPct}%</div>
              <div style={{ width: `${decPct}%`, background: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>{decPct}%</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: 12, borderRadius: 8, background: T.bg4, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.text4, marginBottom: 4 }}>52W Highs</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.green }}>{breadth.new_highs || 0}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: T.bg4, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.text4, marginBottom: 4 }}>52W Lows</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.red }}>{breadth.new_lows || 0}</div>
            </div>
          </div>
        </Panel>
        <Panel title="FII / DII Flows" icon={Users} color={T.purple} T={T}>
          {Object.keys(fiiDii).length === 0 ? <EmptyState icon={Users} text="FII/DII data unavailable" T={T} /> :
            <div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: T.text4, marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>FOREIGN INSTITUTIONAL INVESTORS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[{ l: 'Buy', v: fiiDii.fii_buy, c: T.green }, { l: 'Sell', v: fiiDii.fii_sell, c: T.red }, { l: 'Net', v: fiiDii.fii_net, c: fiiDii.fii_net >= 0 ? T.green : T.red }].map((b, i) => (
                    <div key={i} style={{ padding: 10, borderRadius: 8, background: T.bg4, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: T.text4, marginBottom: 4 }}>{b.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: b.c }}>₹{b.v}Cr</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.text4, marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>DOMESTIC INSTITUTIONAL INVESTORS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[{ l: 'Buy', v: fiiDii.dii_buy, c: T.green }, { l: 'Sell', v: fiiDii.dii_sell, c: T.red }, { l: 'Net', v: fiiDii.dii_net, c: fiiDii.dii_net >= 0 ? T.green : T.red }].map((b, i) => (
                    <div key={i} style={{ padding: 10, borderRadius: 8, background: T.bg4, textAlign: 'center' }}>
                      <div style={{ fontSize: 9, color: T.text4, marginBottom: 4 }}>{b.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: b.c }}>₹{b.v}Cr</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        </Panel>
      </div>
      <Panel title="Sector Rotation" icon={TrendingUp} color={T.accent} T={T}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {sectors.map((s, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 10, background: s.change_pct >= 0 ? T.greenBg : T.redBg, border: `1px solid ${s.change_pct >= 0 ? T.green : T.red}20`, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 4 }}>{s.name.replace('NIFTY ', '')}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.change_pct >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>
                {s.change_pct >= 0 ? '+' : ''}{s.change_pct}%
              </div>
              <div style={{ fontSize: 9, color: T.text4, marginTop: 4 }}>Score: {s.score}/10</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ShockersView({ shockers, T, onSignalClick }) {
  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Volume Shockers</h2>
      <p style={{ fontSize: 11, color: T.text4, marginBottom: 16 }}>Stocks with unusual volume expansion (&gt;2x average)</p>
      {shockers.length === 0 ? <EmptyState icon={Zap} text="No volume shockers detected." T={T} /> :
        <div style={{ display: 'grid', gap: 8 }}>
          {shockers.map((s, i) => (
            <div key={i} onClick={() => onSignalClick(s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = T.bg4; }} onMouseLeave={e => { e.currentTarget.style.background = T.bg3; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.orangeBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={20} color={T.orange} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: T.text4 }}>Vol: {s.volume?.toLocaleString()} (Avg: {s.avg_volume?.toLocaleString()})</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>₹{s.price}</div>
                  <div style={{ fontSize: 11, color: s.change_pct >= 0 ? T.green : T.red, fontWeight: 600 }}>{s.change_pct >= 0 ? '+' : ''}{s.change_pct}%</div>
                </div>
                <div style={{ padding: '6px 12px', borderRadius: 8, background: T.orangeBg, border: `1px solid ${T.orange}30` }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.orange, fontFamily: "'JetBrains Mono', monospace" }}>{s.volume_ratio}x</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

function RiskCalculatorView({ T }) {
  const [capital, setCapital] = useState(100000);
  const [riskPerTrade, setRiskPerTrade] = useState(1);
  const [entry, setEntry] = useState(100);
  const [stopLoss, setStopLoss] = useState(95);
  const [target, setTarget] = useState(115);

  const riskAmount = capital * (riskPerTrade / 100);
  const riskPerShare = entry - stopLoss;
  const quantity = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
  const totalInvestment = quantity * entry;
  const potentialProfit = quantity * (target - entry);
  const potentialLoss = quantity * (entry - stopLoss);
  const rr = riskPerShare > 0 ? ((target - entry) / riskPerShare).toFixed(1) : '-';

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Position Size Calculator</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: T.bg3, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Account Capital (₹)', value: capital, setter: setCapital },
              { label: 'Risk Per Trade (%)', value: riskPerTrade, setter: setRiskPerTrade },
              { label: 'Entry Price (₹)', value: entry, setter: setEntry },
              { label: 'Stop Loss (₹)', value: stopLoss, setter: setStopLoss },
              { label: 'Target Price (₹)', value: target, setter: setTarget },
            ].map((field, i) => (
              <div key={i}>
                <label style={{ fontSize: 11, color: T.text4, marginBottom: 4, display: 'block', fontWeight: 600 }}>{field.label}</label>
                <input type="number" value={field.value} onChange={e => field.setter(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 13, outline: 'none', fontFamily: "'JetBrains Mono', monospace" }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: T.bg3, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Results</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { label: 'Risk Amount', value: `₹${riskAmount.toFixed(0)}`, color: T.red },
              { label: 'Risk Per Share', value: `₹${riskPerShare.toFixed(2)}`, color: T.red },
              { label: 'Position Size', value: `${quantity} shares`, color: T.accent },
              { label: 'Total Investment', value: `₹${totalInvestment.toFixed(0)}`, color: T.text },
              { label: 'Potential Profit', value: `₹${potentialProfit.toFixed(0)}`, color: T.green },
              { label: 'Potential Loss', value: `₹${potentialLoss.toFixed(0)}`, color: T.red },
              { label: 'Risk:Reward', value: `1:${rr}`, color: parseFloat(rr) >= 2 ? T.green : T.yellow },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: T.bg4 }}>
                <span style={{ fontSize: 12, color: T.text4 }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: r.color, fontFamily: "'JetBrains Mono', monospace" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== MODALS ====================
function SignalModal({ signal, onClose, T, onWatch, onPortfolio, onJournal }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="scale-in" style={{ background: T.bg3, borderRadius: 16, border: `1px solid ${T.border}`, width: 520, maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: signal.confidence >= 8 ? T.greenBg : T.yellowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: signal.confidence >= 8 ? T.green : T.yellow, fontFamily: "'JetBrains Mono', monospace" }}>{signal.confidence}</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{signal.stock}</h2>
              <span style={{ fontSize: 11, color: T.text4 }}>{signal.sector} • {signal.symbol}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text4, padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = T.text} onMouseLeave={e => e.currentTarget.style.color = T.text4}><XCircle size={20} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Signal', value: signal.signal, color: signal.signal === 'BUY' ? T.green : T.red },
              { label: 'Risk:Reward', value: signal.risk_reward, color: T.green },
              { label: 'Entry', value: signal.entry },
              { label: 'Stop Loss', value: signal.stop_loss, color: T.red },
            ].map((b, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: T.bg4 }}>
                <div style={{ fontSize: 9, color: T.text4, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{b.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: b.color || T.text, fontFamily: "'JetBrains Mono', monospace" }}>{b.value}</div>
              </div>
            ))}
          </div>
          {signal.targets && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.text4, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Targets</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {signal.targets.map((t, i) => (
                  <div key={i} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: T.greenBg, border: `1px solid ${T.green}20` }}>
                    <div style={{ fontSize: 9, color: T.text4, marginBottom: 4 }}>Target {i + 1}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.green, fontFamily: "'JetBrains Mono', monospace" }}>{t}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: T.text4, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Score Breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[{ l: 'Structure', v: signal.structure_score, m: 3 }, { l: 'Volume', v: signal.volume_score, m: 3 }, { l: 'Indicators', v: signal.indicator_score, m: 2 }, { l: 'Sentiment', v: signal.sentiment_score, m: 2 }].map((s, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: T.bg4, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: T.text4, marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{s.v}/{s.m}</div>
                </div>
              ))}
            </div>
          </div>
          {signal.reason && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.text4, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Analysis</div>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: T.text2 }}>{signal.reason}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { onWatch(signal); onClose(); }} style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.yellow; e.currentTarget.style.color = T.yellow; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; }}><Star size={14} /> Watchlist</button>
            <button onClick={() => { onPortfolio(signal); onClose(); }} style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', background: T.green, color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}><Plus size={14} /> Add Trade</button>
            <button onClick={() => { onJournal(signal, signal.signal); onClose(); }} style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; }}><FileText size={14} /> Journal</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ onClose, theme, setTheme, T }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="scale-in" style={{ background: T.bg3, borderRadius: 16, border: `1px solid ${T.border}`, width: 400 }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: T.text4, marginBottom: 8, display: 'block', fontWeight: 600 }}>Theme</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.keys(themes).map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${theme === t ? T.accent : T.border}`,
                  background: theme === t ? `${T.accent}12` : 'transparent',
                  color: theme === t ? T.accent : T.text3, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  textTransform: 'capitalize', transition: 'all 0.15s',
                }}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToastContainer({ toasts, T }) {
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(toast => (
        <div key={toast.id} className="slide-in" style={{
          padding: '10px 16px', borderRadius: 10,
          background: toast.type === 'success' ? T.green : toast.type === 'warning' ? T.yellow : T.accent,
          color: 'white', fontSize: 12, fontWeight: 600,
          boxShadow: T.shadow,
          display: 'flex', alignItems: 'center', gap: 8,
          maxWidth: 320,
        }}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : toast.type === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
