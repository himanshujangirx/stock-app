import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export default function SectorPerformance({ sectors }) {
  if (!sectors?.length) {
    return (
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: 24,
      }}>
        <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>Sector performance loading...</div>
      </div>
    )
  }

  const chartData = sectors.map((sector) => ({
    sector: sector.sector,
    '1W': sector.avg_1w,
    '1M': sector.avg_1m,
    '3M': sector.avg_3m,
  }))

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 24,
      padding: 24,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
            Sector performance
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Average returns by sector</div>
        </div>
      </div>

      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 12, right: 28, left: -16, bottom: 12 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="sector" stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text)' }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12, fill: 'var(--text)' }} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <Legend wrapperStyle={{ color: 'var(--text-muted)', fontSize: 12 }} />
            <Bar dataKey="1W" fill="var(--success)" radius={[10, 10, 0, 0]} />
            <Bar dataKey="1M" fill="var(--primary)" radius={[10, 10, 0, 0]} />
            <Bar dataKey="3M" fill="var(--warning)" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 22 }}>
        {sectors.map((sector) => (
          <div key={sector.sector} style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 18,
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.2 }}>
              {sector.sector}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{sector.best_stock}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Best stock
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>1W</div>
              <div style={{ fontWeight: 700, color: sector.avg_1w >= 0 ? 'var(--success)' : 'var(--danger)' }}>{sector.avg_1w?.toFixed(2)}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>1M</div>
              <div style={{ fontWeight: 700, color: sector.avg_1m >= 0 ? 'var(--success)' : 'var(--danger)' }}>{sector.avg_1m?.toFixed(2)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
