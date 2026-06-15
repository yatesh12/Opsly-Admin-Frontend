import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Header } from '../components/layout/Header'
import { Search, ChevronLeft, ChevronRight, Eye, Ban, Trash2, Activity, IndianRupee } from 'lucide-react'
import type { PaginatedUsers, UserDetail, UserActivityLog, UserBillingEntry } from '../types'

function fmt(paise: number) { return `₹${Math.round(paise / 100).toLocaleString('en-IN')}` }

export function UsersPage() {
  const [data, setData] = useState<PaginatedUsers | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState<'info' | 'activity' | 'billing'>('info')
  const [activityLog, setActivityLog] = useState<UserActivityLog | null>(null)
  const [billingHistory, setBillingHistory] = useState<{ records: UserBillingEntry[] } | null>(null)

  const fetchUsers = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: '20' })
    if (search) params.set('search', search)
    if (planFilter) params.set('plan', planFilter)
    api.get<PaginatedUsers>(`/api/v1/admin/users?${params}`)
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [page, planFilter])

  const viewUser = async (userId: string) => {
    setDetailLoading(true); setShowDetail(true); setDetailTab('info')
    try {
      const user = await api.get<UserDetail>(`/api/v1/admin/users/${userId}`)
      setSelectedUser(user)
      const [act, bill] = await Promise.all([
        api.get<UserActivityLog>(`/api/v1/admin/users/${userId}/activity`),
        api.get<{ records: UserBillingEntry[] }>(`/api/v1/admin/users/${userId}/billing?per_page=10`),
      ])
      setActivityLog(act); setBillingHistory(bill)
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
    if (!confirm('Delete this user? This cannot be undone.')) return
    try { await api.delete(`/api/v1/admin/users/${userId}`); setShowDetail(false); fetchUsers() }
    catch (err) { console.error(err) }
  }

  const planColors: Record<string, string> = { free: 'default', starter: 'info', builder: 'info', pro: 'success', enterprise: 'danger' }

  return (
    <div>
      <Header title="Users" subtitle="Manage platform users" />

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              placeholder="Search by email or name..."
              style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 160 }}>
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="builder">Builder</option>
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
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{((page - 1) * 20) + 1}-{Math.min(page * 20, data.total)} of {data.total}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></Button>
                  <Button size="sm" variant="secondary" disabled={page >= data.total_pages} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="User Details" width={640}>
        {detailLoading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : selectedUser ? (
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              {(['info', 'activity', 'billing'] as const).map(tab => (
                <button key={tab} onClick={() => setDetailTab(tab)}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: 'none',
                    background: detailTab === tab ? 'var(--brand)' : 'transparent',
                    color: detailTab === tab ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 13, fontWeight: detailTab === tab ? 600 : 400, fontFamily: 'inherit',
                  }}>
                  {tab === 'info' ? 'Info' : tab === 'activity' ? 'Activity' : 'Billing'}
                </button>
              ))}
            </div>

            {detailTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email</label><p style={{ fontSize: 14 }}>{selectedUser.email}</p></div>
                  <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Name</label><p style={{ fontSize: 14 }}>{selectedUser.full_name || '—'}</p></div>
                  <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Plan</label><p style={{ fontSize: 14 }}><Badge variant={(planColors[selectedUser.plan] || 'default') as any}>{selectedUser.plan}</Badge></p></div>
                  <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</label><p style={{ fontSize: 14 }}><Badge variant={selectedUser.is_active ? 'success' : 'danger'}>{selectedUser.is_active ? 'Active' : 'Inactive'}</Badge></p></div>
                  <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Agents</label><p style={{ fontSize: 14 }}>{selectedUser.agent_count}</p></div>
                  <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conversations</label><p style={{ fontSize: 14 }}>{selectedUser.total_conversations}</p></div>
                  <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Documents</label><p style={{ fontSize: 14 }}>{selectedUser.total_documents}</p></div>
                  <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Spent</label><p style={{ fontSize: 14 }}>{fmt(Math.round(selectedUser.total_spent * 100))}</p></div>
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
            )}

            {detailTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activityLog && (
                  <>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Recent Conversations</h4>
                      {activityLog.recent_conversations.length > 0 ? activityLog.recent_conversations.slice(0, 5).map((c: any) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                          <span>Agent: {c.agent_name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                      )) : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No conversations</p>}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Recent Documents</h4>
                      {activityLog.recent_documents.length > 0 ? activityLog.recent_documents.slice(0, 5).map((d: any) => (
                        <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                          <span>{d.filename} <Badge variant={d.status === 'indexed' ? 'success' : d.status === 'failed' ? 'danger' : 'default'}>{d.status}</Badge></span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(d.created_at).toLocaleDateString()}</span>
                        </div>
                      )) : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No documents</p>}
                    </div>
                  </>
                )}
              </div>
            )}

            {detailTab === 'billing' && (
              <div>
                {billingHistory && billingHistory.records.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)' }}>Order</th>
                          <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)' }}>Amount</th>
                          <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)' }}>Status</th>
                          <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingHistory.records.map(r => (
                          <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 10px', fontSize: 13 }}>{r.order_id}</td>
                            <td style={{ padding: '8px 10px', fontSize: 13, fontWeight: 600 }}>{fmt(r.amount_paise)}</td>
                            <td style={{ padding: '8px 10px' }}><Badge variant={r.status === 'captured' ? 'success' : r.status === 'failed' ? 'danger' : 'warning'}>{r.status}</Badge></td>
                            <td style={{ padding: '8px 10px', fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>No billing history</p>}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
