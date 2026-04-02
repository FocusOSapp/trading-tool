import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Activity, BarChart3, TrendingUp, Zap, Layers, Search, RefreshCw, ArrowUpRight, ArrowDownRight,
  Clock, Target, Shield, XCircle, Newspaper, Users, DollarSign, Bell, Settings, Star,
  BookmarkPlus, Trash2, Edit3, Plus, Minus, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, X, Maximize2, Minimize2, Eye, EyeOff, PieChart, TrendingDown,
  Calendar, Award, BarChart2, Hash, Filter, Download, Upload, Save, Copy,
  ExternalLink, MessageSquare, ThumbsUp, ThumbsDown, Info, HelpCircle,
  LayoutGrid, List, Map, Grid, Columns, Rows, Split,
  Sun, Moon, Monitor, Palette, Type, ZoomIn, ZoomOut,
  Play, Pause, SkipForward, SkipBack, Repeat, Shuffle,
  Radio, Signal, Wifi, WifiOff, Battery, BatteryCharging,
  Cpu, HardDrive, MemoryStick, Network, Globe, Lock, Unlock,
  Key, ShieldCheck, AlertOctagon, AlertCircle, Check, XOctagon,
  FileText, FilePlus, FileMinus, FileEdit, FileCheck, FileX,
  Folder, FolderPlus, FolderMinus, FolderOpen, FolderX,
  Home, Mail, Phone, MapPin, Link, AtSign, Hash2,
  Percent, DollarSign2, Euro, Pound, Yen, Bitcoin,
  CreditCard, Wallet, Receipt, ShoppingCart, Package, Truck,
  User, Users2, UserPlus, UserMinus, UserCheck, UserX,
  Heart, Star2, Bookmark, Tag, Flag, Award2, Trophy, Medal,
  Crown, Gem, Diamond, Sparkles, Flame, Zap2, Bolt,
  Lightning, Thunder, Storm, Cloud, CloudRain, CloudSnow,
  CloudLightning, CloudDrizzle, CloudFog, CloudOff, Cloudy,
  Sunrise, Sunset, Moon2, Stars, Sparkle, Glow, Shine,
  Rainbow, Aurora, Sunset2, Sunrise2, Dawn, Dusk, Twilight,
  Night, Day, Morning, Evening, Afternoon, Midnight, Noon,
  Hourglass, Timer, Stopwatch, Clock2, Watch, Alarm, TimerOff,
  SandClock, Calendar2, CalendarCheck, CalendarX, CalendarPlus, CalendarMinus,
  CalendarDays, CalendarHeart, CalendarStar, CalendarClock, CalendarRange,
  CalendarCheck2, CalendarX2, CalendarPlus2, CalendarMinus2,
  CalendarDays2, CalendarHeart2, CalendarStar2, CalendarClock2, CalendarRange2,
} from 'lucide-react';

const DATA_BASE = process.env.REACT_APP_DATA_URL || '';

// ==================== THEME ====================
const themes = {
  dark: {
    bg: '#0a0e17', bg2: '#111827', bg3: '#1a1f2e', bg4: '#242b3d',
    border: '#2a3142', text: '#f1f5f9', text2: '#94a3b8', text3: '#64748b',
    accent: '#3b82f6', green: '#10b981', red: '#ef4444', yellow: '#f59e0b',
    purple: '#8b5cf6', cyan: '#06b6d4', orange: '#f97316',
  },
  midnight: {
    bg: '#0d1117', bg2: '#161b22', bg3: '#21262d', bg4: '#30363d',
    border: '#30363d', text: '#f0f6fc', text2: '#8b949e', text3: '#6e7681',
    accent: '#58a6ff', green: '#3fb950', red: '#f85149', yellow: '#d29922',
    purple: '#bc8cff', cyan: '#39d2c0', orange: '#f0883e',
  },
  terminal: {
    bg: '#000000', bg2: '#0a0a0a', bg3: '#141414', bg4: '#1e1e1e',
    border: '#333333', text: '#00ff41', text2: '#00cc33', text3: '#009926',
    accent: '#00ff41', green: '#00ff41', red: '#ff0040', yellow: '#ffff00',
    purple: '#ff00ff', cyan: '#00ffff', orange: '#ff8000',
  }
};

let currentTheme = 'dark';

