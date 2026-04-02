#!/usr/bin/env python3
"""
Trading Pro Scanner v3 - Enhanced with News API, Global Markets, Commodities, Crypto, FII/DII, Market Breadth
Runs in GitHub Actions every 15 minutes
"""

import yfinance as yf
import pandas as pd
import numpy as np
import ta
import requests
import json
import os
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

# ==================== CONFIG ====================
SECTOR_INDICES = {
    "NIFTY AUTO": "^CNXAUTO", "NIFTY METAL": "^CNXMETAL", "NIFTY IT": "^CNXIT",
    "NIFTY PHARMA": "^CNXPHARMA", "NIFTY FMCG": "^CNXFMCG", "NIFTY PSU BANK": "^CNXPSUBANK",
    "NIFTY REALTY": "^CNXREALTY", "NIFTY INFRA": "^CNXINFRA", "NIFTY ENERGY": "^CNXENERGY",
    "NIFTY MEDIA": "^CNXMEDIA", "NIFTY50": "^NSEI",
}

SECTOR_STOCKS = {
    "PSU Banks": ["SBIN.NS", "PNB.NS", "BANKBARODA.NS", "CANBK.NS", "IOB.NS", "UCOBANK.NS", "INDIANB.NS", "MAHABANK.NS"],
    "Metal": ["TATASTEEL.NS", "VEDL.NS", "HINDALCO.NS", "JSWSTEEL.NS", "SAIL.NS", "COALINDIA.NS", "NMDC.NS", "JINDALSTEL.NS"],
    "Auto": ["EICHERMOT.NS", "M&M.NS", "MARUTI.NS", "BAJAJ-AUTO.NS", "TVSMOTOR.NS", "HEROMOTOCO.NS", "ASHOKLEY.NS", "HERO.NS"],
    "Capital Markets": ["BSE.NS", "CDSL.NS", "ANGELONE.NS", "MOTILALOFS.NS", "CAMS.NS", "KFINTECH.NS", "MCX.NS", "IEX.NS"],
    "Media": ["SUNTV.NS", "ZEEL.NS", "PVRINOX.NS", "NETWORK18.NS", "TVTODAY.NS"],
    "IT": ["TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS", "TECHM.NS", "LTIM.NS", "PERSISTENT.NS", "COFORGE.NS"],
    "Bank": ["HDFCBANK.NS", "ICICIBANK.NS", "KOTAKBANK.NS", "AXISBANK.NS", "INDUSINDBK.NS", "FEDERALBNK.NS"],
    "Pharma": ["SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "LUPIN.NS", "AUROPHARMA.NS", "DIVISLAB.NS", "BIOCON.NS"],
    "FMCG": ["HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS", "DABUR.NS", "TATACONSUM.NS", "GODREJCP.NS"],
    "Realty": ["DLF.NS", "GODREJPROP.NS", "OBEROIRLTY.NS", "PRESTIGE.NS", "SOBHA.NS"],
}

SECTOR_NAME_MAP = {
    "NIFTY PSU BANK": "PSU Banks", "NIFTY METAL": "Metal", "NIFTY AUTO": "Auto",
    "NIFTY MEDIA": "Media", "NIFTY IT": "IT", "NIFTY PHARMA": "Pharma",
    "NIFTY FMCG": "FMCG", "NIFTY REALTY": "Realty", "NIFTY INFRA": "Realty",
    "NIFTY ENERGY": "Metal", "NIFTY50": "Bank",
}

HIGH_MOMENTUM_WATCHLIST = [
    "TATASTEEL.NS", "VEDL.NS", "BSE.NS", "CDSL.NS", "ANGELONE.NS",
    "MOTILALOFS.NS", "EICHERMOT.NS", "M&M.NS", "MARUTI.NS",
    "SBIN.NS", "HINDALCO.NS", "JSWSTEEL.NS", "COALINDIA.NS", "NMDC.NS",
    "BEL.NS", "ADANIPORTS.NS", "IREDA.NS", "NTPC.NS", "POWERGRID.NS",
    "LICI.NS", "PVRINOX.NS", "SUNTV.NS", "ZEEL.NS", "MCX.NS",
    "IEX.NS", "CAMS.NS", "KFINTECH.NS", "BAJFINANCE.NS",
    "LTIM.NS", "PERSISTENT.NS", "COFORGE.NS", "RELIANCE.NS",
    "HDFCBANK.NS", "INFY.NS", "TCS.NS", "BHARTIARTL.NS",
    "ITC.NS", "KOTAKBANK.NS", "LT.NS", "ASIANPAINT.NS", "AXISBANK.NS",
]

# Global indices
GLOBAL_INDICES = {
    "S&P 500": "^GSPC", "NASDAQ": "^IXIC", "DOW": "^DJI",
    "FTSE": "^FTSE", "DAX": "^GDAXI", "CAC": "^FCHI",
    "NIKKEI": "^N225", "HANG SENG": "^HSI", "SHANGHAI": "000001.SS",
    "KOSPI": "^KS11", "STI": "^STI", "ASX 200": "^AXJO",
}

# Commodities
COMMODITIES = {
    "Gold": "GC=F", "Silver": "SI=F", "Crude Oil": "CL=F",
    "Natural Gas": "NG=F", "Copper": "HG=F", "Platinum": "PL=F",
    "Brent Oil": "BZ=F", "Wheat": "ZW=F", "Corn": "ZC=F",
}

# Crypto
CRYPTOS = {
    "Bitcoin": "BTC-USD", "Ethereum": "ETH-USD", "BNB": "BNB-USD",
    "Solana": "SOL-USD", "XRP": "XRP-USD", "Cardano": "ADA-USD",
    "Dogecoin": "DOGE-USD", "Polygon": "MATIC-USD",
}

# Currency pairs
CURRENCIES = {
    "USD/INR": "USDINR=X", "EUR/USD": "EURUSD=X", "GBP/USD": "GBPUSD=X",
    "USD/JPY": "JPY=X", "EUR/INR": "EURINR=X", "GBP/INR": "GBPINR=X",
}

NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "743ba73c1809423fb1e87f920772e80f")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)


