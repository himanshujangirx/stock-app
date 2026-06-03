import yfinance as yf
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# ============================================
# DATA LOAD
# ============================================

STOCKS = {
    "TCS.NS": "TCS",
    "RELIANCE.NS": "Reliance", 
    "INFY.NS": "Infosys",
    "HDFCBANK.NS": "HDFC Bank",
    "WIPRO.NS": "Wipro"
}

print("Data load ho raha hai...")
all_close = {}

for symbol, name in STOCKS.items():
    df = yf.Ticker(symbol).history(period="1y")
    all_close[name] = df["Close"]

combined = pd.DataFrame(all_close)
combined.index = pd.to_datetime(combined.index).date

print("Data ready! Charts ban rahe hain...\n")



# ============================================
# CHART 1: Price trends - sabhi stocks
# ============================================

plt.figure(figsize=(14, 6))  # width=14, height=6 inches

for column in combined.columns:
    plt.plot(combined.index, combined[column], label=column, linewidth=1.5)

plt.title("Indian Stocks - 1 Year Price Trend", fontsize=16, fontweight='bold')
plt.xlabel("Date", fontsize=12)
plt.ylabel("Price (₹)", fontsize=12)
plt.legend(loc='upper left')          # legend top-left mein
plt.xticks(rotation=45)               # x-axis labels tilt karo
plt.grid(True, alpha=0.3)             # light grid lines
plt.tight_layout()                    # overlap na ho
plt.savefig("chart1_prices.png", dpi=150)  # file save
plt.show()
print("Chart 1 save hua: chart1_prices.png ✅")


# ============================================
# CHART 2: Normalized comparison (100 = start)
# ============================================

# Pehle din ki value = 100, baaki relative
normalized = (combined / combined.iloc[0]) * 100

plt.figure(figsize=(14, 6))

colors = ['#2196F3', '#FF5722', '#4CAF50', '#9C27B0', '#FF9800']

for i, column in enumerate(normalized.columns):
    plt.plot(normalized.index, normalized[column],
             label=column, linewidth=2, color=colors[i])

# 100 ki dotted line — starting point
plt.axhline(y=100, color='gray', linestyle='--', 
            linewidth=1, alpha=0.7, label='Start (100)')

plt.title("Stock Performance Comparison (Normalized to 100)", 
          fontsize=16, fontweight='bold')
plt.xlabel("Date", fontsize=12)
plt.ylabel("Relative Performance", fontsize=12)
plt.legend(loc='upper left')
plt.xticks(rotation=45)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("chart2_normalized.png", dpi=150)
plt.show()
print("Chart 2 save hua: chart2_normalized.png ✅")


# ============================================
# CHART 3: TCS - Price + Moving Averages
# ============================================

tcs = combined["TCS"].dropna()

# Moving averages calculate karo
ma_7  = tcs.rolling(window=7).mean()   # 7-day  (short term)
ma_30 = tcs.rolling(window=30).mean()  # 30-day (medium term)
ma_90 = tcs.rolling(window=90).mean()  # 90-day (long term)

plt.figure(figsize=(14, 6))

# Actual price — thin, light
plt.plot(tcs.index, tcs.values, 
         label='TCS Price', color='#90CAF9', linewidth=1, alpha=0.8)

# Moving averages — thick, bold
plt.plot(ma_7.index,  ma_7.values,  
         label='7-Day MA',  color='#FF9800', linewidth=2)
plt.plot(ma_30.index, ma_30.values, 
         label='30-Day MA', color='#F44336', linewidth=2)
plt.plot(ma_90.index, ma_90.values, 
         label='90-Day MA', color='#9C27B0', linewidth=2.5)

plt.title("TCS - Price with Moving Averages", 
          fontsize=16, fontweight='bold')
plt.xlabel("Date", fontsize=12)
plt.ylabel("Price (₹)", fontsize=12)
plt.legend()
plt.xticks(rotation=45)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig("chart3_moving_avg.png", dpi=150)
plt.show()
print("Chart 3 save hua: chart3_moving_avg.png ✅")


# ============================================
# CHART 4: Daily Returns Distribution
# ============================================

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# LEFT: TCS daily returns histogram
tcs_returns = combined["TCS"].pct_change().dropna() * 100

