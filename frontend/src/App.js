import React, { useState, useEffect, useCallback } from 'react';
import { Activity, BarChart3, TrendingUp, Zap, Layers, Search, RefreshCw, ArrowUpRight, ArrowDownRight, Clock, Target, Shield, Eye, XCircle, Newspaper, Users, DollarSign } from 'lucide-react';

const DATA_BASE = process.env.REACT_APP_DATA_URL || '';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sectors, setSectors] = useState([]);
  const [signals, setSignals] = useState([]);
  const [status, setStatus] = useState({ total_scans: 0, last_scan: null });
  const [scanning, setScanning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [marketOverview, setMarketOverview] = useState({});
  const [news, setNews] = useState([]);
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [fiiDii, setFiiDii] = useState({});
  const [wsConnected, setWsConnected] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [scanRes, sectorsRes, signalsRes, overviewRes, newsRes] = await Promise.all([
        fetch(`${DATA_BASE}/data/scan.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/sectors.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/signals.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/overview.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
        fetch(`${DATA_BASE}/data/news.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null),
      ]);
      if (scanRes) {
        setStatus({ total_scans: scanRes.stocks_scanned || 0, last_scan: scanRes.timestamp });
        if (scanRes.signals) setSignals(scanRes.signals);
        if (scanRes.top_sectors) setSectors(scanRes.top_sectors);
        if (scanRes.market_overview) setMarketOverview(scanRes.market_overview);
      }
      if (sectorsRes) setSectors(sectorsRes.sectors || []);
      if (signalsRes) setSignals(signalsRes.signals || []);
      if (overviewRes) setMarketOverview(overviewRes);
      if (newsRes) setNews(newsRes.news || []);
      setLastUpdate(new Date());
    } catch (e) { console.error('Fetch error:', e); }
  }, []);

  const triggerScan = async () => {
    setScanning(true);
    // Trigger GitHub Actions workflow via repository dispatch
    try {
      await fetch('https://api.github.com/repos/FocusOSapp/trading-tool/dispatches', {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${process.env.REACT_APP_GITHUB_TOKEN || ''}`,
        },
        body: JSON.stringify({ event_type: 'manual_scan' }),
      });
    } catch (e) { console.log('Manual trigger unavailable'); }
    // Refresh data after delay (GitHub Actions takes ~2 min to complete)
    setTimeout(() => { fetchData(); setScanning(false); }, 120000);
  };

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 60000); return () => clearInterval(i); }, [fetchData]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'sectors', label: 'Sectors', icon: Layers },
    { id: 'signals', label: 'Signals', icon: Zap },
    { id: 'charts', label: 'Charts', icon: BarChart3 },
    { id: 'market', label: 'Market', icon: TrendingUp },
    { id: 'analyzer', label: 'Analyzer', icon: Search },
    { id: 'news', label: 'News', icon: Newspaper },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>Trading Pro</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 500 }}>AI INTELLIGENCE</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '8px' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', marginBottom: 2, border: 'none', borderRadius: 6, cursor: 'pointer', background: activeTab === tab.id ? 'var(--bg-hover)' : 'transparent', color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === tab.id ? 600 : 500, fontSize: 12, transition: 'all 0.15s' }}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: wsConnected ? 'var(--green)' : 'var(--red)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{wsConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 220 }}>
        <header style={{ height: 48, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 14, fontWeight: 700 }}>{tabs.find(t => t.id === activeTab)?.label}</h1>
            {lastUpdate && <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{lastUpdate.toLocaleTimeString()}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {marketOverview.nifty && (
              <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>NIFTY: <b style={{ color: marketOverview.nifty_change >= 0 ? 'var(--green)' : 'var(--red)' }}>{marketOverview.nifty} ({marketOverview.nifty_change >= 0 ? '+' : ''}{marketOverview.nifty_change}%)</b></span>
                {marketOverview.vix && <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>VIX: {marketOverview.vix}</span>}
              </div>
            )}
            <button onClick={triggerScan} disabled={scanning}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: scanning ? 'not-allowed' : 'pointer', background: scanning ? 'var(--text-muted)' : 'var(--accent)', color: 'white', fontWeight: 600, fontSize: 11, opacity: scanning ? 0.7 : 1 }}>
              <RefreshCw size={12} style={{ animation: scanning ? 'spin 1s linear infinite' : 'none' }} />
              {scanning ? 'Scanning...' : 'Run Scan'}
            </button>
          </div>
        </header>

        <div style={{ padding: 16 }}>
          {activeTab === 'dashboard' && <DashboardView sectors={sectors} signals={signals} status={status} marketOverview={marketOverview} onSignalClick={setSelectedSignal} />}
          {activeTab === 'sectors' && <SectorView sectors={sectors} />}
          {activeTab === 'signals' && <SignalsView signals={signals} onSignalClick={setSelectedSignal} />}
          {activeTab === 'charts' && <ChartsView />}
          {activeTab === 'market' && <MarketView gainers={gainers} losers={losers} fiiDii={fiiDii} marketOverview={marketOverview} />}
          {activeTab === 'analyzer' && <AnalyzerView />}
          {activeTab === 'news' && <NewsView news={news} />}
        </div>
      </main>

      {selectedSignal && <SignalModal signal={selectedSignal} onClose={() => setSelectedSignal(null)} />}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ==================== DASHBOARD ====================
function DashboardView({ sectors, signals, status, marketOverview, onSignalClick }) {
  return (
    <div className="fade-in">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard icon={Zap} label="Signals" value={signals.length} color="var(--accent)" />
        <StatCard icon={Layers} label="Sectors" value={sectors.length} color="var(--purple)" />
        <StatCard icon={BarChart3} label="Scans" value={status?.total_scans || 0} color="var(--cyan)" />
        <StatCard icon={TrendingUp} label="NIFTY" value={marketOverview.nifty ? `${marketOverview.nifty}` : '-'} color={marketOverview.nifty_change >= 0 ? 'var(--green)' : 'var(--red)'} />
        <StatCard icon={Shield} label="VIX" value={marketOverview.vix || '-'} color="var(--yellow)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Top Sectors */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Layers size={14} color="var(--purple)" />Top Sectors</h3>
          </div>
          <div style={{ padding: 6 }}>
            {sectors.slice(0, 5).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 6, background: i === 0 ? 'rgba(139,92,246,0.08)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 4, background: i === 0 ? 'var(--purple)' : i === 1 ? 'var(--accent)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>{i + 1}</span>
                  <div><div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Score: {s.score}/10</div></div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.change_pct >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>{s.change_pct >= 0 ? '+' : ''}{s.change_pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Signals */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={14} color="var(--yellow)" />Top Signals</h3>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{signals.length} total</span>
          </div>
          <div style={{ padding: 6 }}>
            {signals.slice(0, 5).map((sig, i) => (
              <div key={i} onClick={() => onSignalClick(sig)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: i === 0 ? 'rgba(245,158,11,0.08)' : 'transparent', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = i === 0 ? 'rgba(245,158,11,0.08)' : 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: sig.confidence >= 8 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: sig.confidence >= 8 ? 'var(--green)' : 'var(--yellow)', fontFamily: 'JetBrains Mono, monospace' }}>{sig.confidence}</div>
                  <div><div style={{ fontSize: 12, fontWeight: 600 }}>{sig.stock || sig.symbol}</div><div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{sig.sector}</div></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)' }}>{sig.risk_reward} R:R</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>T: {sig.targets?.[0]}</div>
                </div>
              </div>
            ))}
            {signals.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No signals yet. Run a scan.</div>}
          </div>
        </div>
      </div>

      {/* Signals Table */}
      {signals.length > 0 && (
        <div style={{ marginTop: 16, background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 12, fontWeight: 600 }}>All Signals</h3></div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Stock', 'Sector', 'Signal', 'Conf', 'Entry', 'SL', 'Targets', 'R:R'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {signals.map((sig, i) => (
                  <tr key={i} onClick={() => onSignalClick(sig)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{sig.stock || sig.symbol}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{sig.sector}</td>
                    <td style={{ padding: '8px 12px' }}><span style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: sig.signal === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: sig.signal === 'BUY' ? 'var(--green)' : 'var(--red)' }}>{sig.signal}</span></td>
                    <td style={{ padding: '8px 12px' }}><ConfidenceBar value={sig.confidence} /></td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{sig.entry}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--red)' }}>{sig.stop_loss}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{sig.targets?.map((t, j) => <span key={j} style={{ color: 'var(--green)' }}>{t}{j < (sig.targets?.length || 0) - 1 ? ', ' : ''}</span>)}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--green)' }}>{sig.risk_reward}</td>
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

// ==================== SECTOR VIEW ====================
function SectorView({ sectors }) {
  if (!sectors.length) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><Layers size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} /><p>No sector data. Run a scan.</p></div>;
  const maxScore = Math.max(...sectors.map(s => s.score), 1);
  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
      {sectors.map((s, i) => (
        <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 10, border: i < 3 ? '1px solid var(--purple)' : '1px solid var(--border)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: i === 0 ? 'var(--purple)' : i === 1 ? 'var(--accent)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white' }}>{i + 1}</span>
              <h3 style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</h3>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: s.change_pct >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>{s.change_pct >= 0 ? '+' : ''}{s.change_pct}%</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Score</span><span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{s.score}/10</span></div>
            <div style={{ height: 3, borderRadius: 2, background: 'var(--bg-hover)', overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 2, width: `${(s.score / maxScore) * 100}%`, background: 'linear-gradient(90deg, var(--purple), var(--accent))' }} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
            {[{ l: 'Momentum', v: s.momentum, m: 3, c: 'var(--accent)' }, { l: 'Volume', v: s.volume_expansion, m: 3, c: 'var(--cyan)' }, { l: 'Sentiment', v: s.sentiment, m: 2, c: 'var(--green)' }, { l: 'Rel Str', v: s.relative_strength, m: 2, c: 'var(--purple)' }].map((sub, j) => (
              <div key={j} style={{ padding: '4px 8px', borderRadius: 4, background: 'var(--bg-hover)' }}><div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{sub.l}</div><div style={{ fontSize: 11, fontWeight: 700, color: sub.c, fontFamily: 'JetBrains Mono, monospace' }}>{sub.v}/{sub.m}</div></div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{s.reason}</p>
        </div>
      ))}
    </div>
  );
}

// ==================== SIGNALS VIEW ====================
function SignalsView({ signals, onSignalClick }) {
  return (
    <div className="fade-in">
      {signals.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><Zap size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} /><p>No signals yet.</p></div> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {signals.map((sig, i) => (
            <div key={i} onClick={() => onSignalClick(sig)} style={{ background: 'var(--bg-card)', borderRadius: 10, border: sig.confidence >= 8 ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)', padding: 16, cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 8, background: `${sig.confidence >= 8 ? 'var(--green)' : 'var(--yellow)'}15`, border: `1px solid ${sig.confidence >= 8 ? 'var(--green)' : 'var(--yellow)'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: sig.confidence >= 8 ? 'var(--green)' : 'var(--yellow)', fontFamily: 'JetBrains Mono, monospace' }}>{sig.confidence}</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, background: sig.signal === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: sig.signal === 'BUY' ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: 3 }}>{sig.signal === 'BUY' ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}{sig.signal}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sig.sector}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>{sig.stock || sig.symbol}</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                {[{ l: 'Entry', v: sig.entry, c: 'var(--text-primary)' }, { l: 'SL', v: sig.stop_loss, c: 'var(--red)' }, { l: 'Target', v: sig.targets?.[0] || '-', c: 'var(--green)' }].map((b, j) => (
                  <div key={j} style={{ padding: '6px 8px', borderRadius: 6, background: 'var(--bg-hover)' }}><div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{b.l}</div><div style={{ fontSize: 11, fontWeight: 700, color: b.c, fontFamily: 'JetBrains Mono, monospace' }}>{b.v}</div></div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, background: 'var(--bg-hover)', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={12} color="var(--green)" /><span style={{ fontSize: 10, color: 'var(--text-muted)' }}>R:R</span></div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>{sig.risk_reward}</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sig.reason}</p>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ==================== CHARTS VIEW (TradingView Embedded) ====================
function ChartsView() {
  const [symbol, setSymbol] = useState('TATASTEEL');

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['TATASTEEL', 'SBIN', 'BSE', 'VEDL', 'EICHERMOT', 'RELIANCE', 'INFY', 'NIFTY'].map(s => (
          <button key={s} onClick={() => setSymbol(s)} style={{ padding: '6px 12px', borderRadius: 6, border: symbol === s ? '1px solid var(--accent)' : '1px solid var(--border)', background: symbol === s ? 'var(--accent)' : 'var(--bg-card)', color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{s}</button>
        ))}
      </div>
      <div style={{ height: 550, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <TradingViewWidget symbol={symbol} />
      </div>
    </div>
  );
}

function TradingViewWidget({ symbol }) {
  useEffect(() => {
    const container = document.getElementById(`tv-chart-${symbol}`);
    if (!container) return;
    container.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `NSE:${symbol}`,
      interval: 'D',
      timezone: 'Asia/Kolkata',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#1a1f2e',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies', 'BB@tv-basicstudies'],
      backgroundColor: '#0a0e17',
      gridColor: '#1a1f2e',
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      details: true,
      hotlist: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });
    container.appendChild(script);
  }, [symbol]);

  return <div id={`tv-chart-${symbol}`} className="tradingview-widget-container" style={{ height: '100%', width: '100%' }} />;
}

// ==================== MARKET VIEW ====================
function MarketView({ gainers, losers, fiiDii, marketOverview }) {
  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Top Gainers */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}><ArrowUpRight size={14} color="var(--green)" /><h3 style={{ fontSize: 12, fontWeight: 600 }}>Top Gainers</h3></div>
          <div style={{ padding: 6 }}>
            {gainers.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>Data unavailable (NSE API may be blocked)</div> :
              gainers.slice(0, 8).map((g, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 4 }}><span style={{ fontSize: 12, fontWeight: 600 }}>{g.symbol || g.identifier}</span><span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>{g.pChange || g.change_pct}</span></div>
              ))}
          </div>
        </div>
        {/* Top Losers */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}><ArrowDownRight size={14} color="var(--red)" /><h3 style={{ fontSize: 12, fontWeight: 600 }}>Top Losers</h3></div>
          <div style={{ padding: 6 }}>
            {losers.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>Data unavailable</div> :
              losers.slice(0, 8).map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 4 }}><span style={{ fontSize: 12, fontWeight: 600 }}>{l.symbol || l.identifier}</span><span style={{ fontSize: 12, color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>{l.pChange || l.change_pct}</span></div>
              ))}
          </div>
        </div>
      </div>

      {/* FII/DII Data */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
        <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} color="var(--cyan)" />FII / DII Activity</h3>
        {Object.keys(fiiDii).length === 0 ? <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>Data unavailable (NSE API may be blocked)</div> :
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-hover)', textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>FII Buy</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>{fiiDii.fii_buy ? `₹${fiiDii.fii_buy}Cr` : '-'}</div></div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-hover)', textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>FII Sell</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>{fiiDii.fii_sell ? `₹${fiiDii.fii_sell}Cr` : '-'}</div></div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-hover)', textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>DII Buy</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>{fiiDii.dii_buy ? `₹${fiiDii.dii_buy}Cr` : '-'}</div></div>
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-hover)', textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>DII Sell</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>{fiiDii.dii_sell ? `₹${fiiDii.dii_sell}Cr` : '-'}</div></div>
          </div>
        }
      </div>
    </div>
  );
}