# ==================== DATA FETCHING ====================
def get_data(symbol, period="3mo", interval="1d", min_rows=2):
    try:
        df = yf.Ticker(symbol).history(period=period, interval=interval)
        if df.empty: return None
        df = df.copy()
        while len(df) > 0 and pd.isna(df['Close'].iloc[-1]):
            df = df.iloc[:-1]
        if df.empty or len(df) < min_rows: return None
        return df
    except Exception:
        return None


def get_price_info(symbol):
    """Get current price and change for any symbol"""
    try:
        df = get_data(symbol, period="2d", interval="1d", min_rows=1)
        if df is None or len(df) < 1: return None
        c = df["Close"]
        price = round(float(c.iloc[-1]), 2)
        change = 0
        if len(c) >= 2:
            change = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2)
        return {"price": price, "change": change}
    except Exception:
        return None


def compute_indicators(df):
    if df is None or len(df) < 20: return {}
    close, high, low, volume = df["Close"], df["High"], df["Low"], df["Volume"]
    rsi = ta.momentum.RSIIndicator(close, window=14).rsi()
    macd = ta.trend.MACD(close)
    bb = ta.volatility.BollingerBands(close, window=20)
    ema_20 = ta.trend.EMAIndicator(close, window=20).ema_indicator()
    ema_50 = ta.trend.EMAIndicator(close, window=50).ema_indicator()
    ema_200 = ta.trend.EMAIndicator(close, window=200).ema_indicator()
    adx = ta.trend.ADXIndicator(high, low, close, window=14)
    atr = ta.volatility.AverageTrueRange(high, low, close, window=14)
    vwap = (df[["High", "Low", "Close"]].mean(axis=1) * volume).cumsum() / volume.cumsum()
    stoch = ta.momentum.StochasticOscillator(high, low, close, window=14)

    c = {
        "rsi_14": _f(rsi.iloc[-1]), "macd": _f(macd.macd().iloc[-1]),
        "macd_signal": _f(macd.macd_signal().iloc[-1]), "macd_hist": _f(macd.macd_diff().iloc[-1]),
        "bb_upper": _f(bb.bollinger_hband().iloc[-1]), "bb_lower": _f(bb.bollinger_lband().iloc[-1]),
        "ema_20": _f(ema_20.iloc[-1]), "ema_50": _f(ema_50.iloc[-1]), "ema_200": _f(ema_200.iloc[-1]),
        "adx": _f(adx.adx().iloc[-1]), "atr": _f(atr.average_true_range().iloc[-1]),
        "vwap": _f(vwap.iloc[-1]), "stoch_k": _f(stoch.stoch().iloc[-1]),
        "stoch_d": _f(stoch.stoch_signal().iloc[-1]),
        "current_price": _f(close.iloc[-1]), "volume": int(volume.iloc[-1]),
        "avg_volume_20": int(volume.tail(20).mean()),
    }
    c["volume_ratio"] = round(c["volume"] / c["avg_volume_20"], 2) if c["avg_volume_20"] > 0 else 1
    p = c["current_price"]
    c["above_ema_20"] = p > (c["ema_20"] or 0)
    c["above_ema_50"] = p > (c["ema_50"] or 0)
    c["above_ema_200"] = p > (c["ema_200"] or 0)
    c["ema_20_50_bullish"] = (c["ema_20"] or 0) > (c["ema_50"] or 0)
    c["golden_cross"] = (c["ema_50"] or 0) > (c["ema_200"] or 0)
    if len(df) >= 2: c["day_change_pct"] = round(((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2]) * 100, 2)
    if len(df) >= 5: c["week_change_pct"] = round(((close.iloc[-1] - close.iloc[-5]) / close.iloc[-5]) * 100, 2)
    if len(df) >= 20: c["month_change_pct"] = round(((close.iloc[-1] - close.iloc[-20]) / close.iloc[-20]) * 100, 2)
    return c


