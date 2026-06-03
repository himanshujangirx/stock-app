# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
import yfinance as yf
# pyrefly: ignore [missing-import]
import pandas as pd
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

# ============================================
# APP SETUP
# ============================================

app = FastAPI(
    title="Stock Dashboard API",
    description="Indian Stock Market Data API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

MARKET_TZ = ZoneInfo("Asia/Kolkata")
MARKET_OPEN = time(9, 15)
MARKET_CLOSE = time(15, 30)
NIFTY_SYMBOL = "^NSEI"

# ThreadPoolExecutor for concurrent yfinance calls
executor = ThreadPoolExecutor(max_workers=10)

STOCKS = {
    "TCS": {"symbol": "TCS.NS", "sector": "IT", "name": "TCS"},
    "RELIANCE": {"symbol": "RELIANCE.NS", "sector": "Conglomerate", "name": "Reliance Industries"},
    "INFY": {"symbol": "INFY.NS", "sector": "IT", "name": "Infosys"},
    "HDFCBANK": {"symbol": "HDFCBANK.NS", "sector": "Banking", "name": "HDFC Bank"},
    "WIPRO": {"symbol": "WIPRO.NS", "sector": "IT", "name": "Wipro"},
    "BAJFINANCE": {"symbol": "BAJFINANCE.NS", "sector": "Banking", "name": "Bajaj Finance"},
    "ICICIBANK": {"symbol": "ICICIBANK.NS", "sector": "Banking", "name": "ICICI Bank"},
    "SBIN": {"symbol": "SBIN.NS", "sector": "Banking", "name": "State Bank of India"},
    "MARUTI": {"symbol": "MARUTI.NS", "sector": "Auto", "name": "Maruti Suzuki"},
    "TATAMOTORS": {"symbol": "TATAMOTORS.NS", "sector": "Auto", "name": "Tata Motors"},
    "ADANIENT": {"symbol": "ADANIENT.NS", "sector": "Conglomerate", "name": "Adani Enterprises"},
    "SUNPHARMA": {"symbol": "SUNPHARMA.NS", "sector": "Pharma", "name": "Sun Pharma"},
    "TITAN": {"symbol": "TITAN.NS", "sector": "Consumer", "name": "Titan Company"},
    "ITC": {"symbol": "ITC.NS", "sector": "Consumer", "name": "ITC Limited"},
    "LTIM": {"symbol": "LTIM.NS", "sector": "IT", "name": "LTIMindtree"},
}


# ============================================
# IN-MEMORY CACHE
# ============================================

cache = {}
CACHE_DURATION = timedelta(minutes=5)


def get_cached(key):
    """Return cached data if it exists and hasn't expired, else None."""
    if key in cache:
        data, timestamp = cache[key]
        if datetime.now() - timestamp < CACHE_DURATION:
            return data
    return None


def set_cached(key, data):
    """Store data in cache with current timestamp."""
    cache[key] = (data, datetime.now())


# ============================================
# Helpers
# ============================================

def market_is_open():
    now = datetime.now(MARKET_TZ)
    return now.weekday() < 5 and MARKET_OPEN <= now.time() <= MARKET_CLOSE


def percent_change(current, previous):
    if previous == 0:
        return None
    return round(((current - previous) / previous) * 100, 2)


def moving_average(series, window):
    return series.rolling(window).mean()


def calculate_rsi(series, window=14):
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=window, min_periods=window).mean()
    avg_loss = loss.rolling(window=window, min_periods=window).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi


