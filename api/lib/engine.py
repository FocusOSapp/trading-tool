import yfinance as yf
import pandas as pd
import numpy as np
import ta
import requests
from datetime import datetime
from bs4 import BeautifulSoup
import os
import json

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


def get_stock_data(symbol, period="3mo", interval="1d", min_rows=2):
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)
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
    close = df["Close"]
    high = df["High"]
    low = df["Low"]
    volume = df["Volume"]
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

    current = {
        "rsi_14": round(float(rsi.iloc[-1]), 2) if not rsi.empty else None,
        "macd": round(float(macd.macd().iloc[-1]), 4) if not macd.macd().empty else None,
        "macd_signal": round(float(macd.macd_signal().iloc[-1]), 4) if not macd.macd_signal().empty else None,
        "macd_hist": round(float(macd.macd_diff().iloc[-1]), 4) if not macd.macd_diff().empty else None,
        "bb_upper": round(float(bb.bollinger_hband().iloc[-1]), 2) if not bb.bollinger_hband().empty else None,
        "bb_lower": round(float(bb.bollinger_lband().iloc[-1]), 2) if not bb.bollinger_lband().empty else None,
        "ema_20": round(float(ema_20.iloc[-1]), 2) if not ema_20.empty else None,
        "ema_50": round(float(ema_50.iloc[-1]), 2) if not ema_50.empty else None,
        "ema_200": round(float(ema_200.iloc[-1]), 2) if not ema_200.empty else None,
        "adx": round(float(adx.adx().iloc[-1]), 2) if not adx.adx().empty else None,
        "atr": round(float(atr.average_true_range().iloc[-1]), 2) if not atr.average_true_range().empty else None,
        "vwap": round(float(vwap.iloc[-1]), 2) if not vwap.empty else None,
        "stoch_k": round(float(stoch.stoch().iloc[-1]), 2) if not stoch.stoch().empty else None,
        "stoch_d": round(float(stoch.stoch_signal().iloc[-1]), 2) if not stoch.stoch_signal().empty else None,
        "current_price": round(float(close.iloc[-1]), 2),
        "volume": int(volume.iloc[-1]),
        "avg_volume_20": int(volume.tail(20).mean()),
    }
    vol_ratio = current["volume"] / current["avg_volume_20"] if current["avg_volume_20"] > 0 else 1
    current["volume_ratio"] = round(vol_ratio, 2)
    price = current["current_price"]
    current["above_ema_20"] = price > (current["ema_20"] or 0)
    current["above_ema_50"] = price > (current["ema_50"] or 0)
    current["above_ema_200"] = price > (current["ema_200"] or 0)
    current["ema_20_50_bullish"] = (current["ema_20"] or 0) > (current["ema_50"] or 0)
    current["golden_cross"] = (current["ema_50"] or 0) > (current["ema_200"] or 0)
    if len(df) >= 2:
        current["day_change_pct"] = round(((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2]) * 100, 2)
    if len(df) >= 5:
        current["week_change_pct"] = round(((close.iloc[-1] - close.iloc[-5]) / close.iloc[-5]) * 100, 2)
    if len(df) >= 20:
        current["month_change_pct"] = round(((close.iloc[-1] - close.iloc[-20]) / close.iloc[-20]) * 100, 2)
    return current


def find_support_resistance(df, lookback=60):
    if df is None or len(df) < lookback:
        return {"support": [], "resistance": [], "nearest_resistance": None, "nearest_support": None}
    recent = df.tail(lookback)
    highs = recent["High"].values
    lows = recent["Low"].values
    resistance_levels = []
    support_levels = []
    for i in range(2, len(highs) - 2):
        if highs[i] > highs[i-1] and highs[i] > highs[i+1] and highs[i] > highs[i-2] and highs[i] > highs[i+2]:
            resistance_levels.append(float(highs[i]))
        if lows[i] < lows[i-1] and lows[i] < lows[i+1] and lows[i] < lows[i-2] and lows[i] < lows[i+2]:
            support_levels.append(float(lows[i]))
    resistance_levels = sorted(set([round(x, 2) for x in resistance_levels]), reverse=True)[:5]
    support_levels = sorted(set([round(x, 2) for x in support_levels]))[:5]
    return {
        "resistance": resistance_levels, "support": support_levels,
        "nearest_resistance": resistance_levels[0] if resistance_levels else None,
        "nearest_support": support_levels[-1] if support_levels else None,
    }