def _f(v):
    try: return round(float(v), 2)
    except: return None


def find_sr(df, lookback=60):
    if df is None or len(df) < lookback:
        return {"support": [], "resistance": [], "nearest_resistance": None, "nearest_support": None}
    recent = df.tail(lookback)
    highs, lows = recent["High"].values, recent["Low"].values
    res, sup = [], []
    for i in range(2, len(highs) - 2):
        if highs[i] > highs[i-1] and highs[i] > highs[i+1] and highs[i] > highs[i-2] and highs[i] > highs[i+2]:
            res.append(round(float(highs[i]), 2))
        if lows[i] < lows[i-1] and lows[i] < lows[i+1] and lows[i] < lows[i-2] and lows[i] < lows[i+2]:
            sup.append(round(float(lows[i]), 2))
    res = sorted(set(res), reverse=True)[:5]
    sup = sorted(set(sup))[:5]
    return {"resistance": res, "support": sup, "nearest_resistance": res[0] if res else None, "nearest_support": sup[-1] if sup else None}


# ==================== NEWS API ====================
def get_news_from_api():
    """Get news from NewsAPI.org with full articles"""
    news = []
    if not NEWS_API_KEY or NEWS_API_KEY == "your_news_api_key_here":
        return get_news_from_google()

    # 1. Top India business news
    try:
        url = "https://newsapi.org/v2/top-headlines"
        params = {"country": "in", "category": "business", "pageSize": 15, "apiKey": NEWS_API_KEY}
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "ok":
                for a in data.get("articles", []):
                    news.append({
                        "title": a.get("title", ""),
                        "description": a.get("description", ""),
                        "source": a.get("source", {}).get("name", ""),
                        "url": a.get("url", ""),
                        "image": a.get("urlToImage", ""),
                        "published_at": a.get("publishedAt", ""),
                        "sentiment": analyze_sentiment(a.get("title", "") + " " + (a.get("description", "") or "")),
                        "category": "business",
                    })
    except Exception as e:
        print(f"NewsAPI top headlines error: {e}")

    # 2. Stock market specific news
    try:
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": "stock market India NSE BSE",
            "language": "en", "sortBy": "publishedAt",
            "pageSize": 10, "apiKey": NEWS_API_KEY,
            "from": (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%d"),
        }
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "ok":
                for a in data.get("articles", []):
                    news.append({
                        "title": a.get("title", ""),
                        "description": a.get("description", ""),
                        "source": a.get("source", {}).get("name", ""),
                        "url": a.get("url", ""),
                        "image": a.get("urlToImage", ""),
                        "published_at": a.get("publishedAt", ""),
                        "sentiment": analyze_sentiment(a.get("title", "") + " " + (a.get("description", "") or "")),
                        "category": "markets",
                    })
    except Exception as e:
        print(f"NewsAPI market news error: {e}")

    # 3. Global economy news
    try:
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": "economy inflation interest rates Fed RBI",
            "language": "en", "sortBy": "publishedAt",
            "pageSize": 5, "apiKey": NEWS_API_KEY,
            "from": (datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d"),
        }
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "ok":
                for a in data.get("articles", []):
                    news.append({
                        "title": a.get("title", ""),
                        "description": a.get("description", ""),
                        "source": a.get("source", {}).get("name", ""),
                        "url": a.get("url", ""),
                        "image": a.get("urlToImage", ""),
                        "published_at": a.get("publishedAt", ""),
                        "sentiment": analyze_sentiment(a.get("title", "") + " " + (a.get("description", "") or "")),
                        "category": "macro",
                    })
    except Exception as e:
        print(f"NewsAPI macro error: {e}")

    return news[:25]