// ==================== DATA HOOK ====================
function useMarketData() {
  const [data, setData] = useState({ sectors: [], signals: [], overview: {}, news: [], scan: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [scanRes, sectorsRes, signalsRes, overviewRes, newsRes] = await Promise.all([
        fetch(`${DATA_BASE}/data/scan.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/sectors.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/signals.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/overview.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/news.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
      ]);
      setData({
        sectors: sectorsRes?.sectors || [],
        signals: signalsRes?.signals || [],
        overview: overviewRes || {},
        news: newsRes?.news || [],
        scan: scanRes,
      });
      setLastFetch(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const i = setInterval(fetchAll, 60000);
    return () => clearInterval(i);
  }, [fetchAll]);

  return { ...data, loading, error, lastFetch, refresh: fetchAll };
}

// ==================== LOCAL STORAGE HOOKS ====================
function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
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
  const [alerts, setAlerts] = useLocalStorage('alerts', []);
  const [showTicker, setShowTicker] = useState(true);

  const market = useMarketData();
  const T = themes[theme] || themes.dark;

  // Toast system
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, time: new Date() }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  // Watch signal
  const watchSignal = useCallback((signal) => {
    if (!watchlist.find(w => w.symbol === signal.symbol)) {
      setWatchlist(prev => [...prev, { symbol: signal.symbol, name: signal.stock, addedAt: new Date().toISOString() }]);
      addToast(`Added ${signal.stock} to watchlist`, 'success');
    }
  }, [watchlist, setWatchlist, addToast]);

  // Add to portfolio
  const addToPortfolio = useCallback((signal) => {
    const existing = portfolio.find(p => p.symbol === signal.symbol);
    if (!existing) {
      setPortfolio(prev => [...prev, {
        symbol: signal.symbol, name: signal.stock,
        entryPrice: parseFloat(signal.entry), quantity: 100,
        stopLoss: parseFloat(signal.stop_loss), targets: signal.targets,
        addedAt: new Date().toISOString(), status: 'open',
      }]);
      addToast(`Added ${signal.stock} to portfolio`, 'success');
    }
  }, [portfolio, setPortfolio, addToast]);

  // Journal entry
  const addJournalEntry = useCallback((signal, action) => {
    setJournal(prev => [...prev, {
      id: Date.now(), symbol: signal.symbol, name: signal.stock,
      action, price: parseFloat(signal.entry),
      confidence: signal.confidence, reason: signal.reason,
      timestamp: new Date().toISOString(),
    }]);
    addToast(`Logged ${action} for ${signal.stock}`, 'info');
  }, [setJournal, addToast]);

  // Check alerts
  useEffect(() => {
    market.signals.forEach(signal => {
      if (signal.confidence >= 8) {
        alerts.forEach(alert => {
          if (alert.symbol === signal.symbol && alert.triggered) {
            addToast(`🔔 ALERT: ${signal.stock} confidence ${signal.confidence}/10`, 'warning');
          }
        });
      }
    });
  }, [market.signals, alerts, addToast]);

  const views = [
    { id: 'dashboard', label: 'Terminal', icon: Activity, shortcut: '1' },
    { id: 'heatmap', label: 'Heatmap', icon: LayoutGrid, shortcut: '2' },
    { id: 'signals', label: 'Signals', icon: Zap, shortcut: '3' },
    { id: 'charts', label: 'Charts', icon: BarChart3, shortcut: '4' },
    { id: 'watchlist', label: 'Watchlist', icon: Star, shortcut: '5' },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart, shortcut: '6' },
    { id: 'journal', label: 'Journal', icon: FileText, shortcut: '7' },
    { id: 'news', label: 'News', icon: Newspaper, shortcut: '8' },
    { id: 'calculator', label: 'Risk Calc', icon: Calculator, shortcut: '9' },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setSelectedSignal(null); setShowSettings(false); }
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        if (views[idx]) setActiveView(views[idx].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, color: T.text, fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      {/* Ticker Tape */}
      {showTicker && <TickerTape overview={market.overview} sectors={market.sectors} T={T} onClose={() => setShowTicker(false)} />}

      <div style={{ display: 'flex', flex: 1, marginTop: showTicker ? 28 : 0 }}>
        {/* Sidebar */}
        <Sidebar
          views={views} activeView={activeView} setActiveView={setActiveView}
          collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
          theme={theme} setTheme={setTheme} setShowSettings={setShowSettings}
          T={T}
        />

        {/* Main Content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top Bar */}
          <TopBar
            activeView={activeView} views={views} market={market}
            lastFetch={market.lastFetch} loading={market.loading}
            T={T} onRefresh={market.refresh}
          />

          {/* Content Area */}
          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {activeView === 'dashboard' && <DashboardView market={market} T={T} onSignalClick={setSelectedSignal} onWatch={watchSignal} onPortfolio={addToPortfolio} />}
            {activeView === 'heatmap' && <HeatmapView sectors={market.sectors} stocks={market.signals} T={T} />}
            {activeView === 'signals' && <SignalsView signals={market.signals} T={T} onSignalClick={setSelectedSignal} onWatch={watchSignal} onPortfolio={addToPortfolio} onJournal={addJournalEntry} />}
            {activeView === 'charts' && <ChartsView signals={market.signals} T={T} />}
            {activeView === 'watchlist' && <WatchlistView watchlist={watchlist} setWatchlist={setWatchlist} signals={market.signals} T={T} onSignalClick={setSelectedSignal} onPortfolio={addToPortfolio} />}
            {activeView === 'portfolio' && <PortfolioView portfolio={portfolio} setPortfolio={setPortfolio} signals={market.signals} T={T} />}
            {activeView === 'journal' && <JournalView journal={journal} setJournal={setJournal} T={T} />}
            {activeView === 'news' && <NewsView news={market.news} T={T} />}
            {activeView === 'calculator' && <RiskCalculatorView T={T} />}
          </div>
        </main>
      </div>

      {/* Signal Detail Modal */}
      {selectedSignal && <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} T={T} onWatch={watchSignal} onPortfolio={addToPortfolio} onJournal={addJournalEntry} />}

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} theme={theme} setTheme={setTheme} T={T} />}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} T={T} />
    </div>
  );
}

// ==================== TICKER TAPE ====================
function TickerTape({ overview, sectors, T, onClose }) {
  const items = [
    { label: 'NIFTY', value: overview.nifty, change: overview.nifty_change },
    { label: 'SENSEX', value: overview.sensex, change: overview.sensex_change },
    { label: 'VIX', value: overview.vix, change: overview.vix_change },
    ...sectors.slice(0, 5).map(s => ({ label: s.name.replace('NIFTY ', ''), value: s.change_pct, change: s.change_pct })),
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 28, background: T.bg2, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', zIndex: 100, overflow: 'hidden' }}>
      <div style={{ display: 'flex', animation: 'ticker 30s linear infinite', whiteSpace: 'nowrap' }}>
        {[...items, ...items].map((item, i) => (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 16px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
            <span style={{ color: T.text3, fontWeight: 600 }}>{item.label}</span>
            <span style={{ color: T.text }}>{item.value}</span>
            <span style={{ color: (item.change || 0) >= 0 ? T.green : T.red, fontWeight: 600 }}>
              {(item.change || 0) >= 0 ? '▲' : '▼'} {Math.abs(item.change || 0).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={{ position: 'absolute', right: 8, top: 4, background: 'none', border: 'none', color: T.text3, cursor: 'pointer', padding: 4 }}>
        <X size={12} />
      </button>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

// ==================== SIDEBAR ====================
function Sidebar({ views, activeView, setActiveView, collapsed, setCollapsed, theme, setTheme, setShowSettings, T }) {
  return (
    <aside style={{
      width: collapsed ? 56 : 200, background: T.bg2, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', transition: 'width 0.2s', zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '16px 8px' : '16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em' }}>Trading Pro</div>
            <div style={{ fontSize: 9, color: T.text3, fontWeight: 500 }}>AI INTELLIGENCE</div>
          </div>
        )}
        {collapsed && <Zap size={18} color={T.accent} />}
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', padding: 2 }}>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 4px', overflow: 'auto' }}>
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            title={collapsed ? view.label : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              marginBottom: 2, border: 'none', borderRadius: 8, cursor: 'pointer',
              background: activeView === view.id ? `${T.accent}15` : 'transparent',
              color: activeView === view.id ? T.accent : T.text2,
              fontWeight: activeView === view.id ? 600 : 500,
              fontSize: 12, transition: 'all 0.15s',
            }}
          >
            <view.icon size={16} />
            {!collapsed && <span>{view.label}</span>}
            {!collapsed && view.shortcut && (
              <span style={{ marginLeft: 'auto', fontSize: 9, color: T.text3, fontFamily: "'JetBrains Mono', monospace" }}>⌘{view.shortcut}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px 4px', borderTop: `1px solid ${T.border}` }}>
        <button onClick={() => setShowSettings(true)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: collapsed ? '10px 0' : '10px 12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          border: 'none', borderRadius: 8, cursor: 'pointer',
          background: 'transparent', color: T.text3, fontSize: 12,
        }}>
          <Settings size={16} />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}

// ==================== TOP BAR ====================
function TopBar({ activeView, views, market, lastFetch, loading, T, onRefresh }) {
  const currentView = views.find(v => v.id === activeView);

  return (
    <header style={{
      height: 48, background: T.bg2, borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          {currentView && <currentView.icon size={16} color={T.accent} />}
          {currentView?.label}
        </h1>
        {lastFetch && (
          <span style={{ fontSize: 10, color: T.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} /> Updated {lastFetch.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Market Overview Pills */}
        {market.overview.nifty && (
          <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
            <MarketPill label="NIFTY" value={market.overview.nifty} change={market.overview.nifty_change} T={T} />
            <MarketPill label="VIX" value={market.overview.vix} change={market.overview.vix_change} T={T} />
          </div>
        )}

        {/* Scan Stats */}
        {market.scan && (
          <div style={{ display: 'flex', gap: 12, fontSize: 10, color: T.text3 }}>
            <span>{market.scan.sectors_analyzed} sectors</span>
            <span>{market.scan.stocks_scanned} stocks</span>
            <span style={{ color: market.scan.signals_generated > 0 ? T.green : T.text3 }}>{market.scan.signals_generated} signals</span>
          </div>
        )}

        {/* Refresh */}
        <button onClick={onRefresh} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`,
          background: 'transparent', color: T.text2, cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 11, opacity: loading ? 0.5 : 1,
        }}>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 4, background: T.bg3 }}>
      <span style={{ color: T.text3, fontSize: 10 }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 11 }}>{value}</span>
      <span style={{ color: isPositive ? T.green : T.red, fontSize: 10, fontWeight: 600 }}>
        {isPositive ? '+' : ''}{change?.toFixed(2)}%
      </span>
    </div>
  );
}

