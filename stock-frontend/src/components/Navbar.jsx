export default function Navbar({ lastUpdated }) {
  return (
    <nav style={{
      background: 'var(--card)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 70,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24 }}>📈</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Indian Market Dashboard</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>NSE live insights and technical view</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {lastUpdated && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}
        <span style={{
          fontSize: 11,
          background: 'var(--primary)22',
          color: 'var(--primary)',
          padding: '4px 10px',
          borderRadius: 999,
          fontWeight: 700,
        }}>
          Live NSE
        </span>
      </div>
    </nav>
  )
}
