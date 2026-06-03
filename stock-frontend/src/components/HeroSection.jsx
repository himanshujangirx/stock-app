import { LineChart, Line, ResponsiveContainer } from 'recharts'

export default function HeroSection({ overview, totalValue, bestPerformer, worstPerformer }) {
  const active = overview?.market_status === 'OPEN'
  const trend = overview?.change_percent >= 0
  const sparkData = overview?.history?.map((item) => ({ date: item.date.slice(5), value: item.close })) || []

  return (
    <section style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 24,
      padding: 28,
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
        <div style={{ minWidth: 260 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
            NIFTY 50 snapshot
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 36, fontWeight: 800 }}>₹{overview?.current_price?.toLocaleString('en-IN')}</div>
            <div style={{
              fontSize: 12,
              color: trend ? 'var(--success)' : 'var(--danger)',
              fontWeight: 700,
            }}>
              {trend ? '▲' : '▼'} {overview?.change_percent?.toFixed(2)}%
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: 11,
              color: active ? 'var(--success)' : 'var(--danger)',
              background: active ? 'rgba(0, 196, 140, 0.12)' : 'rgba(255, 100, 124, 0.12)',
              padding: '6px 12px',
              borderRadius: 999,
              fontWeight: 700,
            }}>
              {overview?.market_status}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Last updated {overview?.last_updated ? new Date(overview.last_updated).toLocaleTimeString() : '--'}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Nifty trend
          </div>
          <div style={{ width: '100%', height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ minWidth: 240, display: 'grid', gap: 10 }}>
          <div style={{
            background: 'rgba(79, 142, 247, 0.08)',
            borderRadius: 18,
            padding: 18,
            border: '1px solid rgba(79, 142, 247, 0.16)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
              Total portfolio value
            </div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>₹{totalValue?.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>1 share from each stock</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: 'var(--bg)', borderRadius: 18, padding: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Best performer</div>
              <div style={{ fontWeight: 700 }}>{bestPerformer?.ticker}</div>
              <div style={{ fontSize: 12, color: 'var(--success)' }}>{bestPerformer?.day_percent?.toFixed(2)}%</div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 18, padding: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Worst performer</div>
              <div style={{ fontWeight: 700 }}>{worstPerformer?.ticker}</div>
              <div style={{ fontSize: 12, color: 'var(--danger)' }}>{worstPerformer?.day_percent?.toFixed(2)}%</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
