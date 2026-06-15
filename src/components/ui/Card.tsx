import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  padding?: string
  style?: React.CSSProperties
}

export function Card({ title, subtitle, action, children, padding = '20px', style }: CardProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      ...style,
    }}>
      {(title || action) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: title ? '1px solid var(--border)' : 'none',
        }}>
          <div>
            {title && <h3 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  )
}