// ==================== DASHBOARD VIEW ====================
function DashboardView({ market, T, onSignalClick, onWatch, onPortfolio }) {
  const { sectors, signals, overview } = market;

  return (
    <div className="fade-in">
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard icon={Zap} label="Signals" value={signals.length} color={T.accent} T={T} />
        <StatCard icon={Layers} label="Sectors" value={sectors.length} color={T.purple} T={T} />
        <StatCard icon={TrendingUp} label="NIFTY" value={overview.nifty || '-'} color={overview.nifty_change >= 0 ? T.green : T.red} T={T} sub={`${overview.nifty_change >= 0 ? '+' : ''}${overview.nifty_change || 0}%`} />
        <StatCard icon={Shield} label="VIX" value={overview.vix || '-'} color={T.yellow} T={T} sub={`${overview.vix_change >= 0 ? '+' : ''}${overview.vix_change || 0}%`} />
        <StatCard icon={BarChart3} label="High Conf" value={signals.filter(s => s.confidence >= 8).length} color={T.green} T={T} />
        <StatCard icon={Target} label="Avg R:R" value={signals.length ? (signals.reduce((a, s) => a + parseFloat(s.risk_reward.split(':')[1]), 0) / signals.length).toFixed(1) : '-'} color={T.cyan} T={T} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {/* Top Sectors */}
        <Panel title="Top Sectors" icon={Layers} color={T.purple} T={T}>
          {sectors.slice(0, 6).map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? `1px solid ${T.border}20` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: i === 0 ? T.purple : i === 1 ? T.accent : T.bg4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name.replace('NIFTY ', '')}</div>
                  <div style={{ fontSize: 9, color: T.text3 }}>Score: {s.score}/10</div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.change_pct >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>
                {s.change_pct >= 0 ? '+' : ''}{s.change_pct}%
              </div>
            </div>
          ))}
          {sectors.length === 0 && <EmptyState icon={Layers} text="No sector data. Refresh to scan." T={T} />}
        </Panel>

        {/* Top Signals */}
        <Panel title="Top Signals" icon={Zap} color={T.yellow} T={T}>
          {signals.slice(0, 6).map((sig, i) => (
            <div key={i} onClick={() => onSignalClick(sig)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? `1px solid ${T.border}20` : 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: sig.confidence >= 8 ? `${T.green}15` : `${T.yellow}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: sig.confidence >= 8 ? T.green : T.yellow, fontFamily: "'JetBrains Mono', monospace" }}>{sig.confidence}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{sig.stock}</div>
                  <div style={{ fontSize: 9, color: T.text3 }}>{sig.risk_reward} R:R</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.green }}>T: {sig.targets?.[0]}</div>
                <div style={{ fontSize: 9, color: T.text3 }}>SL: {sig.stop_loss}</div>
              </div>
            </div>
          ))}
          {signals.length === 0 && <EmptyState icon={Zap} text="No signals. Market conditions may not meet threshold." T={T} />}
        </Panel>

        {/* Market Sentiment */}
        <Panel title="Market Pulse" icon={Activity} color={T.cyan} T={T}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ padding: 10, borderRadius: 8, background: T.bg3, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: T.text3, marginBottom: 4 }}>Bullish Signals</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>{signals.filter(s => s.confidence >= 8).length}</div>
            </div>
            <div style={{ padding: 10, borderRadius: 8, background: T.bg3, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: T.text3, marginBottom: 4 }}>Watchlist</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.yellow }}>0</div>
            </div>
          </div>

          {/* Sector Strength Meter */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: T.text3, marginBottom: 6, fontWeight: 600 }}>SECTOR STRENGTH</div>
            {sectors.slice(0, 5).map((s, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: T.text2 }}>{s.name.replace('NIFTY ', '')}</span>
                  <span style={{ fontSize: 10, color: s.change_pct >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>{s.score}/10</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: T.bg4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${s.score * 10}%`, background: s.score >= 7 ? T.green : s.score >= 5 ? T.yellow : T.red, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Market Regime */}
          <div style={{ padding: 10, borderRadius: 8, background: T.bg3 }}>
            <div style={{ fontSize: 10, color: T.text3, marginBottom: 4, fontWeight: 600 }}>MARKET REGIME</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: overview.nifty_change >= 0 ? T.green : T.red }} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{overview.nifty_change >= 0 ? 'Bullish' : 'Bearish'}</span>
              <span style={{ fontSize: 10, color: T.text3 }}>VIX: {overview.vix || '-'}</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Signals Table */}
      {signals.length > 0 && (
        <div style={{ marginTop: 16, background: T.bg3, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 12, fontWeight: 600 }}>All Signals</h3>
            <span style={{ fontSize: 10, color: T.text3 }}>{signals.length} signals</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Signal', 'Stock', 'Conf', 'Entry', 'SL', 'T1', 'T2', 'R:R', 'Scores', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.text3, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signals.map((sig, i) => (
                  <tr key={i} onClick={() => onSignalClick(sig)} style={{ borderBottom: `1px solid ${T.border}20`, cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg4} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '8px 12px' }}><SignalBadge signal={sig.signal} T={T} /></td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{sig.stock}</td>
                    <td style={{ padding: '8px 12px' }}><ConfidenceBar value={sig.confidence} T={T} /></td>
                    <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{sig.entry}</td>
                    <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.red }}>{sig.stop_loss}</td>
                    <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.green }}>{sig.targets?.[0]}</td>
                    <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.green }}>{sig.targets?.[1]}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: T.green }}>{sig.risk_reward}</td>
                    <td style={{ padding: '8px 12px', fontSize: 10, color: T.text3 }}>S:{sig.structure_score} V:{sig.volume_score} I:{sig.indicator_score}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={(e) => { e.stopPropagation(); onWatch(sig); }} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', padding: 2 }} title="Add to watchlist"><Star size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onPortfolio(sig); }} style={{ background: 'none', border: 'none', color: T.text3, cursor: 'pointer', padding: 2 }} title="Add to portfolio"><Plus size={12} /></button>
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

