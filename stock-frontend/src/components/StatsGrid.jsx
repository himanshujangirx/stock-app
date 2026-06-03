function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg)',
      borderRadius: 16,
      padding: '18px',
      border: '1px solid var(--border)',
      minHeight: 88,
    }}>
      <div style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        marginBottom: 8,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 18,
        fontWeight: 700,
        color: color || 'var(--text)',
      }}>
        {value}
      </div>
    </div>
  )
}

function gaugeColor(value) {
  if (value < 30) return 'var(--success)'
  if (value > 70) return 'var(--danger)'
  return 'var(--warning)'
}

function getRecommendation(stock, technical) {
  if (!stock || !technical) return 'Loading'
  const rsi = technical.rsi || 0
  const strength = stock.current_price / (stock.averages?.ma_30 || stock.current_price)
  const fromHigh = stock.week_52?.high ? (1 - stock.current_price / stock.week_52.high) * 100 : 0

  if (strength > 1.05 && rsi < 70 && fromHigh < 25) return 'Strong Buy'
  if (strength > 0.95 && rsi < 65) return 'Buy'
  if (rsi > 70 || fromHigh > 45) return 'Sell'
  return 'Hold'
}

export default function StatsGrid({ stock, technical }) {
  if (!stock) return null

  const rsi = technical?.rsi ?? 0
  const high = stock.week_52?.high || 1
  const low = stock.week_52?.low || 0
  const rangePercent = high > low ? ((stock.current_price - low) / (high - low)) * 100 : 0
  const distance = high > 0 ? ((1 - stock.current_price / high) * 100).toFixed(2) : '0.00'
  const recommendation = getRecommendation(stock, technical)

  const formatNumber = (num) => (num == null ? '—' : Number(num).toLocaleString('en-IN'))
  const formatMoney = (num) => (num == null ? '—' : `₹${Number(num).toLocaleString('en-IN')}`)

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: 24,
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: 18,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div style={{
          background: 'var(--bg)',
          borderRadius: 20,
          padding: 20,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.2 }}>
            RSI (14-day)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(Math.max(rsi, 0), 100)}%`,
                height: '100%',
                background: gaugeColor(rsi),
                transition: 'width 0.25s ease',
              }} />
            </div>
            <div style={{ minWidth: 50, textAlign: 'right', fontWeight: 700 }}>{rsi?.toFixed(1)}</div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
            <span>Oversold</span>
            <span>Neutral</span>
            <span>Overbought</span>
          </div>
        </div>

        <div style={{
          background: 'var(--bg)',
          borderRadius: 20,
          padding: 20,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.2 }}>
            Recommendation
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: recommendation === 'Sell' ? 'var(--danger)' : recommendation === 'Strong Buy' ? 'var(--success)' : 'var(--primary)' }}>
            {recommendation}
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Based on RSI, moving averages and 52-week position.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
        <StatBox label="P/E ratio" value={stock.pe_ratio ? stock.pe_ratio.toFixed(2) : '—'} />
        <StatBox label="Market cap" value={stock.market_cap ? `₹${(stock.market_cap / 1_00_00_000_000).toFixed(2)}T` : '—'} />
        <StatBox label="Distance from 52W high" value={`${distance}%`} color={stock.current_price < high ? 'var(--danger)' : 'var(--success)'} />
      </div>

      <div style={{
        background: 'rgba(79, 142, 247, 0.08)',
        borderRadius: 16,
        padding: 18,
        border: '1px solid rgba(79, 142, 247, 0.16)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.2 }}>52W Range</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stock.week_52?.low?.toLocaleString('en-IN')} - {stock.week_52?.high?.toLocaleString('en-IN')}</div>
        </div>
        <div style={{ height: 10, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(Math.max(rangePercent, 0), 100)}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s ease' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
        <StatBox label="52W High" value={`₹${formatNumber(stock.week_52?.high)}`} color="var(--success)" />
        <StatBox label="52W Low" value={`₹${formatNumber(stock.week_52?.low)}`} color="var(--danger)" />
        <StatBox label="MA 30" value={`₹${formatNumber(stock.averages?.ma_30)}`} color="var(--warning)" />
      </div>
    </div>
  )
}
