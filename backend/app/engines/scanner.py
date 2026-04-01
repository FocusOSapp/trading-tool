from app.engines.market_data import MarketDataEngine
from app.engines.news_sentiment import NewsSentimentEngine
from app.config import HIGH_MOMENTUM_WATCHLIST, SECTOR_STOCKS, SECTOR_NAME_MAP
from app.core.state import get_state
from datetime import datetime
import uuid


class StockScanner:
    def __init__(self):
        self.data_engine = MarketDataEngine()
        self.sentiment = NewsSentimentEngine()

    def scan_stock(self, symbol: str) -> dict:
        df = self.data_engine.get_stock_data(symbol, period="6mo", interval="1d")
        if df is None or len(df) < 50:
            return None

        indicators = self.data_engine.compute_indicators(df)
        sr = self.data_engine.find_support_resistance(df)
        info = self.data_engine.get_stock_info(symbol)

        structure_score = self._score_structure(indicators, sr)
        volume_score = self._score_volume(indicators)
        indicator_score = self._score_indicators(indicators)

        sentiment_score = 1.0
        try:
            stock_name = symbol.replace(".NS", "")
            sentiment_result = self.sentiment.get_sentiment(stock_name)
            sentiment_score = sentiment_result.get("score", 1.0)
        except Exception:
            pass

        total = structure_score + volume_score + indicator_score + sentiment_score

        return {
            "symbol": symbol,
            "name": info.get("name", symbol),
            "sector": info.get("sector", "Unknown"),
            "indicators": indicators,
            "support_resistance": sr,
            "scores": {
                "structure": round(structure_score, 1),
                "volume": round(volume_score, 1),
                "indicators": round(indicator_score, 1),
                "sentiment": round(sentiment_score, 1),
                "total": round(total, 1),
            },
        }

    def _score_structure(self, indicators: dict, sr: dict) -> float:
        score = 0.0
        if not indicators: return 0.0
        price = indicators.get("current_price", 0)
        if indicators.get("above_ema_20"): score += 0.5
        if indicators.get("above_ema_50"): score += 0.5
        if indicators.get("above_ema_200"): score += 0.5
        if indicators.get("ema_20_50_bullish"): score += 0.5
        if indicators.get("golden_cross"): score += 0.5
        nearest_res = sr.get("nearest_resistance")
        if nearest_res and price > 0:
            distance = ((nearest_res - price) / price) * 100
            if 0 < distance < 3: score += 0.5
        day_change = indicators.get("day_change_pct", 0)
        if day_change > 2: score += 0.5
        return min(score, 3.0)

    def _score_volume(self, indicators: dict) -> float:
        score = 0.0
        if not indicators: return 0.0
        vol_ratio = indicators.get("volume_ratio", 1)
        if vol_ratio > 2.5: score += 1.5
        elif vol_ratio > 2.0: score += 1.2
        elif vol_ratio > 1.5: score += 1.0
        elif vol_ratio > 1.2: score += 0.7
        elif vol_ratio > 1.0: score += 0.5
        day_change = indicators.get("day_change_pct", 0)
        if day_change > 2 and vol_ratio > 1.5: score += 1.0
        elif day_change > 1 and vol_ratio > 1.2: score += 0.5
        return min(score, 3.0)

    def _score_indicators(self, indicators: dict) -> float:
        score = 0.0
        if not indicators: return 0.0
        rsi = indicators.get("rsi_14", 50)
        if 55 <= rsi <= 70: score += 0.8
        elif 70 < rsi <= 80: score += 0.5
        elif rsi > 80: score += 0.2
        elif 40 <= rsi < 55: score += 0.3
        macd_hist = indicators.get("macd_hist", 0)
        if macd_hist and macd_hist > 0: score += 0.5
        macd = indicators.get("macd", 0)
        macd_signal = indicators.get("macd_signal", 0)
        if macd and macd_signal and macd > macd_signal: score += 0.4
        adx = indicators.get("adx", 0)
        if adx and adx > 25: score += 0.3
        return min(score, 2.0)

    def batch_scan(self, symbols: list) -> list:
        results = []
        for symbol in symbols[:40]:
            try:
                result = self.scan_stock(symbol)
                if result and result["scores"]["total"] >= 5.0:
                    results.append(result)
            except Exception as e:
                print(f"Error scanning {symbol}: {e}")
        results.sort(key=lambda x: x["scores"]["total"], reverse=True)
        return results