def get_news_from_google():
    """Fallback: Google News RSS"""
    news = []
    try:
        url = "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FuQjBHZ0pRVkNnQVAB?hl=en-IN&gl=IN&ceid=IN:en"
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            for item in soup.find_all("item")[:15]:
                title = item.find("title").text if item.find("title") else ""
                source = item.find("source").text if item.find("source") else ""
                link = item.find("link").text if item.find("link") else ""
                pub = item.find("pubDate").text if item.find("pubDate") else ""
                news.append({
                    "title": title, "description": "", "source": source, "url": link,
                    "image": "", "published_at": pub,
                    "sentiment": analyze_sentiment(title), "category": "business",
                })
    except Exception as e:
        print(f"Google News error: {e}")
    return news


def analyze_sentiment(text):
    text = text.lower()
    pos = ["surge", "rally", "gain", "buy", "upgrade", "bullish", "breakout", "rise", "profit", "growth", "strong", "beat", "record", "high", "jump", "soar", "outperform", "positive", "recovery", "boom"]
    neg = ["crash", "fall", "sell", "downgrade", "bearish", "loss", "decline", "weak", "miss", "low", "drop", "plunge", "warning", "risk", "concern", "negative", "down", "slump", "recession", "crisis"]
    p = sum(1 for w in pos if w in text)
    n = sum(1 for w in neg if w in text)
    if p > n: return "positive"
    if n > p: return "negative"
    return "neutral"


# ==================== GLOBAL MARKETS ====================
def get_global_markets():
    markets = []
    for name, sym in GLOBAL_INDICES.items():
        info = get_price_info(sym)
        if info:
            markets.append({"name": name, "symbol": sym, **info})
    return markets


# ==================== COMMODITIES ====================
def get_commodities():
    items = []
    for name, sym in COMMODITIES.items():
        info = get_price_info(sym)
        if info:
            items.append({"name": name, "symbol": sym, **info})
    return items


