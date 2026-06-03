import { useState, useMemo } from 'react'

const columns = [
  { key: 'ticker', label: 'Stock' },
  { key: 'current_price', label: 'Price' },
  { key: 'day_percent', label: 'Day%' },
  { key: 'week_percent', label: 'Week%' },
  { key: 'month_percent', label: 'Month%' },
  { key: 'three_month_percent', label: '3M%' },
  { key: 'ytd_percent', label: 'YTD%' },
  { key: 'volume', label: 'Volume' },
  { key: 'signal', label: 'Signal' },
]

const formatPercent = (value) => (value == null ? '—' : `${value.toFixed(2)}%`)

const getCellColor = (value) => ({
  color: value == null ? 'var(--text)' : value >= 0 ? 'var(--success)' : 'var(--danger)',
})

export default function ComparisonTable({ stocks }) {
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'day_percent', direction: 'desc' })

  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    return stocks.filter((stock) =>
      stock.ticker.toLowerCase().includes(query) ||
      stock.sector.toLowerCase().includes(query)
    )
  }, [stocks, search])

  const sorted = useMemo(() => {
    const list = [...filtered]
    const { key, direction } = sortConfig
    list.sort((a, b) => {
      const left = a[key] ?? 0
      const right = b[key] ?? 0
      if (typeof left === 'string') {
        return direction === 'asc'
          ? left.localeCompare(right)
          : right.localeCompare(left)
      }
      return direction === 'asc' ? left - right : right - left
    })
    return list
  }, [filtered, sortConfig])

  const changeSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 24,
      padding: 24,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Comparison table</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Sector leaderboard</div>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search stock or sector"
          style={{
            minWidth: 220,
            padding: '12px 16px',
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
          }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => changeSort(column.key)}
                  style={{
                    textAlign: 'left',
                    padding: '14px 12px',
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((stock) => (
              <tr key={stock.ticker} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 12px', fontWeight: 700 }}>{stock.ticker}</td>
                <td style={{ padding: '14px 12px' }}>₹{stock.current_price?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 12px', ...getCellColor(stock.day_percent) }}>{formatPercent(stock.day_percent)}</td>
                <td style={{ padding: '14px 12px', ...getCellColor(stock.week_percent) }}>{formatPercent(stock.week_percent)}</td>
                <td style={{ padding: '14px 12px', ...getCellColor(stock.month_percent) }}>{formatPercent(stock.month_percent)}</td>
                <td style={{ padding: '14px 12px', ...getCellColor(stock.three_month_percent) }}>{formatPercent(stock.three_month_percent)}</td>
                <td style={{ padding: '14px 12px', ...getCellColor(stock.ytd_percent) }}>{formatPercent(stock.ytd_percent)}</td>
                <td style={{ padding: '14px 12px' }}>{stock.volume?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '14px 12px' }}>
                  <span style={{
                    display: 'inline-flex',
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid var(--border)',
                    color: stock.signal === 'BUY' ? 'var(--success)' : 'var(--warning)',
                    background: stock.signal === 'BUY' ? 'rgba(0,196,140,0.12)' : 'rgba(255,184,0,0.12)',
                    fontWeight: 700,
                    fontSize: 12,
                  }}>
                    {stock.signal}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
