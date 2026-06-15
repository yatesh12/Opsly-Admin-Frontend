import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Header } from '../components/layout/Header'
import { Plus, Shield, Trash2 } from 'lucide-react'
import type { AdminUser } from '../types'

export function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'admin' })
  const [saving, setSaving] = useState(false)

  const fetchData = () => {
    setLoading(true)
    api.get<{ admins: AdminUser[] }>('/api/v1/admin/admin-users')
      .then(r => setAdmins(r.admins)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const create = async () => {
    setSaving(true)
    try { await api.post('/api/v1/admin/admin-users', form); setShowCreate(false); fetchData() }
    catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const toggleStatus = async (adminId: string, current: boolean) => {
    try { await api.patch(`/api/v1/admin/admin-users/${adminId}`, { is_active: !current }); fetchData() }
    catch (err) { console.error(err) }
  }

  const deleteAdmin = async (adminId: string) => {
    if (!confirm('Delete this admin user?')) return
    try { await api.delete(`/api/v1/admin/admin-users/${adminId}`); fetchData() }
    catch (err) { console.error(err) }
  }

  const roleColors: Record<string, string> = { super_admin: 'danger', admin: 'info', support: 'warning', analyst: 'default' }

  return (
    <div>
      <Header title="Admin Users" subtitle="Manage admin panel access" />
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => setShowCreate(true)} icon={<Plus size={14} />}>Add Admin</Button>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Shield size={14} style={{ color: 'var(--brand)' }} />
                      {a.full_name}
                    </td>
                    <td style={{ padding: '12px', fontSize: 13 }}>{a.email}</td>
                    <td style={{ padding: '12px' }}><Badge variant={(roleColors[a.role] || 'default') as any}>{a.role}</Badge></td>
                    <td style={{ padding: '12px' }}><Badge variant={a.is_active ? 'success' : 'danger'}>{a.is_active ? 'Active' : 'Inactive'}</Badge></td>
                    <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{a.last_login ? new Date(a.last_login).toLocaleDateString() : 'Never'}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Button size="sm" variant="ghost" onClick={() => toggleStatus(a.id, a.is_active)}>
                          {a.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteAdmin(a.id)} style={{ color: '#ef4444' }}><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Admin User" width={420}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="support">Support</option>
              <option value="analyst">Analyst</option>
            </select>
          </div>
          <Button onClick={create} disabled={saving}>{saving ? 'Creating...' : 'Create Admin'}</Button>
        </div>
      </Modal>
    </div>
  )
}