# ==================== CRYPTO ====================
def get_crypto():
    items = []
    for name, sym in CRYPTOS.items():
        info = get_price_info(sym)
        if info:
            items.append({"name": name, "symbol": sym, **info})
    return items


# ==================== CURRENCIES ====================
def get_currencies():
    items = []
    for name, sym in CURRENCIES.items():
        info = get_price_info(sym)
        if info:
            items.append({"name": name, "symbol": sym, **info})
    return items


# ==================== FII/DII ====================
def get_fii_dii():
    """Fetch FII/DII data from NSE"""
    try:
        url = "https://www.nseindia.com/api/fandd-equity"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "application/json"}
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "fii_buy": data.get("fiiBuyValue", 0),
                "fii_sell": data.get("fiiSellValue", 0),
                "fii_net": data.get("fiiNetValue", 0),
                "dii_buy": data.get("diiBuyValue", 0),
                "dii_sell": data.get("diiSellValue", 0),
                "dii_net": data.get("diiNetValue", 0),
                "date": data.get("timestamp", ""),
            }
    except Exception as e:
        print(f"FII/DII error: {e}")
    return {}


# ==================== MARKET BREADTH ====================
def get_market_breadth():
    """Get advance/decline ratio and 52-week high/low"""
    breadth = {"advance": 0, "decline": 0, "unchanged": 0, "new_highs": 0, "new_lows": 0, "total": 0}
    try:
        # Scrape NSE advance/decline
        url = "https://www.nseindia.com/api/live-market-advance-decline"
        headers = {"User-Agent": "Mozilla/5.0"}
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if "data" in data:
                for item in data["data"]:
                    breadth["advance"] += item.get("advances", 0)
                    breadth["decline"] += item.get("declines", 0)
                    breadth["unchanged"] += item.get("unchanged", 0)
                breadth["total"] = breadth["advance"] + breadth["decline"] + breadth["unchanged"]
    except Exception as e:
        print(f"Market breadth error: {e}")

    # Calculate 52w high/low from watchlist
    highs, lows = 0, 0
    for sym in HIGH_MOMENTUM_WATCHLIST[:30]:
        try:
            df = get_data(sym, period="1y", interval="1d")
            if df is not None and len(df) >= 200:
                current = float(df["Close"].iloc[-1])
                high_52 = float(df["High"].max())
                low_52 = float(df["Low"].min())
                if current >= high_52 * 0.98: highs += 1
                if current <= low_52 * 1.02: lows += 1
        except:
            pass
    breadth["new_highs"] = highs
    breadth["new_lows"] = lows
    return breadth


# ==================== VOLUME SHOCKERS ====================
def get_volume_shockers():
    """Find stocks with unusual volume"""
    shockers = []
    for sym in HIGH_MOMENTUM_WATCHLIST:
        try:
            df = get_data(sym, period="1mo", interval="1d")
            if df is None or len(df) < 20: continue
            vol = df["Volume"].iloc[-1]
            avg_vol = df["Volume"].tail(20).mean()
            ratio = vol / avg_vol if avg_vol > 0 else 0
            if ratio > 2.0:
                close = df["Close"]
                change = ((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2]) * 100 if len(close) >= 2 else 0
                shockers.append({
                    "symbol": sym, "name": sym.replace(".NS", ""),
                    "volume": int(vol), "avg_volume": int(avg_vol),
                    "volume_ratio": round(ratio, 2),
                    "change_pct": round(change, 2),
                    "price": round(float(close.iloc[-1]), 2),
                })
        except:
            pass
    shockers.sort(key=lambda x: x["volume_ratio"], reverse=True)
    return shockers[:15]


