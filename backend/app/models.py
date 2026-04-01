from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SectorScore(BaseModel):
    name: str
    score: float
    momentum: float
    volume_expansion: float
    sentiment: float
    relative_strength: float
    change_pct: float
    reason: str
    timestamp: str


class TradeSignal(BaseModel):
    stock: str
    symbol: str
    signal: str
    confidence: int
    entry: str
    stop_loss: str
    targets: list[float]
    risk_reward: str
    current_price: float
    reason: str
    sector: str
    structure_score: float
    volume_score: float
    indicator_score: float
    sentiment_score: float
    timestamp: str


class MarketOverview(BaseModel):
    nifty: Optional[float]
    nifty_change: Optional[float]
    sensex: Optional[float]
    sensex_change: Optional[float]
    vix: Optional[float]
    vix_change: Optional[float]
    advance: Optional[int]
    decline: Optional[int]
    timestamp: str


class NewsItem(BaseModel):
    title: str
    source: str
    url: str
    published_at: str
    sentiment: str
    summary: str
