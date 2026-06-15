import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Header } from '../components/layout/Header'
import { Search, ChevronLeft, ChevronRight, RefreshCw, XCircle } from 'lucide-react'
import type { PaginatedTrainingJobs, TrainingMetrics } from '../types'

export function TrainingPage() {
  const [data, setData] = useState<PaginatedTrainingJobs | null>(null)
  const [metrics, setMetrics] = useState<TrainingMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchData = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: '20' })
    if (statusFilter) params.set('status', statusFilter)
    Promise.all([
      api.get<TrainingMetrics>('/api/v1/admin/training/metrics'),
      api.get<PaginatedTrainingJobs>(`/api/v1/admin/training?${params}`),
    ]).then(([m, d]) => { setMetrics(m); setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [page, statusFilter])

  const retryJob = async (jobId: string) => {
    try { await api.post(`/api/v1/admin/training/${jobId}/retry`); fetchData() }
    catch (err) { console.error(err) }
  }

  const cancelJob = async (jobId: string) => {
    if (!confirm('Cancel this training job?')) return
    try { await api.post(`/api/v1/admin/training/${jobId}/cancel`); fetchData() }
    catch (err) { console.error(err) }
  }

  const statusColors: Record<string, string> = { completed: 'success', running: 'info', queued: 'warning', failed: 'danger', cancelled: 'default' }

  return (
    <div>
      <Header title="Training Jobs" subtitle="Monitor and manage training jobs" />

      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</p><p style={{ fontSize: 20, fontWeight: 700 }}>{metrics.total_jobs}</p></Card>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Completed</p><p style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>{metrics.completed_jobs}</p></Card>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Failed</p><p style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{metrics.failed_jobs}</p></Card>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Running</p><p style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>{metrics.running_jobs}</p></Card>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Queued</p><p style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{metrics.queued_jobs}</p></Card>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chunks Created</p><p style={{ fontSize: 20, fontWeight: 700 }}>{metrics.total_chunks_created.toLocaleString()}</p></Card>
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 160 }}>
            <option value="">All Status</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Status', 'Agent', 'User', 'Progress', 'Docs', 'Chunks', 'Error', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.jobs.map(j => (
                    <tr key={j.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}><Badge variant={(statusColors[j.status] || 'default') as any}>{j.status}</Badge></td>
                      <td style={{ padding: '12px', fontSize: 14 }}>{j.agent_name || '—'}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{j.user_email || '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', width: 80 }}>
                            <div style={{ width: `${j.progress}%`, height: '100%', background: 'var(--brand)', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12 }}>{j.progress.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13 }}>{j.docs_processed}/{j.docs_total}</td>
                      <td style={{ padding: '12px', fontSize: 13 }}>{j.chunks_created}</td>
                      <td style={{ padding: '12px', fontSize: 12, color: '#ef4444', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.error_message || '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(j.status === 'failed' || j.status === 'cancelled') && <Button size="sm" variant="ghost" onClick={() => retryJob(j.id)}><RefreshCw size={14} /></Button>}
                          {(j.status === 'queued' || j.status === 'running') && <Button size="sm" variant="ghost" onClick={() => cancelJob(j.id)} style={{ color: '#ef4444' }}><XCircle size={14} /></Button>}
                        </div>
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