class TradeSignalGenerator:
    def __init__(self):
        self.scanner = StockScanner()

    def generate_signals(self, scanned_stocks: list, min_confidence: int = 7) -> list:
        signals = []
        for stock in scanned_stocks:
            total_score = stock["scores"]["total"]
            if total_score < 5.0: continue
            signal = self._build_signal(stock)
            if signal["confidence"] >= min_confidence:
                signals.append(signal)
        signals.sort(key=lambda x: x["confidence"], reverse=True)
        return signals

    def _build_signal(self, stock: dict) -> dict:
        indicators = stock["indicators"]
        sr = stock["support_resistance"]
        scores = stock["scores"]
        price = indicators.get("current_price", 0)

        nearest_res = sr.get("nearest_resistance")
        nearest_sup = sr.get("nearest_support")

        if nearest_res and price > 0:
            target1 = round(nearest_res, 2)
            target2 = round(nearest_res * 1.05, 2)
        else:
            target1 = round(price * 1.03, 2)
            target2 = round(price * 1.07, 2)

        if nearest_sup and price > 0:
            sl = round(nearest_sup * 0.98, 2)
        else:
            sl = round(price * 0.96, 2)

        risk = price - sl if sl < price else price * 0.04
        reward = target1 - price if target1 > price else price * 0.03
        rr = round(reward / risk, 1) if risk > 0 else 1.0

        confidence = min(int(scores["total"]), 10)
        if rr < 1.5: confidence = min(confidence, 6)

        symbol = stock["symbol"]
        reason_parts = []
        if indicators.get("above_ema_20") and indicators.get("above_ema_50"):
            reason_parts.append("Price above EMA20 and EMA50")
        if indicators.get("volume_ratio", 1) > 1.5:
            reason_parts.append(f"Volume {indicators['volume_ratio']}x average")
        if indicators.get("rsi_14", 50) > 55:
            reason_parts.append(f"RSI at {indicators['rsi_14']} showing strength")
        if indicators.get("macd_hist", 0) > 0:
            reason_parts.append("MACD histogram positive")
        if indicators.get("adx", 0) > 25:
            reason_parts.append(f"ADX at {indicators['adx']} strong trend")

        return {
            "stock": stock.get("name", symbol),
            "symbol": symbol,
            "signal": "BUY",
            "confidence": confidence,
            "entry": f"{round(price * 1.005, 2)} (market open)",
            "stop_loss": str(sl),
            "targets": [target1, target2],
            "risk_reward": f"1:{rr}",
            "current_price": price,
            "reason": ". ".join(reason_parts) if reason_parts else "Technical setup favorable",
            "sector": stock.get("sector", "Unknown"),
            "structure_score": scores["structure"],
            "volume_score": scores["volume"],
            "indicator_score": scores["indicators"],
            "sentiment_score": scores["sentiment"],
            "timestamp": datetime.utcnow().isoformat(),
        }


class TradingEngine:
    def __init__(self):
        self.scanner = StockScanner()
        self.signal_gen = TradeSignalGenerator()

    async def run_full_scan(self) -> dict:
        state = get_state()
        state.update_status(status="scanning")
        scan_id = str(uuid.uuid4())[:8]

        from app.engines.sector_intelligence import SectorIntelligenceEngine
        sector_engine = SectorIntelligenceEngine()
        top_sectors = sector_engine.analyze_sectors()
        hot_stocks = sector_engine.get_hot_sector_stocks()

        all_symbols = list(set(hot_stocks + HIGH_MOMENTUM_WATCHLIST))
        scanned = self.scanner.batch_scan(all_symbols)
        signals = self.signal_gen.generate_signals(scanned)

        state.add_signals(signals)

        # Market overview
        overview = self.scanner.data_engine.get_market_overview()
        state.set_market_overview(overview)

        # News
        news = self.scanner.sentiment.get_market_news()
        state.set_news(news)

        result = {
            "scan_id": scan_id,
            "timestamp": datetime.utcnow().isoformat(),
            "sectors_analyzed": len(top_sectors),
            "stocks_scanned": len(scanned),
            "signals_generated": len(signals),
            "top_sectors": top_sectors[:5],
            "signals": signals,
            "market_overview": overview,
        }

        state.add_scan_result(result)
        state.update_status(status="idle")

        from app.websocket.manager import manager
        await manager.broadcast({"type": "scan_complete", "data": result})

        return result

    async def analyze_single_stock(self, symbol: str) -> dict:
        if not symbol.endswith(".NS"):
            symbol = f"{symbol}.NS"
        result = self.scanner.scan_stock(symbol)
        if result:
            signals = self.signal_gen.generate_signals([result], min_confidence=1)
            result["signal"] = signals[0] if signals else None
        return result
