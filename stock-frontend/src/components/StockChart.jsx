import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Legend,
} from 'recharts'

const PERIODS = ['1mo', '3mo', '6mo', '1y']

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const pricePoint = payload.find((item) => item.dataKey === 'close')
  const volumePoint = payload.find((item) => item.dataKey === 'volume')

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 12,
      color: 'var(--text)',
      minWidth: 180,
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 8 }}>{label}</div>
      {pricePoint && (
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          Price: ₹{Number(pricePoint.value).toLocaleString('en-IN')}
        </div>
      )}
      {volumePoint && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          Volume: {Number(volumePoint.value).toLocaleString('en-IN')}
        </div>
      )}
      {payload.map((item) => (
        item.dataKey !== 'close' && item.dataKey !== 'volume' ? (
          <div key={item.dataKey} style={{ color: item.color, fontSize: 12 }}>
            {item.name}: ₹{Number(item.value).toLocaleString('en-IN')}
          </div>
        ) : null
      ))}
    </div>
  )
}

export default function StockChart({ history, ticker, period, onPeriodChange, showBollinger, toggleBollinger, technical }) {
  if (!history?.length) {
    return (
      <div style={{
        background: 'var(--card)',
        borderRadius: 20,
        border: '1px solid var(--border)',
        minHeight: 360,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
      }}>
        Chart load ho raha hai...
      </div>
    )
  }

  const chartData = history.map((point) => ({
    date: point.date.slice(5),
    close: point.close,
    volume: point.volume,
    ma_20: point.ma_20,
    bb_upper: point.bb_upper,
    bb_lower: point.bb_lower,
  }))

  const hasBollinger = showBollinger && technical?.bollinger?.upper && technical?.bollinger?.lower

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: 24,
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{ticker} — Market chart</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Price, volume and technical zones
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            onClick={toggleBollinger}
            style={{
              borderRadius: 10,
              border: `1px solid ${showBollinger ? 'var(--primary)' : 'var(--border)'}`,
              background: showBollinger ? 'var(--primary)22' : 'var(--card)',
              color: showBollinger ? 'var(--primary)' : 'var(--text-muted)',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Bollinger Bands
          </button>
          {PERIODS.map((item) => (
            <button
              key={item}
              onClick={() => onPeriodChange(item)}
              style={{
                borderRadius: 10,
                border: `1px solid ${period === item ? 'var(--primary)' : 'var(--border)'}`,
                background: period === item ? 'var(--primary)22' : 'var(--card)',
                color: period === item ? 'var(--primary)' : 'var(--text-muted)',
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 420 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="price"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `₹${value}`}
              width={70}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${Math.round(value / 100000)}k`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ color: 'var(--text-muted)', fontSize: 12 }} />

            {hasBollinger && (
              <ReferenceArea
                y1={technical.bollinger.lower}
                y2={technical.bollinger.middle}
                stroke="var(--success)"
                fill="var(--success)"
                fillOpacity={0.08}
              />
            )}
            {hasBollinger && (
              <ReferenceArea
                y1={technical.bollinger.middle}
                y2={technical.bollinger.upper}
                stroke="var(--danger)"
                fill="var(--danger)"
                fillOpacity={0.08}
              />
            )}

            <Bar
              yAxisId="volume"
              dataKey="volume"
              barSize={10}
              fill="var(--primary)"
              opacity={0.25}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="close"
              name="Close"
              stroke="var(--success)"
              strokeWidth={2.5}
              dot={false}
            />
            {hasBollinger && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bb_upper"
                name="Upper BB"
                stroke="var(--warning)"
                strokeWidth={1.2}
                dot={false}
                strokeDasharray="4 4"
              />
            )}
            {hasBollinger && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bb_lower"
                name="Lower BB"
                stroke="var(--danger)"
                strokeWidth={1.2}
                dot={false}
                strokeDasharray="4 4"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
