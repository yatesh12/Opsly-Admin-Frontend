import { Search } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  search?: boolean
}

export function Header({ title, subtitle, search: showSearch = false }: HeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{subtitle}</p>}
      </div>
      {showSearch && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text-muted)',
          width: 280,
        }}>
          <Search size={16} />
          <input
            placeholder="Search..."
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>
      )}
    </div>
  )
}
