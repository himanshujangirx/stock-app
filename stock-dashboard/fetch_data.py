# import yfinance as yf
# import pandas as pd

# # stock data of one stock 
# ticker = yf.Ticker("TCS.NS")

# # 1 year data 
# df = ticker.history(period="1Y")

# print(df.head())   # first 5 rows
# print("\n") 
# print(df.tail())   # last 5 rows and columns 
# print("\n")
# print(df.columns)  # column names
# print("\n")


import yfinance as yf
import pandas as pd

# 5 popular Indian stocks
STOCKS = {
    "TCS.NS": "TCS",
    "RELIANCE.NS": "Reliance",
    "INFY.NS": "Infosys",
    "HDFCBANK.NS": "HDFC Bank",
    "WIPRO.NS": "Wipro"
}

print("Stocks ka data download ho raha hai...\n")

# Saare stocks ka closing price ek saath
all_data = {}

for ticker_symbol, company_name in STOCKS.items():
    ticker = yf.Ticker(ticker_symbol)
    df = ticker.history(period="1y")
    all_data[company_name] = df["Close"]  # sirf closing price
    print(f"{company_name}: {len(df)} days ka data mila ✅")

# Ek bade DataFrame mein combine karo
combined_df = pd.DataFrame(all_data)
combined_df.index = combined_df.index.date  # datetime → sirf date

print("\n--- Combined Data (pehle 3 rows) ---")
print(combined_df.head(3))

print("\n--- Combined Data (aakhri 3 rows) ---")
print(combined_df.tail(3))

print(f"\nTotal: {combined_df.shape[0]} trading days, {combined_df.shape[1]} stocks")