import React, { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Plus, X, Calendar, DollarSign, Percent,
  Target, ArrowUpRight, ArrowDownRight, BarChart2, Activity,
  Award, AlertTriangle, CheckCircle, PieChart, Hash,
  FileText, Trash2, Edit3, Save, Download, Upload, Filter,
  Search, ChevronDown, ChevronUp, Eye, EyeOff, Copy, ExternalLink,
  Zap, Shield, Clock, Info, HelpCircle, Settings, RefreshCw,
  ArrowLeft, ArrowRight, SkipBack, SkipForward,
} from 'lucide-react';

// ==================== TRADE JOURNAL COMPONENT ====================
export default function TradeJournal({ T, signals }) {
  // Starting capital
  const [startingCapital, setStartingCapital] = useState(() => {
    const saved = localStorage.getItem('trading_pro_starting_capital');
    return saved ? parseFloat(saved) : 100000;
  });
  const [editingCapital, setEditingCapital] = useState(false);
  const [capitalInput, setCapitalInput] = useState(startingCapital.toString());

  // Trades
  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('trading_pro_trades');
    return saved ? JSON.parse(saved) : [];
  });

  // UI State
  const [showNewTrade, setShowNewTrade] = useState(false);
  const [filter, setFilter] = useState('all'); // all, open, closed, long, short, win, loss
  const [sortBy, setSortBy] = useState('date'); // date, pnl, confidence
  const [searchQuery, setSearchQuery] = useState('');

  // Save to localStorage
  const saveTrades = useCallback((newTrades) => {
    setTrades(newTrades);
    localStorage.setItem('trading_pro_trades', JSON.stringify(newTrades));
  }, []);

  const saveCapital = useCallback((cap) => {
    setStartingCapital(cap);
    localStorage.setItem('trading_pro_starting_capital', cap.toString());
  }, []);

  // Add new trade
  const addTrade = (tradeData) => {
    const newTrade = {
      id: Date.now().toString(),
      ...tradeData,
      entryPrice: parseFloat(tradeData.entryPrice),
      quantity: parseInt(tradeData.quantity),
      fees: parseFloat(tradeData.fees) || 0,
      slippage: parseFloat(tradeData.slippage) || 0,
      entryDate: tradeData.entryDate || new Date().toISOString(),
      exitDate: tradeData.exitDate || null,
      exitPrice: tradeData.exitPrice ? parseFloat(tradeData.exitPrice) : null,
      status: tradeData.exitPrice ? 'closed' : 'open',
      pnl: 0,
      pnlPercent: 0,
      notes: tradeData.notes || '',
    };

    // Calculate P&L if closed
    if (newTrade.status === 'closed') {
      newTrade.pnl = calculatePnL(newTrade);
      newTrade.pnlPercent = calculatePnLPercent(newTrade);
    }

    saveTrades([newTrade, ...trades]);
    setShowNewTrade(false);
  };

  // Update trade (close or edit)
  const updateTrade = (id, updates) => {
    const updated = trades.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };
      if (updates.exitPrice) {
        updated.exitPrice = parseFloat(updates.exitPrice);
        updated.status = 'closed';
        updated.exitDate = updates.exitDate || new Date().toISOString();
        updated.pnl = calculatePnL(updated);
        updated.pnlPercent = calculatePnLPercent(updated);
      }
      return updated;
    });
    saveTrades(updated);
  };

  // Delete trade
  const deleteTrade = (id) => {
    saveTrades(trades.filter(t => t.id !== id));
  };

  // ==================== P&L CALCULATIONS ====================
  function calculatePnL(trade) {
    if (!trade.exitPrice) return 0;
    const direction = trade.type === 'long' ? 1 : -1;
    const grossPnL = (trade.exitPrice - trade.entryPrice) * trade.quantity * direction;
    const totalCosts = trade.fees + trade.slippage * trade.quantity;
    return grossPnL - totalCosts;
  }

  function calculatePnLPercent(trade) {
    if (!trade.exitPrice || !trade.entryPrice) return 0;
    const invested = trade.entryPrice * trade.quantity;
    if (invested === 0) return 0;
    return (calculatePnL(trade) / invested) * 100;
  }

  // ==================== PERFORMANCE METRICS ====================
  const metrics = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const openTrades = trades.filter(t => t.status === 'open');
    const winningTrades = closedTrades.filter(t => t.pnl > 0);
    const losingTrades = closedTrades.filter(t => t.pnl <= 0);

    // Realized P&L
    const realizedPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const realizedPnLPercent = startingCapital > 0 ? (realizedPnL / startingCapital) * 100 : 0;

    // Current capital
    const currentCapital = startingCapital + realizedPnL;

    // Unrealized P&L (for open positions)
    const unrealizedPnL = openTrades.reduce((sum, t) => {
      // For open trades, we estimate based on current market price if available
      // For now, assume 0 until closed
      return sum;
    }, 0);

    // Total P&L
    const totalPnL = realizedPnL + unrealizedPnL;
    const totalReturn = startingCapital > 0 ? (totalPnL / startingCapital) * 100 : 0;

    // Win rate
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

    // Profit factor
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    // Average win/loss
    const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
    const avgTrade = closedTrades.length > 0 ? realizedPnL / closedTrades.length : 0;

    // Best/Worst trade
    const bestTrade = closedTrades.length > 0 ? Math.max(...closedTrades.map(t => t.pnl)) : 0;
    const worstTrade = closedTrades.length > 0 ? Math.min(...closedTrades.map(t => t.pnl)) : 0;

    // Max drawdown (simplified)
    let peak = startingCapital;
    let maxDrawdown = 0;
    let runningCapital = startingCapital;
    const sortedTrades = [...closedTrades].sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));
    for (const trade of sortedTrades) {
      runningCapital += trade.pnl;
      if (runningCapital > peak) peak = runningCapital;
      const drawdown = ((peak - runningCapital) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Consecutive wins/losses
    let maxConsecutiveWins = 0, maxConsecutiveLosses = 0;
    let currentWins = 0, currentLosses = 0;
    for (const trade of sortedTrades) {
      if (trade.pnl > 0) {
        currentWins++;
        currentLosses = 0;
        if (currentWins > maxConsecutiveWins) maxConsecutiveWins = currentWins;
      } else {
        currentLosses++;
        currentWins = 0;
        if (currentLosses > maxConsecutiveLosses) maxConsecutiveLosses = currentLosses;
      }
    }

    // Long vs Short performance
    const longTrades = closedTrades.filter(t => t.type === 'long');
    const shortTrades = closedTrades.filter(t => t.type === 'short');
    const longPnL = longTrades.reduce((sum, t) => sum + t.pnl, 0);
    const shortPnL = shortTrades.reduce((sum, t) => sum + t.pnl, 0);
    const longWinRate = longTrades.length > 0 ? (longTrades.filter(t => t.pnl > 0).length / longTrades.length) * 100 : 0;
    const shortWinRate = shortTrades.length > 0 ? (shortTrades.filter(t => t.pnl > 0).length / shortTrades.length) * 100 : 0;

    return {
      realizedPnL,
      realizedPnLPercent,
      currentCapital,
      unrealizedPnL,
      totalPnL,
      totalReturn,
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      avgTrade,
      bestTrade,
      worstTrade,
      maxDrawdown,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      totalTrades: closedTrades.length,
      openTrades: openTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      longPnL,
      shortPnL,
      longWinRate,
      shortWinRate,
      longTrades: longTrades.length,
      shortTrades: shortTrades.length,
    };
  }, [trades, startingCapital]);

  // Filtered and sorted trades
  const filteredTrades = useMemo(() => {
    let result = [...trades];

    // Filter
    if (filter === 'open') result = result.filter(t => t.status === 'open');
    else if (filter === 'closed') result = result.filter(t => t.status === 'closed');
    else if (filter === 'long') result = result.filter(t => t.type === 'long');
    else if (filter === 'short') result = result.filter(t => t.type === 'short');
    else if (filter === 'win') result = result.filter(t => t.pnl > 0);
    else if (filter === 'loss') result = result.filter(t => t.pnl <= 0 && t.status === 'closed');

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.symbol.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'date') result.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate));
    else if (sortBy === 'pnl') result.sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
    else if (sortBy === 'confidence') result.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    return result;
  }, [trades, filter, sortBy, searchQuery]);

  // Save capital
  const handleSaveCapital = () => {
    const cap = parseFloat(capitalInput);
    if (cap > 0) {
      saveCapital(cap);
      setEditingCapital(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Trade Journal</h2>
          <p style={{ fontSize: 12, color: T.text4 }}>Track your trades, calculate P&L, and analyze performance</p>
        </div>
        <button onClick={() => setShowNewTrade(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: T.green, color: 'white', cursor: 'pointer',
          fontSize: 12, fontWeight: 600,
        }}>
          <Plus size={14} /> Log Trade
        </button>
      </div>

      {/* Starting Capital */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}`, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DollarSign size={18} color={T.accent} />
          <span style={{ fontSize: 12, color: T.text4, fontWeight: 600 }}>Starting Capital</span>
        </div>
        {editingCapital ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: T.text3 }}>₹</span>
            <input
              type="number"
              value={capitalInput}
              onChange={e => setCapitalInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveCapital()}
              style={{ width: 120, padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 14, fontWeight: 700, outline: 'none', fontFamily: "'JetBrains Mono', monospace" }}
            />
            <button onClick={handleSaveCapital} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: T.green, color: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Save</button>
            <button onClick={() => { setEditingCapital(false); setCapitalInput(startingCapital.toString()); }} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 11 }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: T.text, fontFamily: "'JetBrains Mono', monospace" }}>₹{startingCapital.toLocaleString()}</span>
            <button onClick={() => setEditingCapital(true)} style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${T.border}`, background: 'transparent', color: T.text4, cursor: 'pointer', fontSize: 10 }}>Edit</button>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
        <MetricCard label="Current Capital" value={`₹${metrics.currentCapital.toLocaleString()}`} color={metrics.currentCapital >= startingCapital ? T.green : T.red} T={T} />
        <MetricCard label="Realized P&L" value={`₹${metrics.realizedPnL.toLocaleString()}`} color={metrics.realizedPnL >= 0 ? T.green : T.red} T={T} sub={`${metrics.realizedPnLPercent >= 0 ? '+' : ''}${metrics.realizedPnLPercent.toFixed(2)}%`} />
        <MetricCard label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} color={metrics.winRate >= 50 ? T.green : T.red} T={T} sub={`${metrics.winningTrades}W / ${metrics.losingTrades}L`} />
        <MetricCard label="Profit Factor" value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)} color={metrics.profitFactor >= 1.5 ? T.green : metrics.profitFactor >= 1 ? T.yellow : T.red} T={T} />
        <MetricCard label="Max Drawdown" value={`${metrics.maxDrawdown.toFixed(2)}%`} color={T.red} T={T} sub={`Best: ₹${metrics.bestTrade.toFixed(0)}`} />
        <MetricCard label="Total Trades" value={metrics.totalTrades} color={T.accent} T={T} sub={`${metrics.openTrades} open`} />
      </div>

      {/* Extended Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <MetricCard label="Avg Win" value={`₹${metrics.avgWin.toFixed(0)}`} color={T.green} T={T} />
        <MetricCard label="Avg Loss" value={`₹${metrics.avgLoss.toFixed(0)}`} color={T.red} T={T} />
        <MetricCard label="Avg Trade" value={`₹${metrics.avgTrade.toFixed(0)}`} color={metrics.avgTrade >= 0 ? T.green : T.red} T={T} />
        <MetricCard label="Consecutive W/L" value={`${metrics.maxConsecutiveWins}W / ${metrics.maxConsecutiveLosses}L`} color={T.yellow} T={T} />
      </div>

      {/* Long vs Short Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: 14, borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ArrowUpRight size={16} color={T.green} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.text2 }}>Long Trades</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div><div style={{ fontSize: 9, color: T.text4 }}>P&L</div><div style={{ fontSize: 14, fontWeight: 700, color: metrics.longPnL >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>₹{metrics.longPnL.toFixed(0)}</div></div>
            <div><div style={{ fontSize: 9, color: T.text4 }}>Win Rate</div><div style={{ fontSize: 14, fontWeight: 700, color: metrics.longWinRate >= 50 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>{metrics.longWinRate.toFixed(1)}%</div></div>
            <div><div style={{ fontSize: 9, color: T.text4 }}>Count</div><div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono', monospace" }}>{metrics.longTrades}</div></div>
          </div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <ArrowDownRight size={16} color={T.red} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.text2 }}>Short Trades</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div><div style={{ fontSize: 9, color: T.text4 }}>P&L</div><div style={{ fontSize: 14, fontWeight: 700, color: metrics.shortPnL >= 0 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>₹{metrics.shortPnL.toFixed(0)}</div></div>
            <div><div style={{ fontSize: 9, color: T.text4 }}>Win Rate</div><div style={{ fontSize: 14, fontWeight: 700, color: metrics.shortWinRate >= 50 ? T.green : T.red, fontFamily: "'JetBrains Mono', monospace" }}>{metrics.shortWinRate.toFixed(1)}%</div></div>
            <div><div style={{ fontSize: 9, color: T.text4 }}>Count</div><div style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: "'JetBrains Mono', monospace" }}>{metrics.shortTrades}</div></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'open', label: 'Open' },
            { id: 'closed', label: 'Closed' },
            { id: 'long', label: 'Long' },
            { id: 'short', label: 'Short' },
            { id: 'win', label: 'Winners' },
            { id: 'loss', label: 'Losers' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '6px 12px', borderRadius: 6, border: `1px solid ${filter === f.id ? T.accent : T.border}`,
              background: filter === f.id ? `${T.accent}12` : 'transparent',
              color: filter === f.id ? T.accent : T.text3, cursor: 'pointer', fontSize: 11, fontWeight: 600,
            }}>{f.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search trades..."
            style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg3, color: T.text, fontSize: 11, outline: 'none', width: 150 }}
          />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg3, color: T.text3, fontSize: 11, cursor: 'pointer' }}>
            <option value="date">Sort: Date</option>
            <option value="pnl">Sort: P&L</option>
            <option value="confidence">Sort: Confidence</option>
          </select>
        </div>
      </div>

      {/* Trades Table */}
      <div style={{ background: T.bg3, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Date', 'Symbol', 'Type', 'Entry', 'Exit', 'Qty', 'P&L', 'P&L %', 'Fees', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: T.text4, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTrades.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: 40, textAlign: 'center', color: T.text4 }}>
                  {trades.length === 0 ? 'No trades logged yet. Click "Log Trade" to start.' : 'No trades match the current filter.'}
                </td></tr>
              ) : filteredTrades.map(trade => (
                <TradeRow key={trade.id} trade={trade} T={T} onClose={updateTrade} onDelete={deleteTrade} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Trade Modal */}
      {showNewTrade && <NewTradeModal onClose={() => setShowNewTrade(false)} onSubmit={addTrade} T={T} signals={signals} />}
    </div>
  );
}

