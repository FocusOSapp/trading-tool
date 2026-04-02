// ==================== MULTI-SOURCE API SERVICE ====================
// Fetches real market data from free APIs with fallback to demo data

const API_KEYS = {
  TWELVE_DATA: process.env.REACT_APP_TWELVE_DATA_KEY || '',
  FINNHUB: process.env.REACT_APP_FINNHUB_KEY || '',
  ALPHA_VANTAGE: process.env.REACT_APP_ALPHA_VANTAGE_KEY || '',
  NEWS_API: process.env.REACT_APP_NEWS_API_KEY || '743ba73c1809423fb1e87f920772e80f',
};

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Cache with TTL
const cache = {};
function getCached(key, ttl = 60000) {
  const item = cache[key];
  if (item && Date.now() - item.timestamp < ttl) return item.data;
  return null;
}
function setCache(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

// ==================== TWELVE DATA ====================
async function fetchTwelveData(symbol, interval = '1day', outputsize = 30) {
  if (!API_KEYS.TWELVE_DATA) return null;
  const cacheKey = `twelve_${symbol}_${interval}`;
  const cached = getCached(cacheKey, 120000);
  if (cached) return cached;

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEYS.TWELVE_DATA}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.status === 'ok' || data.values) {
      setCache(cacheKey, data);
      return data;
    }
  } catch (e) { console.error('Twelve Data error:', e); }
  return null;
}

async function fetchTwelveQuote(symbol) {
  if (!API_KEYS.TWELVE_DATA) return null;
  const cacheKey = `twelve_quote_${symbol}`;
  const cached = getCached(cacheKey, 30000);
  if (cached) return cached;

  try {
    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${API_KEYS.TWELVE_DATA}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data && data.close) {
      setCache(cacheKey, data);
      return data;
    }
  } catch (e) { console.error('Twelve Data quote error:', e); }
  return null;
}

// ==================== FINNHUB ====================
async function fetchFinnhubQuote(symbol) {
  if (!API_KEYS.FINNHUB) return null;
  const cacheKey = `finnhub_${symbol}`;
  const cached = getCached(cacheKey, 30000);
  if (cached) return cached;

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEYS.FINNHUB}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data && data.c) {
      setCache(cacheKey, data);
      return data;
    }
  } catch (e) { console.error('Finnhub error:', e); }
  return null;
}

async function fetchFinnhubNews() {
  if (!API_KEYS.FINNHUB) return null;
  const cacheKey = 'finnhub_news';
  const cached = getCached(cacheKey, 300000);
  if (cached) return cached;

  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const url = `https://finnhub.io/api/v1/company-news?symbol=AAPL&from=${weekAgo}&to=${today}&token=${API_KEYS.FINNHUB}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (Array.isArray(data)) {
      setCache(cacheKey, data);
      return data;
    }
  } catch (e) { console.error('Finnhub news error:', e); }
  return null;
}

// ==================== ALPHA VANTAGE ====================
async function fetchAlphaVantage(functionName, symbol) {
  if (!API_KEYS.ALPHA_VANTAGE) return null;
  const cacheKey = `av_${functionName}_${symbol}`;
  const cached = getCached(cacheKey, 300000);
  if (cached) return cached;

  try {
    const url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbol}&apikey=${API_KEYS.ALPHA_VANTAGE}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data && !data['Error Message'] && !data['Note']) {
      setCache(cacheKey, data);
      return data;
    }
  } catch (e) { console.error('Alpha Vantage error:', e); }
  return null;
}

// ==================== YAHOO FINANCE (via CORS proxy) ====================
async function fetchYahooFinance(symbol) {
  const cacheKey = `yahoo_${symbol}`;
  const cached = getCached(cacheKey, 60000);
  if (cached) return cached;

  try {
    const targetUrl = encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1mo&interval=1d`);
    const resp = await fetch(`${CORS_PROXY}${targetUrl}`);
    const data = await resp.json();
    if (data && data.chart && data.chart.result) {
      setCache(cacheKey, data);
      return data;
    }
  } catch (e) { console.error('Yahoo Finance error:', e); }
  return null;
}

