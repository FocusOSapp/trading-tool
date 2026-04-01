# Trading Pro - AI Intelligence System

Autonomous trading intelligence platform with real-time market scanning, multi-source data aggregation, embedded TradingView charts, and cloud deployment.

## Live Demo
- **Backend API**: http://localhost:10000
- **Frontend Dashboard**: http://localhost:3001

## Architecture

```
trading-pro/
├── backend/                          # FastAPI Python server
│   ├── app/
│   │   ├── engines/
│   │   │   ├── market_data.py        # yfinance + NSE India + Moneycontrol
│   │   │   ├── sector_intelligence.py # Sector scoring engine
│   │   │   ├── scanner.py            # Stock scanner + signal generator
│   │   │   └── news_sentiment.py     # Google News + Moneycontrol + NewsAPI
│   │   ├── api/
│   │   │   └── routes.py             # REST API endpoints
│   │   ├── websocket/
│   │   │   └── manager.py            # WebSocket real-time updates
│   │   ├── core/
│   │   │   ├── state.py              # In-memory state management
│   │   │   └── scheduler.py          # Auto-scan scheduler
│   │   ├── config.py                 # Configuration + stock lists
│   │   ├── models.py                 # Pydantic models
│   │   └── main.py                   # FastAPI app entry
│   ├── requirements.txt
│   └── run.py
├── frontend/                         # React dashboard
│   ├── src/
│   │   ├── App.js                    # Main app with 7 views
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── Dockerfile                        # Docker deployment
├── docker-compose.yml                # Docker Compose
├── render.yaml                       # Render cloud deployment
└── .gitignore
```

## Features

### Data Sources (All Free)
1. **Yahoo Finance** - Stock prices, sector indices, company info
2. **NSE India API** - Top gainers/losers, FII/DII data
3. **Moneycontrol** - News scraping, market data
4. **Google News RSS** - Stock-specific sentiment (no API key)
5. **NewsAPI.org** - Additional news (optional API key)

### Technical Analysis
- 20+ indicators: RSI, MACD, EMA (20/50/200), Bollinger Bands, ADX, ATR, VWAP, Stochastic
- Support/resistance detection
- Volume expansion analysis
- Multi-timeframe scoring

### Dashboard Views
1. **Dashboard** - Overview with stats, top sectors, top signals, signals table
2. **Sectors** - Ranked sector analysis with score breakdowns
3. **Signals** - Trade signal cards with entry/SL/targets/R:R
4. **Charts** - Embedded TradingView advanced charts with indicators
5. **Market** - Top gainers/losers, FII/DII activity, market overview
6. **Analyzer** - Analyze any NSE stock on demand
7. **News** - Sentiment-tagged market news from multiple sources

## Quick Start

### Option 1: Local (Recommended for development)

```bash
# Backend
cd trading-pro/backend
pip3 install --break-system-packages -r requirements.txt
python3 run.py
# Server runs at http://localhost:10000

# Frontend (new terminal)
cd trading-pro/frontend
npm install
npm start
# Dashboard at http://localhost:3001
```

### Option 2: Docker

```bash
cd trading-pro
docker-compose up --build
# Backend: http://localhost:10000
```

### Option 3: Cloud (Render - Free Tier)

1. Push repo to GitHub
2. Go to https://render.com
3. New Web Service → Connect repo
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables from `.env.example`
7. Deploy!

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/status` | System status |
| GET | `/api/sectors` | Latest sector analysis |
| GET | `/api/signals` | All signals |
| GET | `/api/signals/recent?limit=10` | Recent signals |
| POST | `/api/scan/trigger` | Trigger manual scan |
| GET | `/api/stock/{SYMBOL}` | Analyze single stock |
| GET | `/api/market/overview` | NIFTY, Sensex, VIX data |
| GET | `/api/market/gainers` | Top gainers |
| GET | `/api/market/losers` | Top losers |
| GET | `/api/market/fii-dii` | FII/DII activity |
| GET | `/api/news` | Market news with sentiment |
| GET | `/api/watchlist` | Configured watchlist |
| WS | `/ws` | WebSocket for real-time updates |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini AI (optional) | Falls back to rule-based |
| `NEWS_API_KEY` | NewsAPI.org key (optional) | Uses Google News RSS |
| `PORT` | Server port | 10000 |
| `SCAN_INTERVAL_MINUTES` | Auto-scan interval | 15 |
| `MAX_STOCKS_PER_SCAN` | Max stocks per scan | 40 |
| `MIN_CONFIDENCE_FOR_SIGNAL` | Min confidence threshold | 7 |

## How It Works

1. **Sector Intelligence** - Scores 11 NSE sector indices on momentum (0-3), volume expansion (0-3), sentiment (0-2), relative strength vs Nifty (0-2)
2. **Hot Stock Selection** - Pulls stocks from top 3 sectors + momentum watchlist
3. **Technical Scanning** - Computes 20+ indicators per stock, scores structure (0-3), volume (0-3), indicators (0-2), sentiment (0-2)
4. **Signal Generation** - Only outputs BUY signals with confidence >= 7 AND risk:reward >= 1:2
5. **Auto-Scanning** - Runs every 15 minutes, pushes results via WebSocket
6. **Real-time Dashboard** - React app with live updates, TradingView charts, market data

## Scoring System

### Sector Scoring (out of 10)
- **Momentum** (0-3): Based on % change vs Nifty
- **Volume Expansion** (0-3): Volume ratio vs average
- **Sentiment** (0-2): Positive/negative price action
- **Relative Strength** (0-2): Outperformance vs Nifty

### Stock Scoring (out of 10)
- **Structure** (0-3): EMA positioning, trend alignment, proximity to resistance
- **Volume** (0-3): Volume expansion + price confirmation
- **Indicators** (0-2): RSI zone, MACD crossover, ADX strength
- **Sentiment** (0-2): News sentiment score

## Free Data Sources Used

| Source | Data | API Key Required? |
|--------|------|-------------------|
| Yahoo Finance | Prices, indicators, sector indices | No |
| NSE India | Gainers/losers, FII/DII | No |
| Google News RSS | Stock sentiment | No |
| Moneycontrol | News, market data | No |
| NewsAPI.org | Additional news | Optional |
| TradingView | Embedded charts | No |

## Production Notes

- Uses `html.parser` for BeautifulSoup (no xml parser needed)
- Handles NaN values from yfinance gracefully
- Sector indices use `^CNX*` format on Yahoo Finance
- FII/DII data may be blocked by NSE CORS - gracefully falls back
- Gemini AI is optional - rule-based analysis always works
