import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Header } from '../components/layout/Header'
import { Search, ChevronLeft, ChevronRight, FileText, HardDrive } from 'lucide-react'
import type { PaginatedDocuments, StorageUsage } from '../types'

function fmtBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function DocumentsPage() {
  const [data, setData] = useState<PaginatedDocuments | null>(null)
  const [storage, setStorage] = useState<StorageUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFailed, setShowFailed] = useState(false)

  const fetchData = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: '20' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    const endpoint = showFailed ? '/api/v1/admin/documents/failed' : `/api/v1/admin/documents?${params}`
    Promise.all([
      api.get<StorageUsage>('/api/v1/admin/documents/storage-summary'),
      api.get<PaginatedDocuments>(endpoint),
    ]).then(([s, d]) => { setStorage(s); setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [page, statusFilter, showFailed])

  const statusColors: Record<string, string> = { indexed: 'success', processing: 'info', pending: 'warning', failed: 'danger' }

  return (
    <div>
      <Header title="Documents" subtitle="Platform-wide document management" />

      {storage && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          <Card padding="14px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <HardDrive size={18} style={{ color: 'var(--brand)' }} />
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Total Storage</p>
                <p style={{ fontSize: 20, fontWeight: 700 }}>{fmtBytes(storage.total_size_bytes)}</p>
              </div>
            </div>
          </Card>
          <Card padding="14px">
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Total Files</p>
            <p style={{ fontSize: 20, fontWeight: 700 }}>{storage.total_files}</p>
          </Card>
          <Card padding="14px">
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Failed</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{storage.failed_count}</p>
          </Card>
          <Card padding="14px">
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Processing</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{storage.processing_count}</p>
          </Card>
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              placeholder="Search by filename or user email..."
              style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 140 }}>
            <option value="">All Status</option>
            <option value="indexed">Indexed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <Button variant={showFailed ? 'danger' : 'secondary'} size="sm" onClick={() => { setShowFailed(!showFailed); setPage(1) }}>
            Failed
          </Button>
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Filename', 'Agent', 'User', 'Type', 'Size', 'Status', 'Date', 'Error'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.documents.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                          {d.filename}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{d.agent_name || '—'}</td>
                      <td style={{ padding: '12px', fontSize: 13 }}>{d.user_email || '—'}</td>
                      <td style={{ padding: '12px', fontSize: 13 }}>{d.file_type}</td>
                      <td style={{ padding: '12px', fontSize: 13 }}>{fmtBytes(d.file_size_bytes)}</td>
                      <td style={{ padding: '12px' }}><Badge variant={(statusColors[d.status] || 'default') as any}>{d.status}</Badge></td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#ef4444', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.error_message || '—'}</td>
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
