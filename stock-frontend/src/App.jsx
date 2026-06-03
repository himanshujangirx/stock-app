import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import StockCard from './components/StockCard'
import StockChart from './components/StockChart'
import StatsGrid from './components/StatsGrid'
import ComparisonTable from './components/ComparisonTable'
import SectorPerformance from './components/SectorPerformance'
import {
  fetchMarketOverview,
  fetchAllStocks,
  fetchStockHistory,
  fetchStockTech,
  fetchSectorPerformance,
} from './services/api'

const STOCKS_LIST = [
  'TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'WIPRO',
  'BAJFINANCE', 'ICICIBANK', 'SBIN', 'MARUTI',
  'TATAMOTORS', 'ADANIENT', 'SUNPHARMA', 'TITAN',
  'ITC', 'LTIM'
]

const PERIODS = ['1mo', '3mo', '6mo', '1y']

// Loading messages shown at different elapsed time thresholds
const LOADING_MESSAGES = [
  { maxSec: 10,  msg: 'Connecting to server...' },
  { maxSec: 30,  msg: 'Yahoo Finance se data aa raha hai...' },
  { maxSec: 60,  msg: '15 stocks ka data fetch ho raha hai, thoda wait karo...' },
  { maxSec: Infinity, msg: 'Bahut slow hai — agar 2 min ho jayein toh retry karo' },
]

function getLoadingMessage(elapsed) {
  for (const entry of LOADING_MESSAGES) {
    if (elapsed < entry.maxSec) return entry.msg
  }
  return LOADING_MESSAGES[LOADING_MESSAGES.length - 1].msg
}

// Progress: reaches 100% at ~30 seconds, then stays at 99% so it never "completes" prematurely
function getProgress(elapsed) {
  if (elapsed >= 30) return 99
  return Math.min(99, Math.round((elapsed / 30) * 100))
}