axes[0].hist(tcs_returns, bins=40, 
             color='#2196F3', edgecolor='white', alpha=0.85)
axes[0].axvline(x=0, color='red', linestyle='--', linewidth=2)
axes[0].axvline(x=tcs_returns.mean(), color='orange', 
                linestyle='-', linewidth=2, label=f'Mean: {tcs_returns.mean():.2f}%')
axes[0].set_title("TCS - Daily Returns Distribution", fontsize=13, fontweight='bold')
axes[0].set_xlabel("Daily Return (%)")
axes[0].set_ylabel("Frequency (Days)")
axes[0].legend()
axes[0].grid(True, alpha=0.3)

# RIGHT: All stocks average daily return comparison
avg_returns = {}
for col in combined.columns:
    avg_returns[col] = combined[col].pct_change().mean() * 100

colors_bar = ['#2196F3', '#FF5722', '#4CAF50', '#9C27B0', '#FF9800']
bars = axes[1].bar(avg_returns.keys(), avg_returns.values(), 
                    color=colors_bar, edgecolor='white')

# Value labels bars pe
for bar, val in zip(bars, avg_returns.values()):
    axes[1].text(bar.get_x() + bar.get_width()/2, 
                 bar.get_height() + 0.001,
                 f'{val:.3f}%', ha='center', va='bottom', 
                 fontsize=10, fontweight='bold')

axes[1].axhline(y=0, color='black', linewidth=0.8)
axes[1].set_title("Average Daily Return - All Stocks", fontsize=13, fontweight='bold')
axes[1].set_ylabel("Avg Daily Return (%)")
axes[1].grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig("chart4_returns.png", dpi=150)
plt.show()
print("Chart 4 save hua: chart4_returns.png ✅")



# ============================================
# CHART 5: Full Dashboard - 4 panels
# ============================================

fig = plt.figure(figsize=(16, 10))
fig.suptitle("Indian Stock Market Dashboard", 
             fontsize=20, fontweight='bold', y=0.98)

gs = gridspec.GridSpec(2, 2, hspace=0.4, wspace=0.3)

# Panel 1: Normalized performance
ax1 = fig.add_subplot(gs[0, :])  # full width top row
norm = (combined / combined.iloc[0]) * 100
for i, col in enumerate(norm.columns):
    ax1.plot(norm.index, norm[col], label=col, 
             linewidth=2, color=colors[i])
ax1.axhline(y=100, color='gray', linestyle='--', alpha=0.5)
ax1.set_title("Relative Performance (100 = Start)", fontweight='bold')
ax1.legend(loc='upper left', fontsize=9)
ax1.grid(True, alpha=0.3)
ax1.tick_params(axis='x', rotation=45)

# Panel 2: TCS with MA
ax2 = fig.add_subplot(gs[1, 0])
ax2.plot(tcs.index, tcs.values, color='#90CAF9', linewidth=1, alpha=0.7)
ax2.plot(ma_30.index, ma_30.values, color='#F44336', linewidth=2, label='MA30')
ax2.plot(ma_90.index, ma_90.values, color='#9C27B0', linewidth=2, label='MA90')
ax2.set_title("TCS - Moving Averages", fontweight='bold')
ax2.legend(fontsize=9)
ax2.grid(True, alpha=0.3)
ax2.tick_params(axis='x', rotation=45)

# Panel 3: Returns bar chart
ax3 = fig.add_subplot(gs[1, 1])
ax3.bar(avg_returns.keys(), avg_returns.values(), 
        color=colors_bar, edgecolor='white')
ax3.axhline(y=0, color='black', linewidth=0.8)
ax3.set_title("Avg Daily Returns (%)", fontweight='bold')
ax3.grid(True, alpha=0.3, axis='y')

plt.savefig("dashboard.png", dpi=150, bbox_inches='tight')
plt.show()
print("\nMain dashboard save hua: dashboard.png ✅")
print("\nSaari files:")
print("  chart1_prices.png")
print("  chart2_normalized.png")
print("  chart3_moving_avg.png")
print("  chart4_returns.png")
print("  dashboard.png")