def calculate_macd(series):
    ema_fast = series.ewm(span=12, adjust=False).mean()
    ema_slow = series.ewm(span=26, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def calculate_bollinger(series, window=20, std_dev=2):
    ma = series.rolling(window).mean()
    std = series.rolling(window).std()
    upper = ma + std_dev * std
    lower = ma - std_dev * std
    return lower, ma, upper


def safe_index(series, index):
    if len(series) > index:
        return series.iloc[index]
    return float(series.iloc[0]) if len(series) else None


def safe_float(val, default=0.0):
    """Convert value to float safely, handling NaN and exceptions."""
    try:
        result = float(val)
        # Check for NaN: NaN != NaN
        return default if (result != result) else round(result, 2)
    except (ValueError, TypeError):
        return default


def fetch_ticker_data(symbol: str, period: str = "1y"):
    """Fetch ticker data and strip timezone from index."""
    try:
        df = yf.Ticker(symbol).history(period=period)
        if df.empty:
            return None
        # Strip timezone: tz_convert(None) works on tz-aware index,
        # tz_localize(None) only works on tz-naive index (would raise on tz-aware)
        if df.index.tzinfo is not None:
            df.index = df.index.tz_convert(None)
        return df
    except Exception as e:
        print(f"fetch_ticker_data error for {symbol}: {e}")
        return None


def get_period_return(series, days):
    if len(series) <= days:
        return None
    return percent_change(float(series.iloc[-1]), float(series.iloc[-1 - days]))


def get_ytd_return(series):
    if len(series) < 2:
        return None
    # Use tz-naive year_start so it matches the tz-stripped series.index
    year_start = datetime.now().replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    year_series = series[series.index >= year_start]
    if len(year_series) < 2:
        return None
    return percent_change(float(year_series.iloc[-1]), float(year_series.iloc[0]))


def normalize_history(df, lookback_days=30):
    history = []
    subset = df.tail(lookback_days)
    for date, row in subset.iterrows():
        history.append({
            "date": str(date.date()),
            "close": round(float(row["Close"]), 2),
        })
    return history


def build_stock_summary(ticker, df):
    close = df["Close"]
    current = float(close.iloc[-1])
    prev = float(close.iloc[-2])
    ma_30 = float(close.rolling(30).mean().iloc[-1]) if len(close) >= 30 else float(close.mean())
    symbol = STOCKS[ticker]["symbol"]
    info = yf.Ticker(symbol).info

    return {
        "ticker": ticker,
        "name": STOCKS[ticker]["name"],
        "sector": STOCKS[ticker]["sector"],
        "symbol": symbol,
        "current_price": round(current, 2),
        "change_percent": percent_change(current, prev),
        "day_percent": percent_change(current, prev),
        "week_percent": get_period_return(close, 5),
        "month_percent": get_period_return(close, 21),
        "three_month_percent": get_period_return(close, 63),
        "ytd_percent": get_ytd_return(close),
        "volume": int(df["Volume"].iloc[-1]),
        "signal": "BUY" if current > ma_30 else "HOLD",
        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE"),
        "week_52": {
            "high": round(float(close.max()), 2),
            "low": round(float(close.min()), 2),
        },
        "averages": {
            "price": round(float(close.mean()), 2),
            "ma_30": round(ma_30, 2),
            "ma_90": round(float(close.rolling(90).mean().iloc[-1]) if len(close) >= 90 else ma_30, 2),
        },
        "recent_history": normalize_history(df, lookback_days=30),
        "last_updated": datetime.now().isoformat(),
    }


# ============================================
# ROUTE 1: Health check
# GET /
# ============================================

@app.get("/")
async def root():
    return {
        "status": "running",
        "message": "Stock Dashboard API chal rahi hai!",
        "available_stocks": list(STOCKS.keys()),
        "timestamp": datetime.now(MARKET_TZ).isoformat()
    }


# ============================================
# ROUTE 2: Market overview
# GET /market/overview
# ============================================

@app.get("/market/overview")
async def market_overview():
    cache_key = "market_overview"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        df = fetch_ticker_data(NIFTY_SYMBOL, period="2mo")
        if df is None or df.empty:
            raise HTTPException(status_code=500, detail="NIFTY data nahi aaya")

        close = df["Close"]
        current_price = round(float(close.iloc[-1]), 2)
        prev_price = round(float(close.iloc[-2]), 2)
        change_percent = percent_change(current_price, prev_price)

        history = [
            {"date": str(date.date()), "close": round(float(row["Close"]), 2)}
            for date, row in df.tail(30).iterrows()
        ]

        result = {
            "symbol": NIFTY_SYMBOL,
            "name": "NIFTY 50",
            "current_price": current_price,
            "previous_close": prev_price,
            "change_percent": change_percent,
            "market_status": "OPEN" if market_is_open() else "CLOSED",
            "history": history,
            "last_updated": datetime.now(MARKET_TZ).isoformat(),
        }
        set_cached(cache_key, result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ============================================
# ROUTE 3: Stock technicals
# GET /stock/{ticker}/technical
# ============================================

@app.get("/stock/{ticker}/technical")
async def stock_technical(ticker: str):
    ticker = ticker.upper()
    if ticker not in STOCKS:
        raise HTTPException(status_code=404, detail=f"'{ticker}' nahi mila")

    cache_key = f"technical_{ticker}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        symbol = STOCKS[ticker]["symbol"]
        df = fetch_ticker_data(symbol, period="6mo")
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="Technical data nahi aaya")

        close = df["Close"]

        # Calculate RSI safely
        try:
            rsi = calculate_rsi(close).iloc[-1]
            rsi_value = safe_float(rsi)
        except Exception:
            rsi_value = 50  # Neutral if calculation fails

        # Calculate Bollinger safely
        try:
            lower, ma_20, upper = calculate_bollinger(close)
            bb_upper = safe_float(upper.iloc[-1]) if not pd.isna(upper.iloc[-1]) else None
            bb_middle = safe_float(ma_20.iloc[-1]) if not pd.isna(ma_20.iloc[-1]) else None
            bb_lower = safe_float(lower.iloc[-1]) if not pd.isna(lower.iloc[-1]) else None
        except Exception:
            bb_upper = None
            bb_middle = None
            bb_lower = None

        # Calculate MACD safely
        try:
            macd_line, signal_line, histogram = calculate_macd(close)
            macd_value = safe_float(macd_line.iloc[-1])
            signal_value = safe_float(signal_line.iloc[-1])
            histogram_value = safe_float(histogram.iloc[-1])
        except Exception:
            macd_value = 0.0
            signal_value = 0.0
            histogram_value = 0.0

        history = []
        for date, row in df.iterrows():
            try:
                history.append({
                    "date": str(date.date()),
                    "close": safe_float(row["Close"]),
                    "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0,
                    "ma_20": safe_float(ma_20.loc[date]) if not pd.isna(ma_20.loc[date]) else None,
                    "bb_upper": safe_float(upper.loc[date]) if not pd.isna(upper.loc[date]) else None,
                    "bb_lower": safe_float(lower.loc[date]) if not pd.isna(lower.loc[date]) else None,
                })
            except Exception:
                continue

        result = {
            "ticker": ticker,
            "symbol": symbol,
            "rsi": rsi_value,
            "bollinger": {
                "upper": bb_upper,
                "middle": bb_middle,
                "lower": bb_lower,
            },
            "macd": {
                "macd": macd_value,
                "signal": signal_value,
                "histogram": histogram_value,
            },
            "history": history,
            "last_updated": datetime.now(MARKET_TZ).isoformat(),
        }
        set_cached(cache_key, result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ============================================
# ROUTE 4: Stock details
# GET /stock/{ticker}
# ============================================

@app.get("/stock/{ticker}")
async def get_stock_info(ticker: str):
    ticker = ticker.upper()
    if ticker not in STOCKS:
        raise HTTPException(status_code=404, detail=f"'{ticker}' nahi mila. Available: {list(STOCKS.keys())}")

    cache_key = f"stock_{ticker}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        symbol = STOCKS[ticker]["symbol"]
        df = fetch_ticker_data(symbol, period="1y")
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="Data nahi aaya — thodi der baad try karo")

        close = df["Close"]
        current_price = round(float(close.iloc[-1]), 2)
        prev_price = round(float(close.iloc[-2]), 2)
        price_change = round(current_price - prev_price, 2)
        change_percent = percent_change(current_price, prev_price)

        result = {
            "ticker": ticker,
            "symbol": symbol,
            "current_price": current_price,
            "change": {
                "amount": price_change,
                "percent": change_percent,
                "direction": "up" if price_change >= 0 else "down"
            },
            "week_52": {
                "high": round(float(close.max()), 2),
                "low": round(float(close.min()), 2)
            },
            "averages": {
                "price": round(float(close.mean()), 2),
                "ma_30": round(float(close.rolling(30).mean().iloc[-1]), 2),
                "ma_90": round(float(close.rolling(90).mean().iloc[-1]), 2),
                "volume": int(df["Volume"].mean())
            },
            "volatility": round(float(close.std()), 2),
            "signal": "BUY" if current_price > float(close.rolling(30).mean().iloc[-1]) else "WATCH",
            "last_updated": datetime.now(MARKET_TZ).isoformat()
        }
        set_cached(cache_key, result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ============================================
# ROUTE 5: Price history — chart data
# GET /stock/{ticker}/history?period=1y
# ============================================

@app.get("/stock/{ticker}/history")
async def get_stock_history(ticker: str, period: str = "1y"):
    ticker = ticker.upper()
    if ticker not in STOCKS:
        raise HTTPException(status_code=404, detail=f"'{ticker}' nahi mila")

    allowed = ["1mo", "3mo", "6mo", "1y"]
    if period not in allowed:
        raise HTTPException(status_code=400, detail=f"Period '{period}' galat hai. Use: {allowed}")

    cache_key = f"history_{ticker}_{period}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        df = fetch_ticker_data(STOCKS[ticker]["symbol"], period=period)
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="Data nahi mila")

        close = df["Close"]
        ma_30 = close.rolling(30).mean()
        ma_90 = close.rolling(90).mean()

        history = []
        for date, row in df.iterrows():
            try:
                history.append({
                    "date": str(date.date()),
                    "open": safe_float(row["Open"]),
                    "high": safe_float(row["High"]),
                    "low": safe_float(row["Low"]),
                    "close": safe_float(row["Close"]),
                    "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0,
                    "ma_30": safe_float(ma_30.loc[date]) if not pd.isna(ma_30.loc[date]) else None,
                    "ma_90": safe_float(ma_90.loc[date]) if not pd.isna(ma_90.loc[date]) else None,
                })
            except Exception:
                # Skip rows that fail, don't crash entire response
                continue

        if not history:
            raise HTTPException(status_code=404, detail="Data nahi mila")

        result = {
            "ticker": ticker,
            "period": period,
            "total_days": len(history),
            "history": history
        }
        set_cached(cache_key, result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


# ============================================
# ROUTE 6: All stocks summary — CONCURRENT
# GET /stocks/all
# ============================================

async def fetch_single_stock(ticker: str, meta: dict):
    """Fetch one stock's data concurrently using thread pool."""
    loop = asyncio.get_event_loop()
    symbol = meta["symbol"]

    # Check per-stock cache first
    cache_key = f"summary_{ticker}"
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        # Run blocking yfinance call in thread pool
        df = await loop.run_in_executor(
            executor,
            lambda: fetch_ticker_data(symbol, period="1y")
        )
        if df is None or df.empty:
            return {"ticker": ticker, "error": f"{ticker} data nahi aaya"}

        # Also fetch .info concurrently
        info = await loop.run_in_executor(
            executor,
            lambda: yf.Ticker(symbol).info
        )

        close = df["Close"]
        current = float(close.iloc[-1])
        prev = float(close.iloc[-2])
        ma_30 = float(close.rolling(30).mean().iloc[-1]) if len(close) >= 30 else float(close.mean())

        result = {
            "ticker": ticker,
            "name": meta["name"],
            "sector": meta["sector"],
            "symbol": symbol,
            "current_price": round(current, 2),
            "change_percent": percent_change(current, prev),
            "day_percent": percent_change(current, prev),
            "week_percent": get_period_return(close, 5),
            "month_percent": get_period_return(close, 21),
            "three_month_percent": get_period_return(close, 63),
            "ytd_percent": get_ytd_return(close),
            "volume": int(df["Volume"].iloc[-1]),
            "signal": "BUY" if current > ma_30 else "HOLD",
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "week_52": {
                "high": round(float(close.max()), 2),
                "low": round(float(close.min()), 2),
            },
            "averages": {
                "price": round(float(close.mean()), 2),
                "ma_30": round(ma_30, 2),
                "ma_90": round(float(close.rolling(90).mean().iloc[-1]) if len(close) >= 90 else ma_30, 2),
            },
            "recent_history": normalize_history(df, lookback_days=30),
            "last_updated": datetime.now().isoformat(),
        }
        set_cached(cache_key, result)
        return result
    except Exception as e:
        return {"ticker": ticker, "error": str(e)}


@app.get("/stocks/all")
async def all_stocks():
    # Check whole-list cache first
    cache_key = "all_stocks"
    cached = get_cached(cache_key)
    if cached:
        return cached

    # Fetch all stocks concurrently
    tasks = [
        fetch_single_stock(ticker, meta)
        for ticker, meta in STOCKS.items()
    ]
    results = await asyncio.gather(*tasks)

    # Separate successful results from errors (keep errors too for transparency)
    stocks = [r for r in results if r is not None]

    response = {
        "stocks": stocks,
        "count": len([s for s in stocks if "error" not in s]),
        "timestamp": datetime.now(MARKET_TZ).isoformat()
    }
    set_cached(cache_key, response)
    return response


# ============================================
# ROUTE 7: Sector performance
# GET /sector/performance
# ============================================

@app.get("/sector/performance")
async def sector_performance():
    cache_key = "sector_performance"
    cached = get_cached(cache_key)
    if cached:
        return cached

    sectors = {}
    for ticker, meta in STOCKS.items():
        try:
            symbol = meta["symbol"]
            df = fetch_ticker_data(symbol, period="3mo")
            if df is None or df.empty:
                continue
            close = df["Close"]
            sector = meta["sector"]
            if sector not in sectors:
                sectors[sector] = {
                    "sector": sector,
                    "returns": {"1w": [], "1m": [], "3m": []},
                    "best_stock": None,
                    "best_return": -999,
                }

            one_week = get_period_return(close, 5) or 0
            one_month = get_period_return(close, 21) or 0
            three_month = get_period_return(close, 63) or 0

            if one_month > sectors[sector]["best_return"]:
                sectors[sector]["best_return"] = one_month
                sectors[sector]["best_stock"] = ticker

            sectors[sector]["returns"]["1w"].append(one_week)
            sectors[sector]["returns"]["1m"].append(one_month)
            sectors[sector]["returns"]["3m"].append(three_month)
        except Exception:
            continue

    output = []
    for sector, entry in sectors.items():
        output.append({
            "sector": sector,
            "avg_1w": round(np.nanmean(entry["returns"]["1w"]), 2),
            "avg_1m": round(np.nanmean(entry["returns"]["1m"]), 2),
            "avg_3m": round(np.nanmean(entry["returns"]["3m"]), 2),
            "best_stock": entry["best_stock"],
            "best_return": round(entry["best_return"], 2),
        })

    result = {
        "sectors": output,
        "timestamp": datetime.now(MARKET_TZ).isoformat()
    }
    set_cached(cache_key, result)
    return result


# ============================================
# ROUTE 8: Compare stocks
# GET /compare
# ============================================

@app.get("/compare")
async def compare_all_stocks():
    cache_key = "compare"
    cached = get_cached(cache_key)
    if cached:
        return cached

    result = []
    for ticker, meta in STOCKS.items():
        try:
            df = fetch_ticker_data(meta["symbol"], period="1y")
            if df is None or df.empty:
                result.append({"ticker": ticker, "error": "Data nahi aaya"})
                continue
            close = df["Close"]
            current = float(close.iloc[-1])
            start = float(close.iloc[0])
            yearly_return = round(((current - start) / start) * 100, 2)
            volatility = round(float(close.pct_change().std() * 100), 2)
            ma_30 = float(close.rolling(30).mean().iloc[-1])
            result.append({
                "ticker": ticker,
                "current_price": round(current, 2),
                "yearly_return_percent": yearly_return,
                "volatility_percent": volatility,
                "vs_ma30": "above" if current > ma_30 else "below",
                "performance": (
                    "excellent" if yearly_return > 20 else
                    "good" if yearly_return > 10 else
                    "average" if yearly_return > 0 else
                    "poor"
                )
            })
        except Exception as e:
            result.append({"ticker": ticker, "error": str(e)})

    result.sort(key=lambda x: x.get("yearly_return_percent", -999), reverse=True)
    response = {
        "stocks": result,
        "best_performer": result[0]["ticker"] if result and "ticker" in result[0] else None,
        "timestamp": datetime.now(MARKET_TZ).isoformat()
    }
    set_cached(cache_key, response)
    return response