// ============================================================
// LoadingScreen component
// ============================================================
function LoadingScreen({ elapsed, loadedTickers }) {
  const message = getLoadingMessage(elapsed)
  const progress = getProgress(elapsed)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>

        {/* Animated chart icon */}
        <div style={{ marginBottom: 28 }}>
          <svg
            width="72" height="72" viewBox="0 0 72 72" fill="none"
            style={{ animation: 'chartPulse 1.6s ease-in-out infinite' }}
          >
            <rect width="72" height="72" rx="18" fill="rgba(79,142,247,0.12)" />
            <polyline
              points="10,52 22,34 34,42 46,22 62,28"
              stroke="#4F8EF7"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ animation: 'dashDraw 2s linear infinite' }}
            />
            <circle cx="62" cy="28" r="4" fill="#4F8EF7" style={{ animation: 'blink 1s ease-in-out infinite' }} />
          </svg>
        </div>

        {/* Title */}
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
          Stock Dashboard Load ho raha hai
        </div>

        {/* Dynamic message */}
        <div style={{
          fontSize: 14,
          color: 'var(--text-sec)',
          marginBottom: 28,
          minHeight: 20,
          transition: 'all 0.4s ease',
        }}>
          {message}
        </div>

        {/* Progress bar */}
        <div style={{
          background: '#1E2436',
          borderRadius: 999,
          height: 8,
          marginBottom: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #4F8EF7, #7B61FF)',
            borderRadius: 999,
            transition: 'width 1s linear',
          }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 28 }}>
          {elapsed}s elapsed
        </div>

        {/* Stock ticker list */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 20,
          textAlign: 'left',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', marginBottom: 12 }}>
            STOCKS LOADING
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px 12px',
          }}>
            {STOCKS_LIST.map(ticker => {
              const done = loadedTickers.includes(ticker)
              return (
                <div key={ticker} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: done ? '#4ade80' : 'var(--text-muted)',
                  transition: 'color 0.3s ease',
                }}>
                  {done ? (
                    <span style={{ fontSize: 13 }}>✓</span>
                  ) : (
                    <span style={{
                      display: 'inline-block',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      border: '2px solid #4F8EF7',
                      borderTopColor: 'transparent',
                      animation: 'spin 0.8s linear infinite',
                      flexShrink: 0,
                    }} />
                  )}
                  {ticker}
                </div>
              )
            })}
          </div>
        </div>

        {/* Pro tip */}
        <div style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          background: 'rgba(79,142,247,0.07)',
          border: '1px solid rgba(79,142,247,0.15)',
          borderRadius: 10,
          padding: '10px 16px',
        }}>
          💡 <strong style={{ color: 'var(--primary)' }}>Tip:</strong>{' '}
          Refresh ke baad data cached rahega aur faster load hoga
        </div>
      </div>

      {/* Keyframe styles injected inline */}
      <style>{`
        @keyframes chartPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ============================================================
// SkeletonCard (unchanged)
// ============================================================
function SkeletonCard() {
  return (
    <div style={{
      height: 100,
      borderRadius: 20,
      background: '#1E2436',
      animation: 'pulse 1.4s ease-in-out infinite',
      marginBottom: 12
    }} />
  )
}

// ============================================================
// App
// ============================================================
export default function App() {
  const [overview, setOverview] = useState(null)
  const [stocks, setStocks] = useState([])
  const [sectorData, setSectorData] = useState([])
  const [selected, setSelected] = useState('TCS')
  const [period, setPeriod] = useState('1y')
  const [history, setHistory] = useState([])
  const [technical, setTechnical] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showBollinger, setShowBollinger] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Loading-screen state
  const [loadingElapsed, setLoadingElapsed] = useState(0)
  const [loadedTickers, setLoadedTickers] = useState([])
  const loadingStartRef = useRef(null)

  const selectedStock = useMemo(
    () => stocks.find((stock) => stock.ticker === selected),
    [stocks, selected]
  )

  const totalPortfolioValue = useMemo(
    () => stocks.reduce((sum, stock) => sum + (stock.current_price || 0), 0),
    [stocks]
  )

  const bestPerformer = useMemo(() => {
    return [...stocks]
      .filter((stock) => typeof stock.day_percent === 'number')
      .sort((a, b) => b.day_percent - a.day_percent)[0]
  }, [stocks])

  const worstPerformer = useMemo(() => {
    return [...stocks]
      .filter((stock) => typeof stock.day_percent === 'number')
      .sort((a, b) => a.day_percent - b.day_percent)[0]
  }, [stocks])

  // Tick loading elapsed counter while loading
  useEffect(() => {
    if (!loading) return
    loadingStartRef.current = Date.now()
    setLoadingElapsed(0)
    const interval = setInterval(() => {
      setLoadingElapsed(Math.floor((Date.now() - loadingStartRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [loading])

  // Simulate per-stock checkmarks as time passes (each stock ~2s apart)
  useEffect(() => {
    if (!loading) return
    setLoadedTickers([])
    const timers = STOCKS_LIST.map((ticker, i) =>
      setTimeout(() => {
        setLoadedTickers(prev => [...prev, ticker])
      }, (i + 1) * 2000)   // stagger 2s per stock — purely visual
    )
    return () => timers.forEach(clearTimeout)
  }, [loading])

  const loadDashboard = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      setElapsedSeconds(0)
      const [overviewRes, stockRes, sectorRes] = await Promise.all([
        fetchMarketOverview(),
        fetchAllStocks(),
        fetchSectorPerformance(),
      ])
      setOverview(overviewRes)
      setStocks(stockRes.stocks || [])
      setSectorData(sectorRes.sectors || [])
      setLastUpdated(new Date())
      if (!selected && stockRes.stocks?.length) {
        setSelected(stockRes.stocks[0].ticker)
      }
    } catch (err) {
      setError(err.message || 'Data nahi aaya. Backend chal rahi hai? (localhost:8000)')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selected])

  const loadSelectedStock = useCallback(
    async (ticker, periodValue) => {
      setChartLoading(true)
      try {
        const [historyRes, techRes] = await Promise.all([
          fetchStockHistory(ticker, periodValue),
          fetchStockTech(ticker),
        ])
        setHistory(historyRes.history || [])
        setTechnical(techRes)
      } catch (err) {
        console.error('Chart load failed', err)
      } finally {
        setChartLoading(false)
      }
    },
    []
  )

  // Update elapsed time every second (post-load "last updated" counter)
  useEffect(() => {
    if (!lastUpdated) return
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((new Date() - lastUpdated) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [lastUpdated])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    if (selected) {
      loadSelectedStock(selected, period)
    }
  }, [selected, period, loadSelectedStock])

  // ── Loading screen ──────────────────────────────────────────
  if (loading) {
    return (
      <LoadingScreen
        elapsed={loadingElapsed}
        loadedTickers={loadedTickers}
      />
    )
  }

  // ── Error screen (unchanged design) ────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>⚠️</div>
          <div style={{ color: 'var(--danger)', fontSize: 18, marginBottom: 24, fontWeight: 600 }}>
            {error}
          </div>

          <div style={{
            background: 'rgba(79, 142, 247, 0.1)',
            border: '1px solid rgba(79, 142, 247, 0.3)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            textAlign: 'left',
            fontSize: 13,
            lineHeight: '1.8',
            color: 'var(--text-sec)'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 12 }}>Yeh check karo:</div>
            <div>✓ FastAPI chal rahi hai? <code style={{ color: 'var(--primary)', fontSize: 12 }}>localhost:8000</code></div>
            <div>✓ Terminal mein <code style={{ color: 'var(--primary)', fontSize: 12 }}>python -m uvicorn main:app --reload --port 8000</code> run kiya?</div>
            <div>✓ venv activate hai?</div>
            <div>✓ Internet chal rahi hai?</div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={loadDashboard}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 26px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 14,
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(79, 142, 247, 0.8)'}
              onMouseOut={(e) => e.target.style.background = 'var(--primary)'}
            >
              🔄 Dobara try karo
            </button>
            <button
              onClick={() => window.open('http://localhost:8000/docs', '_blank')}
              style={{
                background: 'transparent',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                borderRadius: 12,
                padding: '12px 26px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 14,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.target.style.background = 'rgba(79, 142, 247, 0.1)' }}
              onMouseOut={(e) => { e.target.style.background = 'transparent' }}
            >
              📖 API Docs
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main dashboard (unchanged) ──────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Navbar lastUpdated={overview?.last_updated} />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px 40px' }}>
        <HeroSection
          overview={overview}
          totalValue={totalPortfolioValue}
          bestPerformer={bestPerformer}
          worstPerformer={worstPerformer}
        />

        {lastUpdated && (
          <div style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginTop: 16,
            marginBottom: 24
          }}>
            Last updated: {elapsedSeconds < 60 ? `${elapsedSeconds}s ago` : `${Math.floor(elapsedSeconds / 60)}m ago`}
          </div>
        )}

        <section style={{ marginTop: 16 }}>
          <div className="dashboard-grid">
            {/* ── Left sidebar: internally scrollable, 2-col card grid ── */}
            <aside style={{ position: 'sticky', top: 92, alignSelf: 'start' }}>
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 20,
                background: 'var(--card)',
                padding: 14,
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  color: 'var(--text-muted)',
                  marginBottom: 10,
                  paddingLeft: 2,
                }}>WATCHLIST ({stocks.filter(s => !s.error).length}/{stocks.length})</div>

                {/* Scrollable card area */}
                <div style={{
                  maxHeight: 'calc(100vh - 200px)',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  paddingRight: 4,
                  /* thin scrollbar */
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--border) transparent',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                  }}>
                    {stocks.map((stock) => (
                      <StockCard
                        key={stock.ticker}
                        stock={stock}
                        isSelected={stock.ticker === selected}
                        onClick={setSelected}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* ── Right: Chart + Stats ── */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <StockChart
                history={history}
                ticker={selected}
                period={period}
                onPeriodChange={setPeriod}
                showBollinger={showBollinger}
                toggleBollinger={() => setShowBollinger((prev) => !prev)}
                technical={technical}
              />
              <StatsGrid stock={selectedStock} technical={technical} />
            </section>
          </div>
        </section>

        <section style={{ marginTop: 16 }}>
          <ComparisonTable stocks={stocks} />
        </section>

        <section style={{ marginTop: 16 }}>
          <SectorPerformance sectors={sectorData} />
        </section>
      </main>
    </div>
  )
}
