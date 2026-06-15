import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  children: ReactNode
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  const colors: Record<string, React.CSSProperties> = {
    default: { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' },
    success: { background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)' },
    warning: { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' },
    danger: { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' },
    info: { background: 'rgba(59, 130, 246, 0.15)', color: 'var(--info)' },
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500,
      ...colors[variant],
    }}>
      {children}
    </span>
  )
}