// ==================== ANALYZER VIEW ====================
function AnalyzerView() {
  const [symbol, setSymbol] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    try {
      // For static deployment, we show a message that analysis requires server
      setResult({
        name: symbol.toUpperCase(),
        symbol: symbol.toUpperCase() + '.NS',
        indicators: null,
        signal: null,
        message: 'Stock analysis requires live data. Run the scanner via GitHub Actions or use the local backend.'
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 16, marginBottom: 16 }}>
        <h3 style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Search size={14} color="var(--accent)" />Analyze Any Stock</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={symbol} onChange={e => setSymbol(e.target.value)} onKeyDown={e => e.key === 'Enter' && analyze()} placeholder="NSE symbol (e.g., TATASTEEL, RELIANCE)"
            style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'JetBrains Mono, monospace' }} />
          <button onClick={analyze} disabled={loading || !symbol.trim()}
            style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading || !symbol.trim() ? 'var(--text-muted)' : 'var(--accent)', color: 'white', fontWeight: 600, fontSize: 12 }}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 12, fontWeight: 600 }}>Technical Indicators</h3></div>
            <div style={{ padding: 12 }}>
              {result.indicators ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {Object.entries(result.indicators).map(([k, v]) => (
                    <div key={k} style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--bg-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>{k.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: typeof v === 'boolean' ? (v ? 'var(--green)' : 'var(--red)') : 'var(--text-primary)' }}>{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v?.toString() || '-'}</span>
                    </div>
                  ))}
                </div>
              ) : <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No data</div>}
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 12, fontWeight: 600 }}>Trade Signal</h3></div>
            <div style={{ padding: 16 }}>
              {result.signal ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: result.signal.signal === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: result.signal.signal === 'BUY' ? 'var(--green)' : 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>{result.signal.confidence}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 700 }}>{result.signal.stock}</div><span style={{ padding: '2px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: result.signal.signal === 'BUY' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: result.signal.signal === 'BUY' ? 'var(--green)' : 'var(--red)' }}>{result.signal.signal}</span></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[{ l: 'Entry', v: result.signal.entry }, { l: 'SL', v: result.signal.stop_loss, c: 'var(--red)' }, { l: 'T1', v: result.signal.targets?.[0], c: 'var(--green)' }, { l: 'T2', v: result.signal.targets?.[1], c: 'var(--green)' }].map((b, i) => (
                      <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--bg-hover)' }}><div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{b.l}</div><div style={{ fontSize: 13, fontWeight: 700, color: b.c || 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{b.v || '-'}</div></div>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{result.signal.reason}</p>
                </div>
              ) : <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No signal generated</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== NEWS VIEW ====================
