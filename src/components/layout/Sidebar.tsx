import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Bot,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/support', icon: MessageSquare, label: 'Support' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { user, logout } = useAuth()

  const linkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
    background: isActive ? 'var(--bg-elevated)' : 'transparent',
    transition: 'all 0.15s ease',
  })

  return (
    <div style={{
      width: 240,
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'var(--brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 16,
          color: '#fff',
        }}>
          O
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Opsly</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admin Panel</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => linkStyle(isActive)}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 12px', marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.full_name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
        </div>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 14,
            width: '100%',
            fontFamily: 'inherit',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  )
}