// ==================== METRIC CARD ====================
function MetricCard({ label, value, color, T, sub }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10, color: T.text4, marginBottom: 4, fontWeight: 600, letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.text4, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ==================== TRADE ROW ====================
function TradeRow({ trade, T, onClose, onDelete }) {
  const [showClose, setShowClose] = useState(false);
  const [exitPrice, setExitPrice] = useState('');

  const pnlColor = trade.status === 'closed' ? (trade.pnl >= 0 ? T.green : T.red) : T.text4;

  return (
    <>
      <tr style={{ borderBottom: `1px solid ${T.border}15`, transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = T.bg4}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.text3 }}>
          {new Date(trade.entryDate).toLocaleDateString()}
        </td>
        <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 13 }}>{trade.symbol}</td>
        <td style={{ padding: '10px 12px' }}>
          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
            background: trade.type === 'long' ? T.greenBg : T.redBg,
            color: trade.type === 'long' ? T.green : T.red,
            border: `1px solid ${trade.type === 'long' ? T.greenDim : T.redDim}30`,
          }}>
            {trade.type === 'long' ? <ArrowUpRight size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} /> : <ArrowDownRight size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />}
            {trade.type.toUpperCase()}
          </span>
        </td>
        <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>₹{trade.entryPrice}</td>
        <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: trade.status === 'closed' ? T.text : T.text4 }}>
          {trade.status === 'closed' ? `₹${trade.exitPrice}` : '—'}
        </td>
        <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{trade.quantity}</td>
        <td style={{ padding: '10px 12px', fontWeight: 700, color: pnlColor, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          {trade.status === 'closed' ? `₹${trade.pnl.toFixed(0)}` : '—'}
        </td>
        <td style={{ padding: '10px 12px', fontWeight: 600, color: pnlColor, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
          {trade.status === 'closed' ? `${trade.pnlPercent >= 0 ? '+' : ''}${trade.pnlPercent.toFixed(2)}%` : '—'}
        </td>
        <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.text4 }}>₹{trade.fees}</td>
        <td style={{ padding: '10px 12px' }}>
          <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
            background: trade.status === 'closed' ? `${T.text4}15` : T.yellowBg,
            color: trade.status === 'closed' ? T.text4 : T.yellow,
          }}>
            {trade.status.toUpperCase()}
          </span>
        </td>
        <td style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {trade.status === 'open' && (
              <button onClick={() => setShowClose(true)} style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${T.green}`, background: 'transparent', color: T.green, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>Close</button>
            )}
            <button onClick={() => onDelete(trade.id)} style={{ padding: 4, borderRadius: 4, border: 'none', background: 'transparent', color: T.text4, cursor: 'pointer' }}><Trash2 size={12} /></button>
          </div>
        </td>
      </tr>

      {/* Close Trade Modal */}
      {showClose && (
        <div onClick={() => setShowClose(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} className="scale-in" style={{ background: T.bg3, borderRadius: 12, border: `1px solid ${T.border}`, width: 360, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Close Trade — {trade.symbol}</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: T.text4, marginBottom: 4, display: 'block', fontWeight: 600 }}>Exit Price (₹)</label>
              <input type="number" value={exitPrice} onChange={e => setExitPrice(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 14, fontWeight: 700, outline: 'none', fontFamily: "'JetBrains Mono', monospace" }}
                placeholder="Enter exit price" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { if (exitPrice) { onClose(trade.id, { exitPrice }); setShowClose(false); } }} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: T.green, color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Confirm Close</button>
              <button onClick={() => setShowClose(false)} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== NEW TRADE MODAL ====================
function NewTradeModal({ onClose, onSubmit, T, signals }) {
  const [form, setForm] = useState({
    symbol: '',
    type: 'long',
    entryPrice: '',
    quantity: '',
    fees: '0',
    slippage: '0',
    entryDate: new Date().toISOString().slice(0, 10),
    exitPrice: '',
    exitDate: '',
    notes: '',
    confidence: '',
    setup: '',
  });

  const handleSubmit = () => {
    if (!form.symbol || !form.entryPrice || !form.quantity) return;
    onSubmit(form);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="scale-in" style={{ background: T.bg3, borderRadius: 14, border: `1px solid ${T.border}`, width: 520, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Log New Trade</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: T.text4, marginBottom: 4, display: 'block', fontWeight: 600 }}>Symbol *</label>
              <input type="text" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 13, outline: 'none', fontFamily: "'JetBrains Mono', monospace" }}
                placeholder="e.g., TATASTEEL" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.text4, marginBottom: 4, display: 'block', fontWeight: 600 }}>Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 13, outline: 'none' }}>
                <option value="long">Long (Buy)</option>
                <option value="short">Short (Sell)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.text4, marginBottom: 4, display: 'block', fontWeight: 600 }}>Entry Price (₹) *</label>
              <input type="number" value={form.entryPrice} onChange={e => setForm({ ...form, entryPrice: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 13, outline: 'none', fontFamily: "'JetBrains Mono', monospace" }}
                placeholder="0.00" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.text4, marginBottom: 4, display: 'block', fontWeight: 600 }}>Quantity *</label>
              <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 13, outline: 'none', fontFamily: "'JetBrains Mono', monospace" }}
                placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.text4, marginBottom: 4, display: 'block', fontWeight: 600 }}>Fees (₹)</label>
              <input type="number" value={form.fees} onChange={e => setForm({ ...form, fees: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 13, outline: 'none', fontFamily: "'JetBrains Mono', monospace" }}
                placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.text4, marginBottom: 4, display: 'block', fontWeight: 600 }}>Slippage (₹/share)</label>
              <input type="number" value={form.slippage} onChange={e => setForm({ ...form, slippage: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 13, outline: 'none', fontFamily: "'JetBrains Mono', monospace" }}
                placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.text4, marginBottom: 4, display: 'block', fontWeight: 600 }}>Entry Date</label>
              <input type="date" value={form.entryDate} onChange={e => setForm({ ...form, entryDate: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 13, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: T.text4, marginBottom: 4, display: 'block', fontWeight: 600 }}>Confidence (1-10)</label>
              <input type="number" min="1" max="10" value={form.confidence} onChange={e => setForm({ ...form, confidence: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 13, outline: 'none', fontFamily: "'JetBrains Mono', monospace" }}
                placeholder="Optional" />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: T.text4, marginBottom: 4, display: 'block', fontWeight: 600 }}>Notes / Setup</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg4, color: T.text, fontSize: 12, outline: 'none', minHeight: 60, resize: 'vertical' }}
              placeholder="Why did you take this trade? What was the setup?" />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSubmit} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: 'none', background: T.green, color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Save size={14} /> Log Trade
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
