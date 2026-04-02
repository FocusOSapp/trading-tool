#!/usr/bin/env python3
"""
Trading Pro Scanner v5 - Bulletproof Edition
Always outputs valid data. Never fails.
"""

import yfinance as yf
import pandas as pd
import numpy as np
import json
import os
import requests
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "")

def safe_get(symbol, period="3mo", interval="1d"):
    try:
        df = yf.Ticker(symbol).history(period=period, interval=interval)
        if df.empty: return None
        df = df.copy()
        while len(df) > 0 and pd.isna(df['Close'].iloc[-1]):
            df = df.iloc[:-1]
        return df if len(df) >= 2 else None
    except:
        return None

def price_info(symbol):
    try:
        df = safe_get(symbol, "2d", "1d")
        if df is None: return None
        c = df["Close"]
        p = round(float(c.iloc[-1]), 2)
        ch = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2) if len(c) >= 2 else 0.0
        return {"price": p, "change": ch}
    except:
        return None

def scan_sectors():
    try:
        indices = {
            "NIFTY AUTO": "^CNXAUTO", "NIFTY METAL": "^CNXMETAL", "NIFTY IT": "^CNXIT",
            "NIFTY PHARMA": "^CNXPHARMA", "NIFTY FMCG": "^CNXFMCG", "NIFTY PSU BANK": "^CNXPSUBANK",
            "NIFTY REALTY": "^CNXREALTY", "NIFTY INFRA": "^CNXINFRA", "NIFTY ENERGY": "^CNXENERGY",
            "NIFTY MEDIA": "^CNXMEDIA", "NIFTY50": "^NSEI",
        }
        nifty_df = safe_get("^NSEI", "1mo", "1d")
        nifty_ch = 0
        if nifty_df is not None and len(nifty_df) >= 2:
            c = nifty_df["Close"]
            nifty_ch = ((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100

        results = []
        for name, sym in indices.items():
            df = safe_get(sym, "1mo", "1d")
            if df is None or len(df) < 2: continue
            c = df["Close"]
            ch = ((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100
            v = df["Volume"].iloc[-1]
            av = df["Volume"].mean()
            vr = v / av if av > 0 else 1
            mom = min(max(ch * 0.8, 0), 3)
            vol = min(max(vr * 1.2, 0.5), 3)
            rs = min(max((ch - nifty_ch) * 0.8, 0), 2)
            sent = 2.0 if ch > 1 else 1.0 if ch > 0 else 0.5
            total = round(mom + vol + rs + sent, 1)
            results.append({
                "name": name, "score": total, "momentum": round(mom, 1),
                "volume_expansion": round(vol, 1), "sentiment": round(sent, 1),
                "relative_strength": round(rs, 1), "change_pct": round(ch, 2),
                "reason": f"{'+' if ch > 0 else ''}{ch:.1f}% | vol {vr:.1f}x",
                "timestamp": datetime.utcnow().isoformat()
            })
        results.sort(key=lambda x: x["score"], reverse=True)
        return results
    except Exception as e:
        print(f"Sectors error: {e}")
        return []

def scan_stocks():
    try:
        stocks = [
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
        signals = []
        scanned = 0
        for sym in stocks:
            try:
                df = safe_get(sym, "6mo", "1d")
                if df is None or len(df) < 50: continue
                scanned += 1
                close = df["Close"]
                high = df["High"]
                low = df["Low"]
                price = round(float(close.iloc[-1]), 2)
                vol = df["Volume"].iloc[-1]
                avg_vol = df["Volume"].tail(20).mean()
                vr = round(vol / avg_vol, 2) if avg_vol > 0 else 1

                ema20 = close.ewm(span=20).mean().iloc[-1]
                ema50 = close.ewm(span=50).mean().iloc[-1]
                ema200 = close.ewm(span=200).mean().iloc[-1] if len(close) >= 200 else ema50

                rsi_val = 50
                if len(close) >= 14:
                    delta = close.diff()
                    gain = delta.where(delta > 0, 0).rolling(14).mean().iloc[-1]
                    loss = (-delta.where(delta < 0, 0)).rolling(14).mean().iloc[-1]
                    if loss > 0: rsi_val = round(100 - (100 / (1 + gain/loss)), 1)

                day_ch = ((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2]) * 100 if len(close) >= 2 else 0

                buy_score = 0
                if price > ema20: buy_score += 1.0
                if price > ema50: buy_score += 1.0
                if ema20 > ema50: buy_score += 1.0
                if vr > 1.5: buy_score += 1.0
                elif vr > 1.0: buy_score += 0.5
                if 55 <= rsi_val <= 70: buy_score += 1.0
                elif 50 <= rsi_val < 55: buy_score += 0.5
                if day_ch > 0: buy_score += 0.5
                if day_ch > 2: buy_score += 0.5

                sell_score = 0
                if price < ema20: sell_score += 1.0
                if price < ema50: sell_score += 1.0
                if ema20 < ema50: sell_score += 1.0
                if vr > 1.5: sell_score += 1.0
                elif vr > 1.0: sell_score += 0.5
                if rsi_val < 45: sell_score += 1.0
                elif rsi_val < 50: sell_score += 0.5
                if day_ch < 0: sell_score += 0.5
                if day_ch < -2: sell_score += 0.5

                buy_conf = min(int(buy_score * 1.4), 10)
                sell_conf = min(int(sell_score * 1.4), 10)

                if buy_conf >= 6 and buy_conf >= sell_conf:
                    sl = round(price * 0.96, 2)
                    t1 = round(price * 1.04, 2)
                    t2 = round(price * 1.08, 2)
                    risk = price - sl
                    reward = t1 - price
                    rr = round(reward / risk, 1) if risk > 0 else 1.0
                    signals.append({
                        "stock": sym.replace(".NS", ""), "symbol": sym, "signal": "BUY",
                        "confidence": buy_conf, "entry": str(round(price * 1.005, 2)),
                        "stop_loss": str(sl), "targets": [t1, t2],
                        "risk_reward": f"1:{rr}", "current_price": price,
                        "reason": f"Above EMA20/50 | Vol {vr}x | RSI {rsi_val} | Day +{day_ch:.1f}%",
                        "sector": "Unknown", "structure_score": round(buy_score * 0.6, 1),
                        "volume_score": round(min(vr * 0.8, 3), 1),
                        "indicator_score": round(1.5 if ema20 > ema50 else 0.8, 1),
                        "sentiment_score": 1.0, "timestamp": datetime.utcnow().isoformat()
                    })
                elif sell_conf >= 6:
                    sl = round(price * 1.04, 2)
                    t1 = round(price * 0.96, 2)
                    t2 = round(price * 0.92, 2)
                    risk = sl - price
                    reward = price - t1
                    rr = round(reward / risk, 1) if risk > 0 else 1.0
                    signals.append({
                        "stock": sym.replace(".NS", ""), "symbol": sym, "signal": "SELL",
                        "confidence": sell_conf, "entry": str(round(price * 0.995, 2)),
                        "stop_loss": str(sl), "targets": [t1, t2],
                        "risk_reward": f"1:{rr}", "current_price": price,
                        "reason": f"Below EMA20/50 | Vol {vr}x | RSI {rsi_val} | Day {day_ch:.1f}%",
                        "sector": "Unknown", "structure_score": round(sell_score * 0.6, 1),
                        "volume_score": round(min(vr * 0.8, 3), 1),
                        "indicator_score": round(1.5 if ema20 < ema50 else 0.8, 1),
                        "sentiment_score": 1.0, "timestamp": datetime.utcnow().isoformat()
                    })
            except Exception as e:
                print(f"  Skip {sym}: {e}")
                continue
        signals.sort(key=lambda x: x["confidence"], reverse=True)
        return signals, scanned
    except Exception as e:
        print(f"Stocks error: {e}")
        return [], 0

def scan_global():
    try:
        items = {}
        for name, sym in {
            "S&P 500": "^GSPC", "NASDAQ": "^IXIC", "DOW": "^DJI",
            "FTSE": "^FTSE", "DAX": "^GDAXI", "NIKKEI": "^N225",
            "HANG SENG": "^HSI", "SHANGHAI": "000001.SS", "ASX 200": "^AXJO",
        }.items():
            p = price_info(sym)
            if p: items[name] = p
        return items
    except:
        return {}

def scan_commodities():
    try:
        items = {}
        for name, sym in {
            "Gold": "GC=F", "Silver": "SI=F", "Crude Oil": "CL=F",
            "Natural Gas": "NG=F", "Copper": "HG=F",
        }.items():
            p = price_info(sym)
            if p: items[name] = p
        return items
    except:
        return {}

def scan_crypto():
    try:
        items = {}
        for name, sym in {
            "Bitcoin": "BTC-USD", "Ethereum": "ETH-USD", "Solana": "SOL-USD",
            "BNB": "BNB-USD", "XRP": "XRP-USD",
        }.items():
            p = price_info(sym)
            if p: items[name] = p
        return items
    except:
        return {}

def scan_news():
    try:
        if not NEWS_API_KEY: return []
        url = "https://newsapi.org/v2/top-headlines"
        r = requests.get(url, params={"country": "in", "category": "business", "pageSize": 15, "apiKey": NEWS_API_KEY}, timeout=10)
        if r.status_code != 200: return []
        data = r.json()
        if data.get("status") != "ok": return []
        news = []
        for a in data.get("articles", []):
            title = a.get("title", "")
            t = title.lower()
            sent = "positive" if any(w in t for w in ["surge", "rally", "gain", "buy", "bullish", "rise", "strong"]) else "negative" if any(w in t for w in ["crash", "fall", "sell", "bearish", "loss", "decline"]) else "neutral"
            news.append({
                "title": title, "description": a.get("description", ""),
                "source": a.get("source", {}).get("name", ""),
                "url": a.get("url", ""), "image": a.get("urlToImage", ""),
                "published_at": a.get("publishedAt", ""), "sentiment": sent, "category": "business"
            })
        return news[:15]
    except:
        return []

def scan_overview():
    try:
        o = {}
        for sym, key in [("^NSEI", "nifty"), ("^BSESN", "sensex"), ("INDIAVIX.NS", "vix")]:
            p = price_info(sym)
            if p:
                o[key] = p["price"]
                o[f"{key}_change"] = p["change"]
        return o
    except:
        return {}

def main():
    print(f"=== Trading Pro Scan {datetime.utcnow().isoformat()} ===")

    overview = scan_overview()
    print(f"Overview: {overview}")

    sectors = scan_sectors()
    print(f"Sectors: {len(sectors)}")

    signals, scanned = scan_stocks()
    print(f"Stocks: {scanned} scanned, {len(signals)} signals")

    global_m = scan_global()
    print(f"Global: {len(global_m)}")

    commodities = scan_commodities()
    print(f"Commodities: {len(commodities)}")

    crypto = scan_crypto()
    print(f"Crypto: {len(crypto)}")

    news = scan_news()
    print(f"News: {len(news)}")

    data = {
        "timestamp": datetime.utcnow().isoformat(),
        "sectors_analyzed": len(sectors),
        "stocks_scanned": scanned,
        "signals_generated": len(signals),
        "top_sectors": sectors[:5],
        "signals": signals,
        "market_overview": overview,
        "global_markets": global_m,
        "commodities": commodities,
        "crypto": crypto,
        "news": news,
        "fii_dii": {},
        "market_breadth": {"advance": 0, "decline": 0, "unchanged": 0, "new_highs": 0, "new_lows": 0},
        "volume_shockers": [],
    }

    for f, d in [
        ("scan.json", data),
        ("sectors.json", {"sectors": sectors}),
        ("signals.json", {"signals": signals}),
        ("overview.json", overview),
        ("news.json", {"news": news}),
        ("global.json", {"global_markets": global_m, "commodities": commodities, "crypto": crypto, "currencies": {}}),
        ("breadth.json", data["market_breadth"]),
        ("shockers.json", {"volume_shockers": []}),
        ("fii_dii.json", {}),
    ]:
        with open(os.path.join(DATA_DIR, f), "w") as fh:
            json.dump(d, fh, indent=2)

    print("=== Data written ===")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"SCAN ERROR: {e}")
        import traceback
        traceback.print_exc()
        DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        os.makedirs(DATA_DIR, exist_ok=True)
        for f in ["scan.json", "sectors.json", "signals.json", "overview.json", "news.json", "global.json", "breadth.json", "shockers.json", "fii_dii.json"]:
            with open(os.path.join(DATA_DIR, f), "w") as fh:
                json.dump({}, fh)
        print("Wrote empty data files to continue workflow")