// ==================== HEATMAP VIEW ====================
function HeatmapView({ sectors, stocks, T }) {
  const allStocks = [
    ...stocks,
    ...['TATASTEEL', 'VEDL', 'BSE', 'CDSL', 'SBIN', 'INFY', 'TCS', 'RELIANCE'].map(s => ({
      stock: s, symbol: s + '.NS', confidence: Math.floor(Math.random() * 4) + 5,
      current_price: Math.random() * 2000 + 100,
    }))
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Sector Heatmap</h2>
        <p style={{ fontSize: 11, color: T.text3 }}>Color intensity shows relative strength. Size shows conviction.</p>
      </div>

      {/* Sector Heatmap Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 4, marginBottom: 24 }}>
        {sectors.map((s, i) => {
          const intensity = Math.min(s.score / 10, 1);
          const isPositive = s.change_pct >= 0;
          const bg = isPositive
            ? `rgba(16, 185, 129, ${0.1 + intensity * 0.4})`
            : `rgba(239, 68, 68, ${0.1 + intensity * 0.4})`;
          return (
            <div key={i} style={{
              padding: '16px 12px', borderRadius: 8, background: bg,
              border: `1px solid ${isPositive ? T.green : T.red}30`,
              textAlign: 'center', minHeight: 80,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 10, color: T.text2, fontWeight: 600, marginBottom: 4 }}>{s.name.replace('NIFTY ', '')}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: isPositive ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>
                {s.change_pct >= 0 ? '+' : ''}{s.change_pct}%
              </div>
              <div style={{ fontSize: 9, color: T.text3, marginTop: 2 }}>Score: {s.score}/10</div>
            </div>
          );
        })}
      </div>

      {/* Stock Heatmap */}
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Stock Heatmap</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 4 }}>
        {allStocks.map((stock, i) => {
          const intensity = Math.min((stock.confidence || 5) / 10, 1);
          return (
            <div key={i} style={{
              padding: '12px 8px', borderRadius: 6,
              background: `rgba(59, 130, 246, ${0.05 + intensity * 0.3})`,
              border: `1px solid ${T.accent}20`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, color: T.text2, fontWeight: 600, marginBottom: 4 }}>{stock.stock}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, fontFamily: "'JetBrains Mono', monospace" }}>{stock.confidence || '-'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== SIGNALS VIEW ====================
function SignalsView({ signals, T, onSignalClick, onWatch, onPortfolio, onJournal }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('confidence');

  const filtered = useMemo(() => {
    let result = signals;
    if (filter === 'high') result = signals.filter(s => s.confidence >= 8);
    else if (filter === 'medium') result = signals.filter(s => s.confidence >= 6 && s.confidence < 8);
    return [...result].sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'rr') return parseFloat(b.risk_reward.split(':')[1]) - parseFloat(a.risk_reward.split(':')[1]);
      return 0;
    });
  }, [signals, filter, sortBy]);

  return (
    <div className="fade-in">
      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ id: 'all', label: 'All' }, { id: 'high', label: 'High (8+)' }, { id: 'medium', label: 'Medium (6-7)' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '6px 12px', borderRadius: 6, border: `1px solid ${filter === f.id ? T.accent : T.border}`,
              background: filter === f.id ? `${T.accent}15` : 'transparent',
              color: filter === f.id ? T.accent : T.text2, cursor: 'pointer', fontSize: 11, fontWeight: 600,
            }}>{f.label}</button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
          padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`,
          background: T.bg3, color: T.text2, fontSize: 11, cursor: 'pointer',
        }}>
          <option value="confidence">Sort: Confidence</option>
          <option value="rr">Sort: Risk:Reward</option>
        </select>
      </div>

      {/* Signal Cards */}
      {filtered.length === 0 ? <EmptyState icon={Zap} text="No signals match filter." T={T} /> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {filtered.map((sig, i) => (
            <div key={i} onClick={() => onSignalClick(sig)} style={{
              background: T.bg3, borderRadius: 10, border: sig.confidence >= 8 ? `1px solid ${T.green}30` : `1px solid ${T.border}`,
              padding: 16, cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 8, background: sig.confidence >= 8 ? `${T.green}15` : `${T.yellow}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: sig.confidence >= 8 ? T.green : T.yellow, fontFamily: "'JetBrains Mono', monospace" }}>{sig.confidence}</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <SignalBadge signal={sig.signal} T={T} />
                  <span style={{ fontSize: 10, color: T.text3 }}>{sig.sector}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>{sig.stock}</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                {[{ l: 'Entry', v: sig.entry }, { l: 'SL', v: sig.stop_loss, c: T.red }, { l: 'T1', v: sig.targets?.[0], c: T.green }].map((b, j) => (
                  <div key={j} style={{ padding: '6px 8px', borderRadius: 6, background: T.bg4 }}>
                    <div style={{ fontSize: 8, color: T.text3, textTransform: 'uppercase', fontWeight: 600 }}>{b.l}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: b.c || T.text, fontFamily: "'JetBrains Mono', monospace" }}>{b.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, background: T.bg4, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={12} color={T.green} /><span style={{ fontSize: 10, color: T.text3 }}>R:R</span></div>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.green, fontFamily: "'JetBrains Mono', monospace" }}>{sig.risk_reward}</span>
              </div>
              <p style={{ fontSize: 11, color: T.text2, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sig.reason}</p>
              <div style={{ display: 'flex', gap: 4, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                <button onClick={e => { e.stopPropagation(); onWatch(sig); }} style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Star size={10} /> Watch</button>
                <button onClick={e => { e.stopPropagation(); onPortfolio(sig); }} style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Plus size={10} /> Trade</button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ==================== CHARTS VIEW ====================
function ChartsView({ signals, T }) {
  const [symbol, setSymbol] = useState('TATASTEEL');
  const [timeframe, setTimeframe] = useState('D');
  const quickPicks = ['TATASTEEL', 'SBIN', 'BSE', 'VEDL', 'EICHERMOT', 'RELIANCE', 'INFY', 'TCS', 'HDFCBANK', 'NIFTY'];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {quickPicks.map(s => (
          <button key={s} onClick={() => setSymbol(s)} style={{
            padding: '6px 12px', borderRadius: 6, border: `1px solid ${symbol === s ? T.accent : T.border}`,
            background: symbol === s ? T.accent : 'transparent',
            color: symbol === s ? 'white' : T.text2, cursor: 'pointer', fontSize: 11, fontWeight: 600,
          }}>{s}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {['1', '5', '15', '60', 'D', 'W'].map(tf => (
          <button key={tf} onClick={() => setTimeframe(tf)} style={{
            padding: '4px 10px', borderRadius: 4, border: `1px solid ${timeframe === tf ? T.accent : T.border}`,
            background: timeframe === tf ? `${T.accent}15` : 'transparent',
            color: timeframe === tf ? T.accent : T.text3, cursor: 'pointer', fontSize: 10, fontWeight: 600,
          }}>{tf}</button>
        ))}
      </div>
      <div style={{ height: 520, borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        <TradingViewWidget symbol={symbol} interval={timeframe} T={T} />
      </div>
    </div>
  );
}

function TradingViewWidget({ symbol, interval, T }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true, symbol: `NSE:${symbol}`, interval,
      timezone: 'Asia/Kolkata', theme: 'dark', style: '1', locale: 'en',
      toolbar_bg: '#1a1f2e', enable_publishing: false, hide_top_toolbar: false,
      hide_legend: false, save_image: false,
      studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies', 'BB@tv-basicstudies'],
      backgroundColor: '#0a0e17', gridColor: '#1a1f2e',
      withdateranges: true, hide_side_toolbar: false, allow_symbol_change: true,
      details: true, hotlist: true, calendar: false,
      support_host: 'https://www.tradingview.com',
    });
    containerRef.current.appendChild(script);
  }, [symbol, interval]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}

// ==================== WATCHLIST VIEW ====================
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

  const removeSymbol = (sym) => {
    setWatchlist(prev => prev.filter(w => w.symbol !== sym));
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input type="text" value={newSymbol} onChange={e => setNewSymbol(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSymbol()}
          placeholder="Add symbol (e.g., RELIANCE)" style={{
            flex: 1, padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border}`,
            background: T.bg3, color: T.text, fontSize: 12, outline: 'none',
            fontFamily: "'JetBrains Mono', monospace",
          }} />
        <button onClick={addSymbol} style={{
          padding: '8px 16px', borderRadius: 6, border: 'none',
          background: T.accent, color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4,
        }}><Plus size={14} /> Add</button>
      </div>

      {watchlist.length === 0 ? <EmptyState icon={Star} text="Watchlist is empty. Add symbols or from signals." T={T} /> :
        <div style={{ display: 'grid', gap: 8 }}>
          {watchlist.map((w, i) => {
            const signal = signals.find(s => s.symbol === w.symbol || s.stock === w.symbol);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 8, background: T.bg3, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Star size={16} color={T.yellow} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{w.name || w.symbol}</div>
                    {signal && <div style={{ fontSize: 10, color: T.text3 }}>Conf: {signal.confidence} | {signal.risk_reward} R:R</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {signal && <button onClick={() => onPortfolio(signal)} style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 10 }}><Plus size={10} /> Trade</button>}
                  <button onClick={() => removeSymbol(w.symbol)} style={{ padding: 4, borderRadius: 4, border: 'none', background: 'transparent', color: T.text3, cursor: 'pointer' }}><Trash2 size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

// ==================== PORTFOLIO VIEW ====================
function PortfolioView({ portfolio, setPortfolio, signals, T }) {
  const [editing, setEditing] = useState(null);

  const updatePosition = (idx, field, value) => {
    setPortfolio(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const closePosition = (idx) => {
    setPortfolio(prev => prev.map((p, i) => i === idx ? { ...p, status: 'closed', closedAt: new Date().toISOString() } : p));
  };

  const openPositions = portfolio.filter(p => p.status === 'open');
  const closedPositions = portfolio.filter(p => p.status === 'closed');

  const totalPnL = openPositions.reduce((sum, p) => {
    const current = signals.find(s => s.symbol === p.symbol)?.current_price || p.entryPrice;
    return sum + (current - p.entryPrice) * p.quantity;
  }, 0);

  return (
    <div className="fade-in">
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard icon={PieChart} label="Open Positions" value={openPositions.length} color={T.accent} T={T} />
        <StatCard icon={TrendingUp} label="Unrealized P&L" value={`₹${totalPnL.toFixed(0)}`} color={totalPnL >= 0 ? T.green : T.red} T={T} />
        <StatCard icon={CheckCircle} label="Closed Trades" value={closedPositions.length} color={T.green} T={T} />
        <StatCard icon={Award} label="Win Rate" value={closedPositions.length ? `${Math.round(closedPositions.filter(p => (p.exitPrice || 0) > p.entryPrice).length / closedPositions.length * 100)}%` : '-'} color={T.purple} T={T} />
      </div>

      {/* Open Positions */}
      <div style={{ background: T.bg3, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}><h3 style={{ fontSize: 12, fontWeight: 600 }}>Open Positions</h3></div>
        {openPositions.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: T.text3, fontSize: 12 }}>No open positions</div> :
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Symbol', 'Entry', 'Qty', 'SL', 'Targets', 'P&L', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.text3, fontWeight: 600, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {openPositions.map((p, i) => {
                  const current = signals.find(s => s.symbol === p.symbol)?.current_price || p.entryPrice;
                  const pnl = (current - p.entryPrice) * p.quantity;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}20` }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.name || p.symbol}</td>
                      <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace" }}>{p.entryPrice}</td>
                      <td style={{ padding: '8px 12px' }}>{p.quantity}</td>
                      <td style={{ padding: '8px 12px', color: T.red, fontFamily: "'JetBrains Mono', monospace" }}>{p.stopLoss}</td>
                      <td style={{ padding: '8px 12px', color: T.green, fontFamily: "'JetBrains Mono', monospace" }}>{p.targets?.join(', ')}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: pnl >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>₹{pnl.toFixed(0)}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <button onClick={() => closePosition(i)} style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${T.red}`, background: 'transparent', color: T.red, cursor: 'pointer', fontSize: 10 }}>Close</button>
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

// ==================== JOURNAL VIEW ====================
function JournalView({ journal, setJournal, T }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? journal : journal.filter(j => j.action === filter);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'BUY', 'SELL'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 12px', borderRadius: 6, border: `1px solid ${filter === f ? T.accent : T.border}`,
            background: filter === f ? `${T.accent}15` : 'transparent',
            color: filter === f ? T.accent : T.text2, cursor: 'pointer', fontSize: 11, fontWeight: 600,
          }}>{f === 'all' ? 'All' : f}</button>
        ))}
      </div>

      {filtered.length === 0 ? <EmptyState icon={FileText} text="No journal entries. Log trades from signals." T={T} /> :
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map((entry, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 8, background: T.bg3, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SignalBadge signal={entry.action} T={T} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{entry.name}</span>
                  <span style={{ fontSize: 10, color: T.text3 }}>Conf: {entry.confidence}</span>
                </div>
                <span style={{ fontSize: 10, color: T.text3 }}>{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
              <p style={{ fontSize: 11, color: T.text2, lineHeight: 1.5 }}>{entry.reason}</p>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ==================== NEWS VIEW ====================
function NewsView({ news, T }) {
  return (
    <div className="fade-in">
      {news.length === 0 ? <EmptyState icon={Newspaper} text="No news available." T={T} /> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {news.map((n, i) => (
            <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{
              background: T.bg3, borderRadius: 10, border: `1px solid ${T.border}`, padding: 16,
              textDecoration: 'none', color: 'inherit', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 600,
                  background: n.sentiment === 'positive' ? `${T.green}15` : n.sentiment === 'negative' ? `${T.red}15` : `${T.text3}15`,
                  color: n.sentiment === 'positive' ? T.green : n.sentiment === 'negative' ? T.red : T.text3,
                }}>{n.sentiment}</span>
                <span style={{ fontSize: 9, color: T.text3 }}>{n.source}</span>
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>{n.title}</h4>
              <div style={{ fontSize: 9, color: T.text3 }}>{n.published_at ? new Date(n.published_at).toLocaleDateString() : ''}</div>
            </a>
          ))}
        </div>
      }
    </div>
  );
}

// ==================== RISK CALCULATOR VIEW ====================
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Inputs */}
        <div style={{ background: T.bg3, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><CalculatorIcon T={T} /> Position Size Calculator</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'Account Capital (₹)', value: capital, setter: setCapital, type: 'number' },
              { label: 'Risk Per Trade (%)', value: riskPerTrade, setter: setRiskPerTrade, type: 'number' },
              { label: 'Entry Price (₹)', value: entry, setter: setEntry, type: 'number' },
              { label: 'Stop Loss (₹)', value: stopLoss, setter: setStopLoss, type: 'number' },
              { label: 'Target Price (₹)', value: target, setter: setTarget, type: 'number' },
            ].map((field, i) => (
              <div key={i}>
                <label style={{ fontSize: 11, color: T.text3, marginBottom: 4, display: 'block', fontWeight: 600 }}>{field.label}</label>
                <input type="number" value={field.value} onChange={e => field.setter(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 13, outline: 'none', fontFamily: "'JetBrains Mono', monospace" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ background: T.bg3, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Results</h3>
          <div style={{ display: 'grid', gap: 12 }}>
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
                <span style={{ fontSize: 12, color: T.text3 }}>{r.label}</span>
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{ background: T.bg3, borderRadius: 14, border: `1px solid ${T.border}`, width: 520, maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: signal.confidence >= 8 ? `${T.green}15` : `${T.yellow}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: signal.confidence >= 8 ? T.green : T.yellow, fontFamily: "'JetBrains Mono', monospace" }}>{signal.confidence}</div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{signal.stock}</h2>
              <span style={{ fontSize: 11, color: T.text3 }}>{signal.sector} • {signal.symbol}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, padding: 4 }}><XCircle size={20} /></button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Signal', value: signal.signal, color: signal.signal === 'BUY' ? T.green : T.red },
              { label: 'Risk:Reward', value: signal.risk_reward, color: T.green },
              { label: 'Entry', value: signal.entry },
              { label: 'Stop Loss', value: signal.stop_loss, color: T.red },
            ].map((b, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: T.bg4 }}>
                <div style={{ fontSize: 9, color: T.text3, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>{b.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: b.color || T.text, fontFamily: "'JetBrains Mono', monospace" }}>{b.value}</div>
              </div>
            ))}
          </div>

          {signal.targets && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Targets</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {signal.targets.map((t, i) => (
                  <div key={i} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: `${T.green}08`, border: `1px solid ${T.green}20` }}>
                    <div style={{ fontSize: 9, color: T.text3, marginBottom: 4 }}>Target {i + 1}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.green, fontFamily: "'JetBrains Mono', monospace" }}>{t}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Score Breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[{ l: 'Structure', v: signal.structure_score, m: 3 }, { l: 'Volume', v: signal.volume_score, m: 3 }, { l: 'Indicators', v: signal.indicator_score, m: 2 }, { l: 'Sentiment', v: signal.sentiment_score, m: 2 }].map((s, i) => (
                <div key={i} style={{ padding: '8px 12px', borderRadius: 8, background: T.bg4, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: T.text3, marginBottom: 4 }}>{s.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{s.v}/{s.m}</div>
                </div>
              ))}
            </div>
          </div>

          {signal.reason && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Analysis</div>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: T.text2 }}>{signal.reason}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { onWatch(signal); onClose(); }} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Star size={14} /> Watchlist</button>
            <button onClick={() => { onPortfolio(signal); onClose(); }} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: T.green, color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Plus size={14} /> Add Trade</button>
            <button onClick={() => { onJournal(signal, signal.signal); onClose(); }} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><FileText size={14} /> Journal</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ onClose, theme, setTheme, T }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{ background: T.bg3, borderRadius: 14, border: `1px solid ${T.border}`, width: 400 }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3 }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: T.text3, marginBottom: 8, display: 'block', fontWeight: 600 }}>Theme</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.keys(themes).map(t => (
                <button key={t} onClick={() => setTheme(t)} style={{
                  flex: 1, padding: '8px 12px', borderRadius: 6,
                  border: `1px solid ${theme === t ? T.accent : T.border}`,
                  background: theme === t ? `${T.accent}15` : 'transparent',
                  color: theme === t ? T.accent : T.text2, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  textTransform: 'capitalize',
                }}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TOAST SYSTEM ====================
function ToastContainer({ toasts, T }) {
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(toast => (
        <div key={toast.id} className="fade-in" style={{
          padding: '10px 16px', borderRadius: 8,
          background: toast.type === 'success' ? T.green : toast.type === 'warning' ? T.yellow : T.accent,
          color: 'white', fontSize: 12, fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
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

// ==================== REUSABLE COMPONENTS ====================
function Panel({ title, icon: Icon, color, T, children }) {
  return (
    <div style={{ background: T.bg3, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={14} color={color} />{title}</h3>
      </div>
      <div style={{ padding: '0 16px 16px' }}>{children}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, T, sub }) {
  return (
    <div style={{ background: T.bg3, borderRadius: 8, border: `1px solid ${T.border}`, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: T.text3, fontWeight: 500 }}>{label}</span>
        <Icon size={14} color={color} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: color, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>}
    </div>
  );
}

function SignalBadge({ signal, T }) {
  const isBuy = signal === 'BUY';
  return (
    <span style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700,
      background: isBuy ? `${T.green}15` : `${T.red}15`,
      color: isBuy ? T.green : T.red,
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {isBuy ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}{signal}
    </span>
  );
}

function ConfidenceBar({ value, T }) {
  const color = value >= 8 ? T.green : value >= 6 ? T.yellow : T.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: T.bg4, overflow: 'hidden' }}>
        <div style={{ width: `${value * 10}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, text, T }) {
  return (
    <div style={{ textAlign: 'center', padding: 32, color: T.text3 }}>
      <Icon size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
      <p style={{ fontSize: 12 }}>{text}</p>
    </div>
  );
}

function CalculatorIcon({ T }) {
  return <span style={{ color: T.accent }}>🧮</span>;
}
