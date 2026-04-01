import requests
import httpx
from datetime import datetime, timedelta
from bs4 import BeautifulSoup


class NewsSentimentEngine:
    def __init__(self):
        self._cache = {}

    def get_sentiment(self, stock_name: str) -> dict:
        cache_key = f"{stock_name}_{datetime.utcnow().date()}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        articles = []
        positive_count = 0
        negative_count = 0

        # Source 1: Google News RSS (free, no API key)
        try:
            url = f"https://news.google.com/rss/search?q={stock_name}+stock+India&hl=en-IN&gl=IN&ceid=IN:en"
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                items = soup.find_all("item")[:5]
                for item in items:
                    title = item.find("title").text if item.find("title") else ""
                    source = item.find("source").text if item.find("source") else ""
                    link = item.find("link").text if item.find("link") else ""
                    pub_date = item.find("pubDate").text if item.find("pubDate") else ""

                    sentiment = self._analyze_text_sentiment(title)
                    if sentiment == "positive":
                        positive_count += 1
                    elif sentiment == "negative":
                        negative_count += 1

                    articles.append({
                        "title": title,
                        "source": source,
                        "url": link,
                        "published_at": pub_date,
                        "sentiment": sentiment,
                    })
        except Exception as e:
            print(f"Google News error: {e}")

        # Source 2: Moneycontrol (free scraping)
        try:
            url = f"https://www.moneycontrol.com/news/tags/{stock_name.lower()}.html"
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "lxml")
                for item in soup.find_all("li", class_="clearfix")[:3]:
                    title_el = item.find("a")
                    if title_el:
                        title = title_el.text.strip()
                        link = title_el.get("href", "")
                        sentiment = self._analyze_text_sentiment(title)
                        if sentiment == "positive":
                            positive_count += 1
                        elif sentiment == "negative":
                            negative_count += 1
                        articles.append({
                            "title": title,
                            "source": "Moneycontrol",
                            "url": link,
                            "published_at": datetime.utcnow().isoformat(),
                            "sentiment": sentiment,
                        })
        except Exception as e:
            print(f"Moneycontrol error: {e}")

        # Source 3: NewsAPI.org (if key provided)
        from app.config import NEWS_API_KEY
        if NEWS_API_KEY and NEWS_API_KEY != "your_news_api_key_here":
            try:
                url = "https://newsapi.org/v2/everything"
                params = {
                    "q": f"{stock_name} stock India",
                    "language": "en",
                    "sortBy": "publishedAt",
                    "pageSize": 3,
                    "apiKey": NEWS_API_KEY,
                    "from": (datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d"),
                }
                resp = requests.get(url, params=params, timeout=10)
                data = resp.json()
                if data.get("status") == "ok" and data.get("articles"):
                    for article in data["articles"][:3]:
                        title = article.get("title", "")
                        sentiment = self._analyze_text_sentiment(title)
                        if sentiment == "positive":
                            positive_count += 1
                        elif sentiment == "negative":
                            negative_count += 1
                        articles.append({
                            "title": title,
                            "source": article.get("source", {}).get("name", ""),
                            "url": article.get("url", ""),
                            "published_at": article.get("publishedAt", ""),
                            "sentiment": sentiment,
                        })
            except Exception as e:
                print(f"NewsAPI error: {e}")

        total = positive_count + negative_count
        if total == 0:
            score = 1.0
            sentiment_label = "neutral"
        else:
            score = 1.0 + (positive_count - negative_count) / max(total, 1) * 0.5
            if score > 1.2:
                sentiment_label = "positive"
            elif score < 0.8:
                sentiment_label = "negative"
            else:
                sentiment_label = "neutral"

        result = {
            "score": round(score, 2),
            "sentiment": sentiment_label,
            "articles": articles[:8],
            "positive": positive_count,
            "negative": negative_count,
        }

        self._cache[cache_key] = result
        return result

    def _analyze_text_sentiment(self, text: str) -> str:
        text = text.lower()
        positive_words = ["surge", "rally", "gain", "buy", "upgrade", "bullish", "breakout", "rise", "profit", "growth", "strong", "beat", "record", "high", "jump", "soar", "outperform", "positive"]
        negative_words = ["crash", "fall", "sell", "downgrade", "bearish", "loss", "decline", "weak", "miss", "low", "drop", "plunge", "warning", "risk", "concern", "negative", "down"]

        pos = sum(1 for w in positive_words if w in text)
        neg = sum(1 for w in negative_words if w in text)

        if pos > neg:
            return "positive"
        elif neg > pos:
            return "negative"
        return "neutral"

    def get_market_news(self) -> list:
        news = []

        # Google News - India business
        try:
            url = "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FuQjBHZ0pRVkNnQVAB?hl=en-IN&gl=IN&ceid=IN:en"
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                for item in soup.find_all("item")[:10]:
                    title = item.find("title").text if item.find("title") else ""
                    source = item.find("source").text if item.find("source") else ""
                    link = item.find("link").text if item.find("link") else ""
                    pub_date = item.find("pubDate").text if item.find("pubDate") else ""
                    news.append({
                        "title": title,
                        "source": source,
                        "url": link,
                        "published_at": pub_date,
                        "sentiment": self._analyze_text_sentiment(title),
                    })
        except Exception as e:
            print(f"Google News market error: {e}")

        # Moneycontrol top news
        try:
            url = "https://www.moneycontrol.com/news/"
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "lxml")
                for item in soup.find_all("li", class_="clearfix")[:5]:
                    title_el = item.find("a")
                    if title_el:
                        title = title_el.text.strip()
                        link = title_el.get("href", "")
                        news.append({
                            "title": title,
                            "source": "Moneycontrol",
                            "url": link,
                            "published_at": datetime.utcnow().isoformat(),
                            "sentiment": self._analyze_text_sentiment(title),
                        })
        except Exception as e:
            print(f"Moneycontrol market news error: {e}")

        return news[:15]