# ==================== SECTOR ANALYSIS ====================
def analyze_sectors():
    results = {}
    for name, ticker in SECTOR_INDICES.items():
        try:
            data = get_data(ticker, period="1mo", interval="1d", min_rows=2)
            if data is not None and len(data) >= 2:
                close = data["Close"]
                change = ((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2]) * 100
                vol = data["Volume"].iloc[-1]
                avg_vol = data["Volume"].mean()
                vol_ratio = vol / avg_vol if avg_vol > 0 else 1
                results[name] = {"change_pct": round(change, 2), "volume_ratio": round(vol_ratio, 2)}
        except:
            pass

    nifty = get_data("^NSEI", period="1mo", interval="1d", min_rows=2)
    nifty_change = 0
    if nifty is not None and len(nifty) >= 2:
        c = nifty["Close"]
        nifty_change = ((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100

    scored = []
    for name, perf in results.items():
        ch, vr = perf["change_pct"], perf["volume_ratio"]
        mom = 3.0 if ch > 3 else 2.5 if ch > 2 else 2.0 if ch > 1 else 1.0 if ch > 0 else 0.0
        vol = 3.0 if vr > 2.0 else 2.5 if vr > 1.5 else 2.0 if vr > 1.2 else 1.0 if vr > 1.0 else 0.5
        sent = 2.0 if ch > 2 else 1.5 if ch > 1 else 1.0 if ch > 0 else 0.5
        rs = 2.0 if (ch - nifty_change) > 2 else 1.5 if (ch - nifty_change) > 1 else 1.0 if (ch - nifty_change) > 0 else 0.0
        total = mom + vol + sent + rs
        parts = []
        if ch > 2: parts.append(f"Strong momentum +{ch:.1f}%")
        elif ch > 0: parts.append(f"Positive +{ch:.1f}%")
        else: parts.append(f"Weak {ch:.1f}%")
        if vr > 1.5: parts.append(f"vol {vr:.1f}x avg")
        if (ch - nifty_change) > 1: parts.append(f"outperforming Nifty by {ch - nifty_change:.1f}%")
        scored.append({"name": name, "score": round(total, 1), "momentum": round(mom, 1), "volume_expansion": round(vol, 1), "sentiment": round(sent, 1), "relative_strength": round(rs, 1), "change_pct": round(ch, 2), "reason": ". ".join(parts), "timestamp": datetime.utcnow().isoformat()})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


# ==================== STOCK SCANNING ====================
def scan_stock(symbol):
    df = get_data(symbol, period="6mo", interval="1d")
    if df is None or len(df) < 50: return None
    ind = compute_indicators(df)
    sr = find_sr(df)
    if not ind: return None

    price = ind.get("current_price", 0)
    s = 0.0
    if ind.get("above_ema_20"): s += 0.5
    if ind.get("above_ema_50"): s += 0.5
    if ind.get("above_ema_200"): s += 0.5
    if ind.get("ema_20_50_bullish"): s += 0.5
    if ind.get("golden_cross"): s += 0.5
    nr = sr.get("nearest_resistance")
    if nr and price > 0 and 0 < ((nr - price) / price) * 100 < 3: s += 0.5
    if ind.get("day_change_pct", 0) > 2: s += 0.5
    structure = min(s, 3.0)

    s = 0.0
    vr = ind.get("volume_ratio", 1)
    if vr > 2.5: s += 1.5
    elif vr > 2.0: s += 1.2
    elif vr > 1.5: s += 1.0
    elif vr > 1.2: s += 0.7
    elif vr > 1.0: s += 0.5
    if ind.get("day_change_pct", 0) > 2 and vr > 1.5: s += 1.0
    elif ind.get("day_change_pct", 0) > 1 and vr > 1.2: s += 0.5
    volume = min(s, 3.0)

    s = 0.0
    rsi = ind.get("rsi_14", 50)
    if 55 <= rsi <= 70: s += 0.8
    elif 70 < rsi <= 80: s += 0.5
    elif 40 <= rsi < 55: s += 0.3
    if ind.get("macd_hist", 0) and ind["macd_hist"] > 0: s += 0.5
    if ind.get("macd", 0) and ind.get("macd_signal", 0) and ind["macd"] > ind["macd_signal"]: s += 0.4
    if ind.get("adx", 0) and ind["adx"] > 25: s += 0.3
    indicator = min(s, 2.0)

    total = structure + volume + indicator + 1.0
    t1 = round(nr, 2) if nr and price > 0 else round(price * 1.03, 2)
    t2 = round(nr * 1.05, 2) if nr and price > 0 else round(price * 1.07, 2)
    ns = sr.get("nearest_support")
    sl = round(ns * 0.98, 2) if ns and price > 0 else round(price * 0.96, 2)
    risk = price - sl if sl < price else price * 0.04
    reward = t1 - price if t1 > price else price * 0.03
    rr = round(reward / risk, 1) if risk > 0 else 1.0
    conf = min(int(total), 10)
    if rr < 1.5: conf = min(conf, 6)

    reasons = []
    if ind.get("above_ema_20") and ind.get("above_ema_50"): reasons.append("Price above EMA20/EMA50")
    if vr > 1.5: reasons.append(f"Volume {vr}x avg")
    if rsi > 55: reasons.append(f"RSI {rsi} strength")
    if ind.get("macd_hist", 0) > 0: reasons.append("MACD positive")
    if ind.get("adx", 0) > 25: reasons.append(f"ADX {ind['adx']} strong trend")

    return {
        "stock": symbol.replace(".NS", ""), "symbol": symbol, "signal": "BUY",
        "confidence": conf, "entry": f"{round(price * 1.005, 2)}", "stop_loss": str(sl),
        "targets": [t1, t2], "risk_reward": f"1:{rr}", "current_price": price,
        "reason": ". ".join(reasons) if reasons else "Technical setup favorable",
        "sector": "Unknown", "structure_score": round(structure, 1),
        "volume_score": round(volume, 1), "indicator_score": round(indicator, 1),
        "sentiment_score": 1.0, "indicators": ind, "support_resistance": sr,
        "timestamp": datetime.utcnow().isoformat(),
    }


# ==================== MAIN ====================
def main():
    print(f"Starting scan at {datetime.utcnow().isoformat()}")

    # 1. Sectors
    sectors = analyze_sectors()
    print(f"Sectors: {len(sectors)}")

    # 2. Hot stocks
    hot = []
    for s in sectors[:3]:
        mapped = SECTOR_NAME_MAP.get(s["name"], "")
        if mapped in SECTOR_STOCKS: hot.extend(SECTOR_STOCKS[mapped])
    all_symbols = list(set(hot + HIGH_MOMENTUM_WATCHLIST))

    # 3. Scan stocks
    signals = []
    scanned = 0
    for sym in all_symbols[:40]:
        try:
            r = scan_stock(sym)
            if r:
                scanned += 1
                if r["confidence"] >= 7: signals.append(r)
        except Exception as e:
            print(f"Error {sym}: {e}")
    signals.sort(key=lambda x: x["confidence"], reverse=True)
    print(f"Scanned: {scanned}, Signals: {len(signals)}")

    # 4. Market overview
    overview = {}
    for sym, key in [("^NSEI", "nifty"), ("^BSESN", "sensex"), ("INDIAVIX.NS", "vix")]:
        d = get_data(sym, period="2d", interval="1d", min_rows=1)
        if d is not None and len(d) >= 1:
            c = d["Close"]
            overview[key] = round(float(c.iloc[-1]), 2)
            overview[f"{key}_change"] = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2) if len(c) >= 2 else 0.0

    # 5. Global markets
    print("Fetching global markets...")
    global_markets = get_global_markets()
    print(f"Global markets: {len(global_markets)}")

    # 6. Commodities
    print("Fetching commodities...")
    commodities = get_commodities()
    print(f"Commodities: {len(commodities)}")

    # 7. Crypto
    print("Fetching crypto...")
    crypto = get_crypto()
    print(f"Crypto: {len(crypto)}")

    # 8. Currencies
    print("Fetching currencies...")
    currencies = get_currencies()
    print(f"Currencies: {len(currencies)}")

    # 9. FII/DII
    print("Fetching FII/DII...")
    fii_dii = get_fii_dii()

    # 10. Market breadth
    print("Calculating market breadth...")
    breadth = get_market_breadth()

    # 11. Volume shockers
    print("Finding volume shockers...")
    volume_shockers = get_volume_shockers()
    print(f"Volume shockers: {len(volume_shockers)}")

    # 12. News
    print("Fetching news...")
    news = get_news_from_api()
    print(f"News articles: {len(news)}")

    # Write all data
    scan_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "sectors_analyzed": len(sectors),
        "stocks_scanned": scanned,
        "signals_generated": len(signals),
        "top_sectors": sectors[:5],
        "signals": signals,
        "market_overview": overview,
        "global_markets": global_markets,
        "commodities": commodities,
        "crypto": crypto,
        "currencies": currencies,
        "fii_dii": fii_dii,
        "market_breadth": breadth,
        "volume_shockers": volume_shockers,
        "news": news,
    }

    with open(os.path.join(DATA_DIR, "scan.json"), "w") as f:
        json.dump(scan_data, f, indent=2)
    with open(os.path.join(DATA_DIR, "sectors.json"), "w") as f:
        json.dump({"sectors": sectors}, f, indent=2)
    with open(os.path.join(DATA_DIR, "signals.json"), "w") as f:
        json.dump({"signals": signals}, f, indent=2)
    with open(os.path.join(DATA_DIR, "overview.json"), "w") as f:
        json.dump(overview, f, indent=2)
    with open(os.path.join(DATA_DIR, "news.json"), "w") as f:
        json.dump({"news": news}, f, indent=2)
    with open(os.path.join(DATA_DIR, "global.json"), "w") as f:
        json.dump({"global_markets": global_markets, "commodities": commodities, "crypto": crypto, "currencies": currencies}, f, indent=2)
    with open(os.path.join(DATA_DIR, "breadth.json"), "w") as f:
        json.dump(breadth, f, indent=2)
    with open(os.path.join(DATA_DIR, "shockers.json"), "w") as f:
        json.dump({"volume_shockers": volume_shockers}, f, indent=2)
    with open(os.path.join(DATA_DIR, "fii_dii.json"), "w") as f:
        json.dump(fii_dii, f, indent=2)

    print(f"\n{'='*60}")
    print(f"SCAN COMPLETE: {datetime.utcnow().isoformat()}")
    print(f"Sectors: {len(sectors)} | Stocks: {scanned} | Signals: {len(signals)}")
    print(f"Global: {len(global_markets)} | Commodities: {len(commodities)} | Crypto: {len(crypto)}")
    print(f"News: {len(news)} | Volume Shockers: {len(volume_shockers)}")
    if sectors:
        print(f"\nTop Sectors:")
        for s in sectors[:3]: print(f"  #{s['score']} {s['name']}: {s['change_pct']}%")
    if signals:
        print(f"\nTop Signals:")
        for sig in signals[:5]: print(f"  {sig['stock']}: conf={sig['confidence']} R:R={sig['risk_reward']}")
    print(f"{'='*60}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"SCAN ERROR: {e}")
        import traceback
        traceback.print_exc()
        # Write minimal data so workflow doesn't fail
        import json, os
        DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        os.makedirs(DATA_DIR, exist_ok=True)
        for f in ["scan.json", "sectors.json", "signals.json", "overview.json", "news.json", "global.json", "breadth.json", "shockers.json", "fii_dii.json"]:
            with open(os.path.join(DATA_DIR, f), "w") as fh:
                json.dump({}, fh)
        print("Wrote empty data files to continue workflow")
