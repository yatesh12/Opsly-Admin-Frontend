import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div>
      <Header title="Settings" subtitle="Admin profile and configuration" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title="Admin Profile">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email</label>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{user?.email}</p>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Name</label>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{user?.full_name}</p>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Role</label>
              <p style={{ fontSize: 14 }}><Badge variant="info">{user?.role}</Badge></p>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</label>
              <p style={{ fontSize: 14 }}><Badge variant={user?.is_active ? 'success' : 'danger'}>{user?.is_active ? 'Active' : 'Inactive'}</Badge></p>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last Login</label>
              <p style={{ fontSize: 14 }}>{user?.last_login ? new Date(user.last_login).toLocaleString() : '—'}</p>
            </div>
          </div>
        </Card>

        <Card title="Quick Info">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Application</label>
              <p style={{ fontSize: 14, fontWeight: 500 }}>Opsly Admin Panel</p>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Version</label>
              <p style={{ fontSize: 14 }}>1.0.0</p>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Database</label>
              <p style={{ fontSize: 14 }}>NeonDB (PostgreSQL)</p>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Frontend</label>
              <p style={{ fontSize: 14 }}>React + Vite + TypeScript</p>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Backend</label>
              <p style={{ fontSize: 14 }}>FastAPI + SQLAlchemy</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