def analyze_sectors():
    results = {}
    for name, ticker in SECTOR_INDICES.items():
        try:
            data = get_stock_data(ticker, period="1mo", interval="1d", min_rows=2)
            if data is not None and len(data) >= 2:
                close = data["Close"]
                change_pct = ((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2]) * 100
                volume = data["Volume"].iloc[-1]
                avg_volume = data["Volume"].mean()
                vol_ratio = volume / avg_volume if avg_volume > 0 else 1
                results[name] = {"change_pct": round(change_pct, 2), "volume_ratio": round(vol_ratio, 2)}
        except Exception:
            pass

    nifty_data = get_stock_data("^NSEI", period="1mo", interval="1d", min_rows=2)
    nifty_change = 0
    if nifty_data is not None and len(nifty_data) >= 2:
        close = nifty_data["Close"]
        nifty_change = ((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2]) * 100

    scored = []
    for name, perf in results.items():
        change = perf["change_pct"]
        vol_ratio = perf["volume_ratio"]
        momentum = 3.0 if change > 3 else 2.5 if change > 2 else 2.0 if change > 1 else 1.0 if change > 0 else 0.0
        volume = 3.0 if vol_ratio > 2.0 else 2.5 if vol_ratio > 1.5 else 2.0 if vol_ratio > 1.2 else 1.0 if vol_ratio > 1.0 else 0.5
        sentiment = 2.0 if change > 2 else 1.5 if change > 1 else 1.0 if change > 0 else 0.5
        rs = 2.0 if (change - nifty_change) > 2 else 1.5 if (change - nifty_change) > 1 else 1.0 if (change - nifty_change) > 0 else 0.0
        total = momentum + volume + sentiment + rs
        parts = []
        if change > 2: parts.append(f"Strong momentum +{change:.1f}%")
        elif change > 0: parts.append(f"Positive +{change:.1f}%")
        else: parts.append(f"Weak {change:.1f}%")
        if vol_ratio > 1.5: parts.append(f"vol {vol_ratio:.1f}x")
        if (change - nifty_change) > 1: parts.append(f"outperforming Nifty by {change - nifty_change:.1f}%")
        scored.append({"name": name, "score": round(total, 1), "momentum": round(momentum, 1), "volume_expansion": round(volume, 1), "sentiment": round(sentiment, 1), "relative_strength": round(rs, 1), "change_pct": round(change, 2), "reason": ". ".join(parts), "timestamp": datetime.utcnow().isoformat()})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


