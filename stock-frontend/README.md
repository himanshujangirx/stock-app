# Stock Dashboard (Frontend) — React + Vite

Ye frontend **FastAPI backend** se stock data fetch karke UI me charts, stats aur tables dikhata hai.

## Backend Base URL
- Default: `http://localhost:8000`
- Frontend calls yahan se karta hai: `src/services/api.js`

## UI/Pages (high level)
- **Dashboard load:**
  - `/market/overview` (NIFTY 50 overview)
  - `/stocks/all` (sab stocks ka summary)
  - `/sector/performance` (sector-wise performance)
- **Selected stock details:**
  - `/stock/{ticker}/history?period=1y|6mo|3mo|1mo`
  - `/stock/{ticker}/technical`
- **Comparison & Sector sections:**
  - `/compare`
  - `/sector/performance`

## Key Files
- `src/App.jsx`
  - Loading screen + dashboard state management
  - Selected ticker/period based data fetching
- `src/services/api.js`
  - Backend ke endpoints ko call + timeouts + error handling
- `src/components/*`
  - `Navbar`, `HeroSection`, `StockCard`, `StockChart`, `StatsGrid`, `ComparisonTable`, `SectorPerformance`

## Setup & Run (Frontend)
```bash
cd stock-frontend
npm install
npm run dev
```
Frontend typically `http://localhost:5173` par run hota hai.

## Note
Backend heavy ho sakta hai (yFinance cold start), isliye `src/services/api.js` me longer timeouts aur frontend me proper loading/error states implemented hain.

