import yfinance as yf
import pandas as pd
import numpy as np
import ta
import requests
import httpx
from datetime import datetime, timedelta
from typing import Optional
from bs4 import BeautifulSoup


class MarketDataEngine:
    def __init__(self):
        self._cache = {}
        self._cache_ttl = 300

    def get_stock_data(
        self, symbol: str, period: str = "3mo", interval: str = "1d", min_rows: int = 2
    ) -> Optional[pd.DataFrame]:
        cache_key = f"{symbol}_{period}_{interval}"
        if cache_key in self._cache:
            data, ts = self._cache[cache_key]
            if (datetime.utcnow() - ts).total_seconds() < self._cache_ttl:
                return data

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
            self._cache[cache_key] = (df, datetime.utcnow())
            return df
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            return None

    def get_stock_info(self, symbol: str) -> dict:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            return {
                "name": info.get("shortName", symbol),
                "sector": info.get("sector", "Unknown"),
                "industry": info.get("industry", "Unknown"),
                "market_cap": info.get("marketCap", 0),
                "volume": info.get("volume", 0),
                "avg_volume": info.get("averageVolume", 0),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh", 0),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow", 0),
            }
        except Exception:
            return {"name": symbol, "sector": "Unknown", "industry": "Unknown"}

    def get_sector_performance(self) -> dict:
        from app.config import SECTOR_INDICES
        results = {}
        for name, ticker in SECTOR_INDICES.items():
            try:
                data = self.get_stock_data(ticker, period="1mo", interval="1d", min_rows=2)
                if data is not None and len(data) >= 2:
                    close = data["Close"]
                    change_pct = ((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2]) * 100
                    volume = data["Volume"].iloc[-1]
                    avg_volume = data["Volume"].mean()
                    volume_ratio = volume / avg_volume if avg_volume > 0 else 1
                    results[name] = {
                        "change_pct": round(change_pct, 2),
                        "volume": int(volume),
                        "avg_volume": int(avg_volume),
                        "volume_ratio": round(volume_ratio, 2),
                        "current_price": round(float(close.iloc[-1]), 2),
                    }
            except Exception as e:
                print(f"Error fetching sector {name}: {e}")
        return results

    def get_market_overview(self) -> dict:
        overview = {}
        try:
            nifty = self.get_stock_data("^NSEI", period="2d", interval="1d", min_rows=1)
            if nifty is not None and len(nifty) >= 1:
                c = nifty["Close"]
                overview["nifty"] = round(float(c.iloc[-1]), 2)
                if len(c) >= 2:
                    overview["nifty_change"] = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2)
                else:
                    overview["nifty_change"] = 0.0
        except Exception:
            pass

        try:
            sensex = self.get_stock_data("^BSESN", period="2d", interval="1d", min_rows=1)
            if sensex is not None and len(sensex) >= 1:
                c = sensex["Close"]
                overview["sensex"] = round(float(c.iloc[-1]), 2)
                if len(c) >= 2:
                    overview["sensex_change"] = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2)
                else:
                    overview["sensex_change"] = 0.0
        except Exception:
            pass

        try:
            vix = self.get_stock_data("INDIAVIX.NS", period="2d", interval="1d", min_rows=1)
            if vix is not None and len(vix) >= 1:
                c = vix["Close"]
                overview["vix"] = round(float(c.iloc[-1]), 2)
                if len(c) >= 2:
                    overview["vix_change"] = round(((c.iloc[-1] - c.iloc[-2]) / c.iloc[-2]) * 100, 2)
                else:
                    overview["vix_change"] = 0.0
        except Exception:
            pass

        overview["timestamp"] = datetime.utcnow().isoformat()
        return overview

    def compute_indicators(self, df: pd.DataFrame) -> dict:
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
            "bb_width": round(float(bb.bollinger_wband().iloc[-1]), 4) if not bb.bollinger_wband().empty else None,
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

        volume_ratio = current["volume"] / current["avg_volume_20"] if current["avg_volume_20"] > 0 else 1
        current["volume_ratio"] = round(volume_ratio, 2)

        price = current["current_price"]
        current["above_ema_20"] = price > (current["ema_20"] or 0)
        current["above_ema_50"] = price > (current["ema_50"] or 0)
        current["above_ema_200"] = price > (current["ema_200"] or 0)
        current["above_vwap"] = price > (current["vwap"] or 0)
        current["ema_20_50_bullish"] = (current["ema_20"] or 0) > (current["ema_50"] or 0)
        current["golden_cross"] = (current["ema_50"] or 0) > (current["ema_200"] or 0)

        if len(df) >= 2:
            current["day_change_pct"] = round(((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2]) * 100, 2)
        else:
            current["day_change_pct"] = 0

        if len(df) >= 5:
            current["week_change_pct"] = round(((close.iloc[-1] - close.iloc[-5]) / close.iloc[-5]) * 100, 2)
        else:
            current["week_change_pct"] = 0

        if len(df) >= 20:
            current["month_change_pct"] = round(((close.iloc[-1] - close.iloc[-20]) / close.iloc[-20]) * 100, 2)
        else:
            current["month_change_pct"] = 0

        return current

    def find_support_resistance(self, df: pd.DataFrame, lookback: int = 60) -> dict:
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
            "resistance": resistance_levels,
            "support": support_levels,
            "nearest_resistance": resistance_levels[0] if resistance_levels else None,
            "nearest_support": support_levels[-1] if support_levels else None,
        }

    def get_nse_top_gainers(self) -> list:
        try:
            url = "https://www.nseindia.com/api/live-analysis-variation?index=TOP%20GAINERS"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
            }
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if "data" in data:
                    return data["data"][:10]
        except Exception as e:
            print(f"NSE gainers error: {e}")

        try:
            url = "https://www.moneycontrol.com/stocks/marketstats/nsegainer/index.php"
            headers = {"User-Agent": "Mozilla/5.0"}
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "lxml")
                rows = soup.find_all("tr")
                gainers = []
                for row in rows[1:11]:
                    cells = row.find_all("td")
                    if len(cells) >= 5:
                        gainers.append({
                            "symbol": cells[1].text.strip() + ".NS",
                            "price": cells[2].text.strip(),
                            "change": cells[3].text.strip(),
                            "change_pct": cells[4].text.strip(),
                        })
                return gainers
        except Exception as e:
            print(f"Moneycontrol gainers error: {e}")

        return []

    def get_nse_top_losers(self) -> list:
        try:
            url = "https://www.nseindia.com/api/live-analysis-variation?index=TOP%20LOSERS"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
            }
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if "data" in data:
                    return data["data"][:10]
        except Exception as e:
            print(f"NSE losers error: {e}")
        return []

    def get_fii_dii_data(self) -> dict:
        try:
            url = "https://www.nseindia.com/api/fandd-equity"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
            }
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
