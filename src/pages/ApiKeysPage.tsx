import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Header } from '../components/layout/Header'
import { Search, ChevronLeft, ChevronRight, Key, Ban } from 'lucide-react'
import type { PaginatedApiKeys, ApiKeyUsageStats } from '../types'

export function ApiKeysPage() {
  const [data, setData] = useState<PaginatedApiKeys | null>(null)
  const [stats, setStats] = useState<ApiKeyUsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')

  const fetchData = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: '20' })
    if (search) params.set('search', search)
    if (activeFilter) params.set('is_active', activeFilter)
    Promise.all([
      api.get<ApiKeyUsageStats>('/api/v1/admin/api-keys/stats'),
      api.get<PaginatedApiKeys>(`/api/v1/admin/api-keys?${params}`),
    ]).then(([s, d]) => { setStats(s); setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [page, activeFilter])

  const revokeKey = async (keyId: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return
    try { await api.patch(`/api/v1/admin/api-keys/${keyId}/revoke`); fetchData() }
    catch (err) { console.error(err) }
  }

  return (
    <div>
      <Header title="API Keys" subtitle="Manage API keys across the platform" />

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Keys</p><p style={{ fontSize: 20, fontWeight: 700 }}>{stats.total_keys}</p></Card>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active</p><p style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>{stats.active_keys}</p></Card>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expired</p><p style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{stats.expired_keys}</p></Card>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total Requests</p><p style={{ fontSize: 20, fontWeight: 700 }}>{stats.total_requests.toLocaleString()}</p></Card>
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              placeholder="Search by key name or user email..."
              style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          <select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 140 }}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Name', 'Key', 'Agent', 'User', 'Requests', 'Status', 'Expires', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.keys.map(k => (
                    <tr key={k.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Key size={14} style={{ color: 'var(--text-muted)' }} />
                          {k.name}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 13 }}>{k.key_prefix}...</td>
                      <td style={{ padding: '12px', fontSize: 13 }}>{k.agent_name || '—'}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{k.user_email || '—'}</td>
                      <td style={{ padding: '12px', fontSize: 14 }}>{k.request_count.toLocaleString()}</td>
                      <td style={{ padding: '12px' }}><Badge variant={k.is_active ? 'success' : 'danger'}>{k.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Never'}</td>
                      <td style={{ padding: '12px' }}>
                        {k.is_active && <Button size="sm" variant="ghost" onClick={() => revokeKey(k.id)} style={{ color: '#ef4444' }}><Ban size={14} /></Button>}
                      </td>
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
    </div>
  )
}
