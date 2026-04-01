from app.engines.market_data import MarketDataEngine
from app.config import SECTOR_NAME_MAP, SECTOR_STOCKS
from app.core.state import get_state
from datetime import datetime


class SectorIntelligenceEngine:
    def __init__(self):
        self.data_engine = MarketDataEngine()

    def analyze_sectors(self) -> list:
        sector_perf = self.data_engine.get_sector_performance()
        scored_sectors = []

        nifty_data = self.data_engine.get_stock_data("^NSEI", period="1mo", interval="1d", min_rows=2)
        nifty_change = 0
        if nifty_data is not None and len(nifty_data) >= 2:
            close = nifty_data["Close"]
            nifty_change = ((close.iloc[-1] - close.iloc[-2]) / close.iloc[-2]) * 100

        for name, perf in sector_perf.items():
            change = perf["change_pct"]
            vol_ratio = perf["volume_ratio"]

            momentum_score = self._score_momentum(change, nifty_change)
            volume_score = self._score_volume(vol_ratio)
            sentiment_score = self._score_sentiment(change)
            rs_score = self._score_relative_strength(change, nifty_change)

            total = momentum_score + volume_score + sentiment_score + rs_score
            reason = self._generate_reason(name, change, vol_ratio, nifty_change)

            scored_sectors.append({
                "name": name,
                "score": round(total, 1),
                "momentum": round(momentum_score, 1),
                "volume_expansion": round(volume_score, 1),
                "sentiment": round(sentiment_score, 1),
                "relative_strength": round(rs_score, 1),
                "change_pct": round(change, 2),
                "reason": reason,
                "timestamp": datetime.utcnow().isoformat(),
            })

        scored_sectors.sort(key=lambda x: x["score"], reverse=True)
        get_state().store_sectors(scored_sectors)
        return scored_sectors

    def _score_momentum(self, change: float, nifty_change: float) -> float:
        if change > 3: return 3.0
        elif change > 2: return 2.5
        elif change > 1: return 2.0
        elif change > 0: return 1.0
        else: return 0.0

    def _score_volume(self, vol_ratio: float) -> float:
        if vol_ratio > 2.0: return 3.0
        elif vol_ratio > 1.5: return 2.5
        elif vol_ratio > 1.2: return 2.0
        elif vol_ratio > 1.0: return 1.0
        else: return 0.5

    def _score_sentiment(self, change: float) -> float:
        if change > 2: return 2.0
        elif change > 1: return 1.5
        elif change > 0: return 1.0
        else: return 0.5

    def _score_relative_strength(self, change: float, nifty_change: float) -> float:
        outperformance = change - nifty_change
        if outperformance > 2: return 2.0
        elif outperformance > 1: return 1.5
        elif outperformance > 0: return 1.0
        else: return 0.0

    def _generate_reason(self, name: str, change: float, vol_ratio: float, nifty_change: float) -> str:
        outperformance = change - nifty_change
        parts = []
        if change > 2: parts.append(f"Strong momentum at +{change:.1f}%")
        elif change > 0: parts.append(f"Positive at +{change:.1f}%")
        else: parts.append(f"Weak at {change:.1f}%")
        if vol_ratio > 1.5: parts.append(f"volume surge {vol_ratio:.1f}x avg")
        if outperformance > 1: parts.append(f"outperforming Nifty by {outperformance:.1f}%")
        return ". ".join(parts) if parts else "No significant movement"

    def get_top_sectors(self, n: int = 3) -> list:
        sectors = self.analyze_sectors()
        return sectors[:n]

    def get_hot_sector_stocks(self, n: int = 3) -> list:
        top_sectors = self.get_top_sectors(n)
        stocks = []
        for sector in top_sectors:
            mapped_name = SECTOR_NAME_MAP.get(sector["name"], "")
            if mapped_name and mapped_name in SECTOR_STOCKS:
                stocks.extend(SECTOR_STOCKS[mapped_name])
        return list(dict.fromkeys(stocks))[:40]