function NewsView({ news }) {
  return (
    <div className="fade-in">
      {news.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}><Newspaper size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} /><p>No news available</p></div> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {news.map((n, i) => (
            <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 16, textDecoration: 'none', color: 'inherit', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 600, background: n.sentiment === 'positive' ? 'rgba(16,185,129,0.15)' : n.sentiment === 'negative' ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)', color: n.sentiment === 'positive' ? 'var(--green)' : n.sentiment === 'negative' ? 'var(--red)' : 'var(--text-muted)' }}>{n.sentiment}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{n.source}</span>
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, marginBottom: 6 }}>{n.title}</h4>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{n.published_at ? new Date(n.published_at).toLocaleDateString() : ''}</div>
            </a>
          ))}
        </div>
      }
    </div>
  );
}

// ==================== MODAL ====================
function SignalModal({ signal, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', width: 460, maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: signal.confidence >= 8 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: signal.confidence >= 8 ? 'var(--green)' : 'var(--yellow)', fontFamily: 'JetBrains Mono, monospace' }}>{signal.confidence}</div>
            <div><h2 style={{ fontSize: 16, fontWeight: 700 }}>{signal.stock || signal.symbol}</h2><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{signal.sector}</span></div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><XCircle size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[{ l: 'Signal', v: signal.signal, c: signal.signal === 'BUY' ? 'var(--green)' : 'var(--red)' }, { l: 'R:R', v: signal.risk_reward, c: 'var(--green)' }, { l: 'Entry', v: signal.entry }, { l: 'Stop Loss', v: signal.stop_loss, c: 'var(--red)' }].map((b, i) => (
              <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--bg-hover)' }}><div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase' }}>{b.l}</div><div style={{ fontSize: 13, fontWeight: 700, color: b.c || 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{b.v}</div></div>
            ))}
          </div>
          {signal.targets && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Targets</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {signal.targets.map((t, i) => (
                  <div key={i} style={{ flex: 1, padding: '8px 12px', borderRadius: 6, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>Target {i + 1}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>{t}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Score Breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[{ l: 'Structure', v: signal.structure_score, m: 3 }, { l: 'Volume', v: signal.volume_score, m: 3 }, { l: 'Indicators', v: signal.indicator_score, m: 2 }, { l: 'Sentiment', v: signal.sentiment_score, m: 2 }].map((s, i) => (
                <div key={i} style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--bg-hover)', textAlign: 'center' }}><div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{s.l}</div><div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{s.v}/{s.m}</div></div>
              ))}
            </div>
          </div>
          {signal.reason && <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{signal.reason}</p>}
        </div>
      </div>
    </div>
  );
}

// ==================== HELPERS ====================
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span><Icon size={14} color={color} /></div>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color }}>{value}</div>
    </div>
  );
}

function ConfidenceBar({ value }) {
  const color = value >= 8 ? 'var(--green)' : value >= 6 ? 'var(--yellow)' : 'var(--red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--bg-hover)', overflow: 'hidden' }}><div style={{ width: `${value * 10}%`, height: '100%', background: color, borderRadius: 2 }} /></div>
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
    </div>
  );
}
