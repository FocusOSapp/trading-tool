import React, { useState, useCallback, useRef, useEffect } from 'react';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyDbtYd2-MvGmAt9PI93uKZ1tgK7KNOsXwc';
const DATA_BASE = process.env.REACT_APP_DATA_URL || '';

// ==================== CHART ANALYZER VIEW ====================
export default function ChartAnalyzerView({ T, signals }) {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [stockSymbol, setStockSymbol] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [chartAnalysis, setChartAnalysis] = useState(null);
  const [fundamentals, setFundamentals] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [pasteActive, setPasteActive] = useState(false);
  const fileInputRef = useRef(null);

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e) => {
      if (!pasteActive) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          processImage(blob);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [pasteActive]);

  const processImage = (blob) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setImageBase64(e.target.result.split(',')[1]);
      setError(null);
    };
    reader.readAsDataURL(blob);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const analyzeChart = async () => {
    if (!imageBase64) {
      setError('Please upload or paste a chart image first');
      return;
    }
    setAnalyzing(true);
    setError(null);
    setChartAnalysis(null);

    try {
      const prompt = `You are an expert technical analyst and institutional trader. Analyze this stock chart image in detail.

Provide your analysis in the following JSON format:
{
  "stock_identified": "stock name or symbol if visible, or 'Unknown'",
  "timeframe": "detected timeframe (daily, weekly, intraday, etc.)",
  "trend": {
    "short_term": "bullish/bearish/sideways",
    "medium_term": "bullish/bearish/sideways",
    "long_term": "bullish/bearish/sideways",
    "description": "detailed trend analysis"
  },
  "patterns": [
    {
      "name": "pattern name (e.g., Head & Shoulders, Double Bottom, Triangle, Flag, Cup & Handle)",
      "type": "reversal/continuation/consolidation",
      "reliability": "high/medium/low",
      "description": "detailed description of the pattern"
    }
  ],
  "support_levels": [level1, level2, level3],
  "resistance_levels": [level1, level2, level3],
  "indicators_visible": {
    "moving_averages": "description of MA positioning",
    "volume": "volume analysis - expanding/contracting/divergence",
    "rsi": "RSI observation if visible",
    "macd": "MACD observation if visible",
    "bollinger_bands": "BB observation if visible"
  },
  "breakout_levels": {
    "bullish_breakout": "price level for bullish breakout",
    "bearish_breakdown": "price level for bearish breakdown"
  },
  "trade_setup": {
    "bias": "bullish/bearish/neutral",
    "confidence": "1-10",
    "entry_zone": "suggested entry price range",
    "stop_loss": "suggested stop loss level",
    "target_1": "first target",
    "target_2": "second target",
    "risk_reward": "1:X ratio"
  },
  "key_observations": [
    "observation 1",
    "observation 2",
    "observation 3",
    "observation 4",
    "observation 5"
  ],
  "risk_factors": ["risk factor 1", "risk factor 2"],
  "overall_verdict": "detailed summary of the chart analysis and recommended action"
}

Rules:
- Be specific with price levels visible on the chart
- Identify ALL visible patterns
- Analyze volume-price relationship
- Consider multiple timeframes if visible
- Think like institutional money
- Be objective - don't force a bullish/bearish bias
- Output ONLY valid JSON, no markdown, no explanation`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/png',
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
          }
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Gemini API error');
      }

      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse JSON from response
      if (text.includes('```json')) {
        text = text.split('```json')[1].split('```')[0].trim();
      } else if (text.includes('```')) {
        text = text.split('```')[1].split('```')[0].trim();
      }

      const analysis = JSON.parse(text);
      setChartAnalysis(analysis);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze chart. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchFundamentals = async () => {
    if (!stockSymbol.trim()) {
      setError('Enter a stock symbol to fetch fundamentals');
      return;
    }
    setAnalyzing(true);
    setError(null);
    setFundamentals(null);

    try {
      // Try to fetch from scan data first
      const scanRes = await fetch(`${DATA_BASE}/data/scan.json?t=${Date.now()}`);
      if (scanRes.ok) {
        const data = await scanRes.json();
        const signal = data.signals?.find(s =>
          s.symbol.toUpperCase().includes(stockSymbol.toUpperCase()) ||
          s.stock.toUpperCase().includes(stockSymbol.toUpperCase())
        );
        if (signal) {
          setFundamentals({
            symbol: signal.symbol,
            name: signal.stock,
            current_price: signal.current_price,
            technical_analysis: {
              entry: signal.entry,
              stop_loss: signal.stop_loss,
              targets: signal.targets,
              risk_reward: signal.risk_reward,
              confidence: signal.confidence,
              scores: {
                structure: signal.structure_score,
                volume: signal.volume_score,
                indicators: signal.indicator_score,
              }
            },
            indicators: signal.indicators || {},
            support_resistance: signal.support_resistance || {},
          });
          setAnalyzing(false);
          return;
        }
      }

      // Fallback: analyze via API
      const res = await fetch(`${DATA_BASE}/api/stock/${stockSymbol.toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        setFundamentals(data);
      } else {
        setError(`No data found for ${stockSymbol.toUpperCase()}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>📊 Chart Analyzer</h2>
        <p style={{ fontSize: 12, color: T.text3 }}>Paste or upload a chart screenshot. AI will identify patterns, trends, support/resistance, and trade setups. Powered by Gemini Vision.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upload Area */}
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? T.accent : T.border}`,
              borderRadius: 12,
              padding: image ? 8 : 40,
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? `${T.accent}08` : T.bg3,
              transition: 'all 0.2s',
              minHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: image ? 'flex-start' : 'center',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {image ? (
              <div style={{ width: '100%', position: 'relative' }}>
                <img src={image} alt="Chart" style={{ width: '100%', borderRadius: 8, maxHeight: 400, objectFit: 'contain' }} />
                <button
                  onClick={(e) => { e.stopPropagation(); setImage(null); setImageBase64(null); setChartAnalysis(null); }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                >✕</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Drop chart screenshot here</div>
                <div style={{ fontSize: 12, color: T.text3, marginBottom: 16 }}>or click to browse</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPasteActive(true); setTimeout(() => setPasteActive(false), 5000); }}
                    style={{ padding: '6px 16px', borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                  >
                    📋 Paste (Ctrl+V)
                  </button>
                </div>
                <div style={{ fontSize: 10, color: T.text3, marginTop: 8 }}>Supports: PNG, JPG, GIF, WebP</div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={analyzeChart}
              disabled={!imageBase64 || analyzing}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none',
                background: !imageBase64 || analyzing ? T.text3 : T.accent,
                color: 'white', cursor: !imageBase64 || analyzing ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {analyzing ? '⏳ Analyzing...' : '🔍 Analyze Chart'}
            </button>
          </div>

          {/* Stock Fundamentals */}
          <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>📋 Stock Fundamentals</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={stockSymbol}
                onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && fetchFundamentals()}
                placeholder="Enter symbol (e.g., TATASTEEL)"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 6,
                  border: `1px solid ${T.border}`, background: T.bg4,
                  color: T.text, fontSize: 12, outline: 'none',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
              <button
                onClick={fetchFundamentals}
                disabled={analyzing || !stockSymbol.trim()}
                style={{
                  padding: '8px 16px', borderRadius: 6, border: 'none',
                  background: !stockSymbol.trim() || analyzing ? T.text3 : T.purple,
                  color: 'white', cursor: !stockSymbol.trim() || analyzing ? 'not-allowed' : 'pointer',
                  fontSize: 12, fontWeight: 600,
                }}
              >
                Fetch
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        <div style={{ maxHeight: '80vh', overflow: 'auto' }}>
          {error && (
            <div style={{ padding: 16, borderRadius: 8, background: `${T.red}10`, border: `1px solid ${T.red}30`, marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: T.red, fontWeight: 600 }}>⚠️ {error}</div>
            </div>
          )}

          {/* Chart Analysis Results */}
          {chartAnalysis && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ padding: 16, borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}`, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>📊 Chart Analysis</h3>
                  <span style={{ fontSize: 11, color: T.text3 }}>{chartAnalysis.stock_identified} • {chartAnalysis.timeframe}</span>
                </div>

                {/* Trend */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Trend</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Short Term', value: chartAnalysis.trend?.short_term },
                      { label: 'Medium Term', value: chartAnalysis.trend?.medium_term },
                      { label: 'Long Term', value: chartAnalysis.trend?.long_term },
                    ].map((t, i) => (
                      <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: T.bg4, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: T.text3, marginBottom: 4 }}>{t.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: t.value === 'bullish' ? T.green : t.value === 'bearish' ? T.red : T.yellow, textTransform: 'capitalize' }}>{t.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Patterns */}
                {chartAnalysis.patterns?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Patterns Detected</div>
                    {chartAnalysis.patterns.map((p, i) => (
                      <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: T.bg4, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</span>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: p.reliability === 'high' ? `${T.green}15` : p.reliability === 'medium' ? `${T.yellow}15` : `${T.red}15`, color: p.reliability === 'high' ? T.green : p.reliability === 'medium' ? T.yellow : T.red, fontWeight: 600 }}>{p.reliability}</span>
                        </div>
                        <div style={{ fontSize: 11, color: T.text2 }}>{p.description}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Support/Resistance */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.green, fontWeight: 600, marginBottom: 4 }}>Support</div>
                    {chartAnalysis.support_levels?.map((l, i) => (
                      <div key={i} style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: T.text2, padding: '2px 0' }}>S{i + 1}: {l}</div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.red, fontWeight: 600, marginBottom: 4 }}>Resistance</div>
                    {chartAnalysis.resistance_levels?.map((l, i) => (
                      <div key={i} style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: T.text2, padding: '2px 0' }}>R{i + 1}: {l}</div>
                    ))}
                  </div>
                </div>

                {/* Trade Setup */}
                {chartAnalysis.trade_setup && (
                  <div style={{ padding: 12, borderRadius: 8, background: `${T.accent}08`, border: `1px solid ${T.accent}20`, marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: T.accent, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Trade Setup</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                      {[
                        { l: 'Bias', v: chartAnalysis.trade_setup.bias, c: chartAnalysis.trade_setup.bias === 'bullish' ? T.green : T.red },
                        { l: 'Confidence', v: `${chartAnalysis.trade_setup.confidence}/10` },
                        { l: 'Entry', v: chartAnalysis.trade_setup.entry_zone },
                        { l: 'Stop Loss', v: chartAnalysis.trade_setup.stop_loss, c: T.red },
                      ].map((b, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: T.text3, marginBottom: 2 }}>{b.l}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: b.c || T.text, fontFamily: "'JetBrains Mono', monospace", textTransform: 'capitalize' }}>{b.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
                      {[
                        { l: 'Target 1', v: chartAnalysis.trade_setup.target_1, c: T.green },
                        { l: 'Target 2', v: chartAnalysis.trade_setup.target_2, c: T.green },
                        { l: 'R:R', v: chartAnalysis.trade_setup.risk_reward, c: T.accent },
                      ].map((b, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: T.text3, marginBottom: 2 }}>{b.l}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: b.c, fontFamily: "'JetBrains Mono', monospace" }}>{b.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Observations */}
                {chartAnalysis.key_observations?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Key Observations</div>
                    {chartAnalysis.key_observations.map((obs, i) => (
                      <div key={i} style={{ fontSize: 11, color: T.text2, padding: '4px 0', paddingLeft: 12, borderLeft: `2px solid ${T.accent}30` }}>{obs}</div>
                    ))}
                  </div>
                )}

                {/* Risk Factors */}
                {chartAnalysis.risk_factors?.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: T.yellow, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>⚠️ Risk Factors</div>
                    {chartAnalysis.risk_factors.map((r, i) => (
                      <div key={i} style={{ fontSize: 11, color: T.yellow, padding: '4px 0', paddingLeft: 12, borderLeft: `2px solid ${T.yellow}30` }}>{r}</div>
                    ))}
                  </div>
                )}

                {/* Verdict */}
                {chartAnalysis.overall_verdict && (
                  <div style={{ padding: 12, borderRadius: 8, background: T.bg4 }}>
                    <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Overall Verdict</div>
                    <p style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>{chartAnalysis.overall_verdict}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fundamentals Results */}
          {fundamentals && (
            <div style={{ padding: 16, borderRadius: 10, background: T.bg3, border: `1px solid ${T.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📋 Fundamentals — {fundamentals.name || fundamentals.symbol}</h3>

              {fundamentals.current_price && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, borderRadius: 8, background: T.bg4 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>₹{fundamentals.current_price}</div>
                  {fundamentals.indicators?.day_change_pct && (
                    <div style={{ fontSize: 14, fontWeight: 600, color: fundamentals.indicators.day_change_pct >= 0 ? T.green : T.red }}>
                      {fundamentals.indicators.day_change_pct >= 0 ? '+' : ''}{fundamentals.indicators.day_change_pct}%
                    </div>
                  )}
                </div>
              )}

              {fundamentals.technical_analysis && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Technical Analysis</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { l: 'Entry', v: fundamentals.technical_analysis.entry },
                      { l: 'Stop Loss', v: fundamentals.technical_analysis.stop_loss, c: T.red },
                      { l: 'Target 1', v: fundamentals.technical_analysis.targets?.[0], c: T.green },
                      { l: 'Target 2', v: fundamentals.technical_analysis.targets?.[1], c: T.green },
                      { l: 'R:R', v: fundamentals.technical_analysis.risk_reward, c: T.accent },
                      { l: 'Confidence', v: `${fundamentals.technical_analysis.confidence}/10`, c: fundamentals.technical_analysis.confidence >= 8 ? T.green : T.yellow },
                    ].map((b, i) => (
                      <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: T.bg4 }}>
                        <div style={{ fontSize: 9, color: T.text3, marginBottom: 2 }}>{b.l}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: b.c || T.text, fontFamily: "'JetBrains Mono', monospace" }}>{b.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fundamentals.indicators && Object.keys(fundamentals.indicators).length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Indicators</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {Object.entries(fundamentals.indicators).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 4, background: T.bg4 }}>
                        <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: typeof v === 'boolean' ? (v ? T.green : T.red) : T.text }}>{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v?.toString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!chartAnalysis && !fundamentals && !error && (
            <div style={{ textAlign: 'center', padding: 40, color: T.text3 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Upload a chart to begin analysis</p>
              <p style={{ fontSize: 11 }}>AI will identify patterns, trends, support/resistance levels, and generate trade setups</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
