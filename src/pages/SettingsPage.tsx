import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { Header } from '../components/layout/Header'
import { useAuth } from '../context/AuthContext'
import { Save, Shield, Activity } from 'lucide-react'

export function SettingsPage() {
  const { user } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [platformStats, setPlatformStats] = useState<any>(null)

  useEffect(() => {
    api.get('/api/v1/admin/settings/platform').then(setPlatformStats).catch(() => {})
  }, [])

  const saveProfile = async () => {
    setSaving(true); setMessage('')
    try {
      const body: any = { full_name: fullName }
      if (newPassword) {
        body.current_password = currentPassword
        body.new_password = newPassword
      }
      await api.patch('/api/v1/admin/settings/profile', body)
      setMessage('Profile updated successfully')
      setCurrentPassword(''); setNewPassword('')
    } catch (err: any) { setMessage(err.message || 'Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <Header title="Settings" subtitle="Manage your profile and platform configuration" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title="Profile" padding="20px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20 }}>
                {user?.full_name?.charAt(0) || 'A'}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 16 }}>{user?.full_name}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Role: {user?.role}</p>
              </div>
            </div>
            <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Leave blank to keep same" />
            <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep same" />
            {message && <p style={{ fontSize: 13, color: message.includes('success') ? '#22c55e' : '#ef4444' }}>{message}</p>}
            <Button onClick={saveProfile} disabled={saving} icon={<Save size={14} />}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="Account Info" padding="16px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={16} style={{ color: 'var(--text-muted)' }} />
                <div><p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Role</p><p style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</p></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Activity size={16} style={{ color: 'var(--text-muted)' }} />
                <div><p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Last Login</p><p style={{ fontSize: 14 }}>{user?.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}</p></div>
              </div>
            </div>
          </Card>

          {platformStats && (
            <Card title="Platform Overview" padding="16px">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Users</p><p style={{ fontSize: 18, fontWeight: 700 }}>{platformStats.total_users}</p></div>
                <div><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Agents</p><p style={{ fontSize: 18, fontWeight: 700 }}>{platformStats.total_agents}</p></div>
                <div><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Conversations</p><p style={{ fontSize: 18, fontWeight: 700 }}>{platformStats.total_conversations}</p></div>
                <div><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Users Today</p><p style={{ fontSize: 18, fontWeight: 700 }}>{platformStats.users_today}</p></div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
