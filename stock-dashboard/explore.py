import yfinance as yf
import pandas as pd
import numpy as np

# TCS ka data
df = yf.Ticker("TCS.NS").history(period="1y")
close = df["Close"]

print("=" * 40)
print("TCS - Basic Statistics")
print("=" * 40)

print(f"Current Price:  ₹{close.iloc[-1]:,.2f}")      # aaj ka price
print(f"52-Week High:   ₹{close.max():,.2f}")          # saal ka max
print(f"52-Week Low:    ₹{close.min():,.2f}")           # saal ka min
print(f"Average Price:  ₹{close.mean():,.2f}")          # average
print(f"Std Deviation:  ₹{close.std():,.2f}")           # volatility

# Daily % change
daily_returns = close.pct_change() * 100  # % mein convert
print(f"\nBest Day:   +{daily_returns.max():.2f}%")
print(f"Worst Day:   {daily_returns.min():.2f}%")
print(f"Avg Daily Change: {daily_returns.mean():.2f}%")

# 30-day moving average
ma_30 = close.rolling(window=30).mean()
print(f"\n30-Day Moving Avg: ₹{ma_30.iloc[-1]:,.2f}")
print(f"Current vs MA30: {'ABOVE ↑' if close.iloc[-1] > ma_30.iloc[-1] else 'BELOW ↓'}")