def scan_stock(symbol):
    df = get_stock_data(symbol, period="6mo", interval="1d")
    if df is None or len(df) < 50:
        return None
    indicators = compute_indicators(df)
    sr = find_support_resistance(df)
    if not indicators:
        return None

    # Structure score
    score = 0.0
    price = indicators.get("current_price", 0)
    if indicators.get("above_ema_20"): score += 0.5
    if indicators.get("above_ema_50"): score += 0.5
    if indicators.get("above_ema_200"): score += 0.5
    if indicators.get("ema_20_50_bullish"): score += 0.5
    if indicators.get("golden_cross"): score += 0.5
    nearest_res = sr.get("nearest_resistance")
    if nearest_res and price > 0:
        dist = ((nearest_res - price) / price) * 100
        if 0 < dist < 3: score += 0.5
    if indicators.get("day_change_pct", 0) > 2: score += 0.5
    structure = min(score, 3.0)

    # Volume score
    score = 0.0
    vol_ratio = indicators.get("volume_ratio", 1)
    if vol_ratio > 2.5: score += 1.5
    elif vol_ratio > 2.0: score += 1.2
    elif vol_ratio > 1.5: score += 1.0
    elif vol_ratio > 1.2: score += 0.7
    elif vol_ratio > 1.0: score += 0.5
    if indicators.get("day_change_pct", 0) > 2 and vol_ratio > 1.5: score += 1.0
    elif indicators.get("day_change_pct", 0) > 1 and vol_ratio > 1.2: score += 0.5
    volume = min(score, 3.0)

    # Indicator score
    score = 0.0
    rsi = indicators.get("rsi_14", 50)
    if 55 <= rsi <= 70: score += 0.8
    elif 70 < rsi <= 80: score += 0.5
    elif 40 <= rsi < 55: score += 0.3
    if indicators.get("macd_hist", 0) and indicators["macd_hist"] > 0: score += 0.5
    if indicators.get("macd", 0) and indicators.get("macd_signal", 0) and indicators["macd"] > indicators["macd_signal"]: score += 0.4
    if indicators.get("adx", 0) and indicators["adx"] > 25: score += 0.3
    indicator = min(score, 2.0)

    # Sentiment (free keyword analysis)
    sentiment = 1.0

    total = structure + volume + indicator + sentiment

    # Build signal
    if nearest_res and price > 0:
        target1 = round(nearest_res, 2)
        target2 = round(nearest_res * 1.05, 2)
    else:
        target1 = round(price * 1.03, 2)
        target2 = round(price * 1.07, 2)
    nearest_sup = sr.get("nearest_support")
    sl = round(nearest_sup * 0.98, 2) if nearest_sup and price > 0 else round(price * 0.96, 2)
    risk = price - sl if sl < price else price * 0.04
    reward = target1 - price if target1 > price else price * 0.03
    rr = round(reward / risk, 1) if risk > 0 else 1.0

    confidence = min(int(total), 10)
    if rr < 1.5: confidence = min(confidence, 6)

    reason_parts = []
    if indicators.get("above_ema_20") and indicators.get("above_ema_50"):
        reason_parts.append("Price above EMA20/EMA50")
    if vol_ratio > 1.5:
        reason_parts.append(f"Volume {vol_ratio}x avg")
    if rsi > 55:
        reason_parts.append(f"RSI {rsi} strength")
    if indicators.get("macd_hist", 0) > 0:
        reason_parts.append("MACD positive")
    if indicators.get("adx", 0) > 25:
        reason_parts.append(f"ADX {indicators['adx']} strong trend")

    return {
        "stock": symbol.replace(".NS", ""),
        "symbol": symbol,
        "signal": "BUY",
        "confidence": confidence,
        "entry": f"{round(price * 1.005, 2)}",
        "stop_loss": str(sl),
        "targets": [target1, target2],
        "risk_reward": f"1:{rr}",
        "current_price": price,
        "reason": ". ".join(reason_parts) if reason_parts else "Technical setup favorable",
        "sector": "Unknown",
        "structure_score": round(structure, 1),
        "volume_score": round(volume, 1),
        "indicator_score": round(indicator, 1),
        "sentiment_score": round(sentiment, 1),
        "indicators": indicators,
        "support_resistance": sr,
        "timestamp": datetime.utcnow().isoformat(),
    }


def run_full_scan():
    sectors = analyze_sectors()
    hot_stocks = []
    for sector in sectors[:3]:
        mapped = SECTOR_NAME_MAP.get(sector["name"], "")
        if mapped in SECTOR_STOCKS:
            hot_stocks.extend(SECTOR_STOCKS[mapped])
    all_symbols = list(set(hot_stocks + HIGH_MOMENTUM_WATCHLIST))

    signals = []
    scanned = 0
    for symbol in all_symbols[:40]:
        try:
            result = scan_stock(symbol)
            if result:
                scanned += 1
                if result["confidence"] >= 7:
                    signals.append(result)
        except Exception:
            pass

    signals.sort(key=lambda x: x["confidence"], reverse=True)

    # Market overview
    overview = {}
    nifty = get_stock_data("^NSEI", period="2d", interval="1d", min_rows=1)
    if nifty is not None and len(nifty) >= 1:
        c = nifty["Close"]
        overview["nifty"] = round(float(c.iloc[-1]), 2)
        overview["nifty_change"] = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2) if len(c) >= 2 else 0.0
    sensex = get_stock_data("^BSESN", period="2d", interval="1d", min_rows=1)
    if sensex is not None and len(sensex) >= 1:
        c = sensex["Close"]
        overview["sensex"] = round(float(c.iloc[-1]), 2)
        overview["sensex_change"] = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2) if len(c) >= 2 else 0.0
    vix = get_stock_data("INDIAVIX.NS", period="2d", interval="1d", min_rows=1)
    if vix is not None and len(vix) >= 1:
        c = vix["Close"]
        overview["vix"] = round(float(c.iloc[-1]), 2)
        overview["vix_change"] = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2) if len(c) >= 2 else 0.0

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "sectors_analyzed": len(sectors),
        "stocks_scanned": scanned,
        "signals_generated": len(signals),
        "top_sectors": sectors[:5],
        "signals": signals,
        "market_overview": overview,
    }
