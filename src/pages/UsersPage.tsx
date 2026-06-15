import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Header } from '../components/layout/Header'
import { Search, ChevronLeft, ChevronRight, Eye, Ban, Trash2 } from 'lucide-react'
import type { PaginatedUsers, UserDetail } from '../types'

export function UsersPage() {
  const [data, setData] = useState<PaginatedUsers | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchUsers = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: '20' })
    if (search) params.set('search', search)
    if (planFilter) params.set('plan', planFilter)
    api.get<PaginatedUsers>(`/api/v1/admin/users?${params}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [page, planFilter])

  const viewUser = async (userId: string) => {
    setDetailLoading(true)
    try {
      const user = await api.get<UserDetail>(`/api/v1/admin/users/${userId}`)
      setSelectedUser(user)
      setShowDetail(true)
    } catch (err) { console.error(err) }
    finally { setDetailLoading(false) }
  }

  const toggleUserStatus = async (userId: string, current: boolean) => {
    try {
      await api.patch(`/api/v1/admin/users/${userId}`, { is_active: !current })
      fetchUsers()
      if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, is_active: !current })
    } catch (err) { console.error(err) }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    try {
      await api.delete(`/api/v1/admin/users/${userId}`)
      setShowDetail(false)
      fetchUsers()
    } catch (err) { console.error(err) }
  }

  const planColors: Record<string, string> = { free: 'default', starter: 'info', growth: 'warning', pro: 'success', enterprise: 'danger' }

  return (
    <div>
      <Header title="Users" subtitle="Manage platform users" />

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Search users by email or name..."
              style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 160 }}>
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Email', 'Name', 'Plan', 'Agents', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: 14 }}>{user.email}</td>
                      <td style={{ padding: '12px', fontSize: 14 }}>{user.full_name || '—'}</td>
                      <td style={{ padding: '12px' }}><Badge variant={(planColors[user.plan] || 'default') as any}>{user.plan}</Badge></td>
                      <td style={{ padding: '12px', fontSize: 14 }}>{user.agent_count}</td>
                      <td style={{ padding: '12px' }}><Badge variant={user.is_active ? 'success' : 'danger'}>{user.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}><Button size="sm" variant="ghost" onClick={() => viewUser(user.id)}><Eye size={14} /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && data.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, data.total)} of {data.total}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></Button>
                  <Button size="sm" variant="secondary" disabled={page >= data.total_pages} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="User Details" width={560}>
        {detailLoading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : selectedUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email</label><p style={{ fontSize: 14 }}>{selectedUser.email}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Name</label><p style={{ fontSize: 14 }}>{selectedUser.full_name || '—'}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Plan</label><p style={{ fontSize: 14 }}><Badge variant={(planColors[selectedUser.plan] || 'default') as any}>{selectedUser.plan}</Badge></p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</label><p style={{ fontSize: 14 }}><Badge variant={selectedUser.is_active ? 'success' : 'danger'}>{selectedUser.is_active ? 'Active' : 'Inactive'}</Badge></p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Agents</label><p style={{ fontSize: 14 }}>{selectedUser.agent_count}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conversations</label><p style={{ fontSize: 14 }}>{selectedUser.total_conversations}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Documents</label><p style={{ fontSize: 14 }}>{selectedUser.total_documents}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Spent</label><p style={{ fontSize: 14 }}>${selectedUser.total_spent.toFixed(2)}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Company</label><p style={{ fontSize: 14 }}>{selectedUser.company || '—'}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Profession</label><p style={{ fontSize: 14 }}>{selectedUser.profession || '—'}</p></div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant={selectedUser.is_active ? 'danger' : 'primary'} size="sm" onClick={() => toggleUserStatus(selectedUser.id, selectedUser.is_active)} icon={<Ban size={14} />}>
                {selectedUser.is_active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteUser(selectedUser.id)} icon={<Trash2 size={14} />}>Delete</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
