const SECTOR_COLORS = {
  IT:           { bg: 'rgba(79,142,247,0.12)',  text: '#4F8EF7' },
  Banking:      { bg: 'rgba(0,196,140,0.12)',   text: '#00C48C' },
  Auto:         { bg: 'rgba(255,184,0,0.12)',   text: '#FFB800' },
  Conglomerate: { bg: 'rgba(160,100,255,0.12)', text: '#A064FF' },
  Pharma:       { bg: 'rgba(255,100,124,0.12)', text: '#FF647C' },
  Consumer:     { bg: 'rgba(255,140,60,0.12)',  text: '#FF8C3C' },
}

export default function StockCard({ stock, isSelected, onClick }) {
  const performance = stock.day_percent || 0
  const isPositive  = performance >= 0
  const sector      = SECTOR_COLORS[stock.sector] || { bg: 'rgba(255,255,255,0.08)', text: '#8892A4' }

  const borderColor = isSelected
    ? 'var(--primary)'
    : performance > 2
    ? 'rgba(0,196,140,0.3)'
    : performance < -2
    ? 'rgba(255,100,124,0.3)'
    : 'var(--border)'

  return (
    <button
      type="button"
      onClick={() => onClick(stock.ticker)}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        color: 'inherit',
        background: isSelected ? 'rgba(79,142,247,0.07)' : 'var(--card)',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 14,
        padding: '10px 12px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s ease',
        boxShadow: isSelected ? '0 8px 24px rgba(79,142,247,0.12)' : 'none',
      }}
    >
      {/* Row 1: Ticker + Change % */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>
            {stock.ticker}
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 6px',
            borderRadius: 6,
            background: sector.bg,
            color: sector.text,
          }}>
            {stock.sector}
          </span>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: isPositive ? 'var(--success)' : 'var(--danger)',
        }}>
          {isPositive ? '▲' : '▼'} {Math.abs(performance).toFixed(2)}%
        </span>
      </div>

      {/* Row 2: Price + Signal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
          {stock.current_price
            ? `₹${stock.current_price.toLocaleString('en-IN')}`
            : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>N/A</span>
          }
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 6,
          background: stock.signal === 'BUY' ? 'rgba(0,196,140,0.15)' : 'rgba(255,184,0,0.15)',
          color: stock.signal === 'BUY' ? 'var(--success)' : 'var(--warning)',
        }}>
          {stock.signal || '—'}
        </span>
      </div>

      {/* Row 3: 52W range */}
      {stock.week_52?.high && (
        <div style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: 4,
          borderTop: '1px solid var(--border)',
        }}>
          <span>H: ₹{stock.week_52.high.toLocaleString('en-IN')}</span>
          <span>L: ₹{stock.week_52.low.toLocaleString('en-IN')}</span>
        </div>
      )}
    </button>
  )
}
