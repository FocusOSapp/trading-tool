#!/usr/bin/env python3
"""
Market Scanner - Runs in GitHub Actions every 15 minutes
Outputs JSON data files that the frontend reads directly
Zero server cost, unlimited scans
"""

import yfinance as yf
import pandas as pd
import numpy as np
import ta
import requests
import json
import os
from datetime import datetime
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

NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)


# ==================== DATA FETCHING ====================
def get_data(symbol, period="3mo", interval="1d", min_rows=2):
    try:
        df = yf.Ticker(symbol).history(period=period, interval=interval)
        if df.empty:
            return None
        df = df.copy()
        while len(df) > 0 and pd.isna(df['Close'].iloc[-1]):
            df = df.iloc[:-1]
        if df.empty or len(df) < min_rows:
            return None
        return df
    except Exception:
        return None


def compute_indicators(df):
    if df is None or len(df) < 20:
        return {}
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
    if len(df) >= 2:
        c["day_change_pct"] = round(((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2]) * 100, 2)
    if len(df) >= 5:
        c["week_change_pct"] = round(((close.iloc[-1] - close.iloc[-5]) / close.iloc[-5]) * 100, 2)
    if len(df) >= 20:
        c["month_change_pct"] = round(((close.iloc[-1] - close.iloc[-20]) / close.iloc[-20]) * 100, 2)
    return c


def _f(v):
    try:
        return round(float(v), 2)
    except (ValueError, TypeError):
        return None


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


# ==================== ANALYSIS ====================
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
        except Exception:
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


def scan_stock(symbol):
    df = get_data(symbol, period="6mo", interval="1d")
    if df is None or len(df) < 50:
        return None
    ind = compute_indicators(df)
    sr = find_sr(df)
    if not ind:
        return None

    price = ind.get("current_price", 0)
    # Structure
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

    # Volume
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

    # Indicators
    s = 0.0
    rsi = ind.get("rsi_14", 50)
    if 55 <= rsi <= 70: s += 0.8
    elif 70 < rsi <= 80: s += 0.5
    elif 40 <= rsi < 55: s += 0.3
    if ind.get("macd_hist", 0) and ind["macd_hist"] > 0: s += 0.5
    if ind.get("macd", 0) and ind.get("macd_signal", 0) and ind["macd"] > ind["macd_signal"]: s += 0.4
    if ind.get("adx", 0) and ind["adx"] > 25: s += 0.3
    indicator = min(s, 2.0)

    total = structure + volume + indicator + 1.0  # sentiment baseline

    # Signal
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


def get_market_overview():
    overview = {}
    for sym, key in [("^NSEI", "nifty"), ("^BSESN", "sensex"), ("INDIAVIX.NS", "vix")]:
        d = get_data(sym, period="2d", interval="1d", min_rows=1)
        if d is not None and len(d) >= 1:
            c = d["Close"]
            overview[key] = round(float(c.iloc[-1]), 2)
            overview[f"{key}_change"] = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2) if len(c) >= 2 else 0.0
    return overview


def get_news():
    news = []
    try:
        url = "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FuQjBHZ0pRVkNnQVAB?hl=en-IN&gl=IN&ceid=IN:en"
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, "html.parser")
            for item in soup.find_all("item")[:10]:
                title = item.find("title").text if item.find("title") else ""
                source = item.find("source").text if item.find("source") else ""
                link = item.find("link").text if item.find("link") else ""
                pub = item.find("pubDate").text if item.find("pubDate") else ""
                sent = "positive" if any(w in title.lower() for w in ["surge", "rally", "gain", "buy", "bullish", "rise", "strong", "beat"]) else "negative" if any(w in title.lower() for w in ["crash", "fall", "sell", "bearish", "loss", "decline", "weak", "drop"]) else "neutral"
                news.append({"title": title, "source": source, "url": link, "published_at": pub, "sentiment": sent})
    except Exception:
        pass
    return news


# ==================== MAIN ====================
def main():
    print(f"Starting scan at {datetime.utcnow().isoformat()}")

    # 1. Sectors
    sectors = analyze_sectors()
    print(f"Sectors analyzed: {len(sectors)}")

    # 2. Hot stocks from top sectors
    hot = []
    for s in sectors[:3]:
        mapped = SECTOR_NAME_MAP.get(s["name"], "")
        if mapped in SECTOR_STOCKS:
            hot.extend(SECTOR_STOCKS[mapped])
    all_symbols = list(set(hot + HIGH_MOMENTUM_WATCHLIST))

    # 3. Scan stocks
    signals = []
    scanned = 0
    for sym in all_symbols[:40]:
        try:
            r = scan_stock(sym)
            if r:
                scanned += 1
                if r["confidence"] >= 7:
                    signals.append(r)
        except Exception as e:
            print(f"Error scanning {sym}: {e}")
    signals.sort(key=lambda x: x["confidence"], reverse=True)
    print(f"Stocks scanned: {scanned}, Signals: {len(signals)}")

    # 4. Market overview
    overview = get_market_overview()

    # 5. News
    news = get_news()

    # 6. Write data files
    scan_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "sectors_analyzed": len(sectors),
        "stocks_scanned": scanned,
        "signals_generated": len(signals),
        "top_sectors": sectors[:5],
        "signals": signals,
        "market_overview": overview,
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

    # 7. Print summary
    print(f"\n{'='*50}")
    print(f"SCAN COMPLETE: {datetime.utcnow().isoformat()}")
    print(f"Sectors: {len(sectors)} | Stocks: {scanned} | Signals: {len(signals)}")
    if sectors:
        print(f"\nTop Sectors:")
        for s in sectors[:3]:
            print(f"  #{s['score']} {s['name']}: {s['change_pct']}%")
    if signals:
        print(f"\nTop Signals:")
        for sig in signals[:5]:
            print(f"  {sig['stock']}: {sig['signal']} conf={sig['confidence']} R:R={sig['risk_reward']}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
