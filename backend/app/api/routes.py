from fastapi import APIRouter
from app.engines.scanner import TradingEngine
from app.engines.market_data import MarketDataEngine
from app.engines.news_sentiment import NewsSentimentEngine
from app.core.state import get_state
from app.config import HIGH_MOMENTUM_WATCHLIST, SECTOR_STOCKS

router = APIRouter()
engine = TradingEngine()
data_engine = MarketDataEngine()
news_engine = NewsSentimentEngine()


@router.get("/health")
async def health():
    return {"status": "running", "mode": "autonomous"}


@router.get("/status")
async def status():
    state = get_state()
    return state.get_status()


@router.get("/sectors")
async def get_sectors():
    state = get_state()
    return {"sectors": state.get_latest_sectors()}


@router.get("/signals")
async def get_signals():
    state = get_state()
    return {"signals": state.get_all_signals()}


@router.get("/signals/recent")
async def get_recent_signals(limit: int = 10):
    state = get_state()
    return {"signals": state.get_recent_signals(limit)}


@router.post("/scan/trigger")
async def trigger_scan():
    result = await engine.run_full_scan()
    return result


@router.get("/stock/{symbol}")
async def get_stock_analysis(symbol: str):
    result = await engine.analyze_single_stock(symbol.upper())
    return result


@router.get("/market/overview")
async def market_overview():
    state = get_state()
    overview = state.get_market_overview()
    if not overview:
        overview = data_engine.get_market_overview()
        state.set_market_overview(overview)
    return overview


@router.get("/market/gainers")
async def top_gainers():
    return {"gainers": data_engine.get_nse_top_gainers()}


@router.get("/market/losers")
async def top_losers():
    return {"losers": data_engine.get_nse_top_losers()}


@router.get("/market/fii-dii")
async def fii_dii():
    return data_engine.get_fii_dii_data()


@router.get("/news")
async def get_news():
    state = get_state()
    news = state.get_news()
    if not news:
        news = news_engine.get_market_news()
        state.set_news(news)
    return {"news": news}


@router.get("/watchlist")
async def get_watchlist():
    return {
        "high_momentum": HIGH_MOMENTUM_WATCHLIST,
        "by_sector": SECTOR_STOCKS,
    }


@router.get("/scans/history")
async def scan_history():
    state = get_state()
    return {"history": state.get_scan_history()}