// ==================== NEWSAPI ====================
async function fetchNewsAPI() {
  if (!API_KEYS.NEWS_API) return null;
  const cacheKey = 'news_api';
  const cached = getCached(cacheKey, 300000);
  if (cached) return cached;

  try {
    const url = `https://newsapi.org/v2/top-headlines?country=in&category=business&pageSize=15&apiKey=${API_KEYS.NEWS_API}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.status === 'ok' && data.articles) {
      setCache(cacheKey, data.articles);
      return data.articles;
    }
  } catch (e) { console.error('NewsAPI error:', e); }
  return null;
}

// ==================== MONEYCONTROL (scraped via CORS proxy) ====================
async function fetchMoneycontrol() {
  const cacheKey = 'moneycontrol';
  const cached = getCached(cacheKey, 300000);
  if (cached) return cached;

  try {
    const targetUrl = encodeURIComponent('https://www.moneycontrol.com/news/business/markets/');
    const resp = await fetch(`${CORS_PROXY}${targetUrl}`);
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const articles = [];
    const items = doc.querySelectorAll('.listing');
    items.forEach(item => {
      const titleEl = item.querySelector('a');
      if (titleEl) {
        articles.push({
          title: titleEl.textContent.trim(),
          url: titleEl.href,
          source: 'Moneycontrol',
          published_at: new Date().toISOString(),
          sentiment: 'neutral',
          category: 'markets',
        });
      }
    });
    if (articles.length > 0) {
      setCache(cacheKey, articles);
      return articles;
    }
  } catch (e) { console.error('Moneycontrol error:', e); }
  return null;
}

// ==================== DATA PROCESSORS ====================
function processSectors(yahooData) {
  const sectorSymbols = {
    'NIFTY AUTO': '^CNXAUTO', 'NIFTY METAL': '^CNXMETAL', 'NIFTY IT': '^CNXIT',
    'NIFTY PHARMA': '^CNXPHARMA', 'NIFTY FMCG': '^CNXFMCG', 'NIFTY PSU BANK': '^CNXPSUBANK',
    'NIFTY REALTY': '^CNXREALTY', 'NIFTY INFRA': '^CNXINFRA', 'NIFTY ENERGY': '^CNXENERGY',
    'NIFTY MEDIA': '^CNXMEDIA', 'NIFTY50': '^NSEI',
  };
  // Process from Twelve Data or Yahoo
  return [];
}

function processSignals(quotes) {
  const signals = [];
  // Process quotes and generate signals
  return signals;
}

// ==================== MAIN FETCH ALL ====================
export async function fetchAllMarketData() {
  const [
    niftyQuote,
    sensexQuote,
    vixQuote,
    newsArticles,
    moneycontrolNews,
    finnhubNews,
  ] = await Promise.all([
    fetchTwelveQuote('NIFTY50.NS') || fetchYahooFinance('^NSEI'),
    fetchTwelveQuote('SENSEX.NS') || fetchYahooFinance('^BSESN'),
    fetchTwelveQuote('INDIAVIX.NS') || fetchYahooFinance('INDIAVIX.NS'),
    fetchNewsAPI(),
    fetchMoneycontrol(),
    fetchFinnhubNews(),
  ]);

  return {
    overview: {
      nifty: niftyQuote?.close || niftyQuote?.chart?.result?.[0]?.meta?.regularMarketPrice || null,
      nifty_change: niftyQuote?.change_percent || null,
      sensex: sensexQuote?.close || null,
      sensex_change: sensexQuote?.change_percent || null,
      vix: vixQuote?.close || null,
      vix_change: vixQuote?.change_percent || null,
    },
    news: [...(newsArticles || []), ...(moneycontrolNews || [])].slice(0, 15),
  };
}

export {
  fetchTwelveData,
  fetchTwelveQuote,
  fetchFinnhubQuote,
  fetchFinnhubNews,
  fetchAlphaVantage,
  fetchYahooFinance,
  fetchNewsAPI,
  fetchMoneycontrol,
};
