import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Header } from '../components/layout/Header'
import { Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import type { PaginatedContradictions } from '../types'

export function ContradictionsPage() {
  const [data, setData] = useState<PaginatedContradictions | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [severityFilter, setSeverityFilter] = useState('')
  const [resolvedFilter, setResolvedFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: '20' })
    if (severityFilter) params.set('severity', severityFilter)
    if (resolvedFilter) params.set('resolved', resolvedFilter)
    Promise.all([
      api.get('/api/v1/admin/contradictions/stats'),
      api.get<PaginatedContradictions>(`/api/v1/admin/contradictions?${params}`),
    ]).then(([s, d]) => { setStats(s); setData(d) })
      .catch(console.error).finally(() => setLoading(false))
  }, [page, severityFilter, resolvedFilter])

  const severityColors: Record<string, string> = { high: 'danger', medium: 'warning', low: 'info' }

  return (
    <div>
      <Header title="Contradictions" subtitle="Knowledge conflicts across agents" />

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</p><p style={{ fontSize: 20, fontWeight: 700 }}>{stats.total}</p></Card>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unresolved</p><p style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{stats.unresolved}</p></Card>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>High Severity</p><p style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>{stats.high_severity}</p></Card>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Medium</p><p style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>{stats.medium_severity}</p></Card>
          <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Low</p><p style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>{stats.low_severity}</p></Card>
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 140 }}>
            <option value="">All Severity</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={resolvedFilter} onChange={(e) => { setResolvedFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 140 }}>
            <option value="">All</option>
            <option value="false">Unresolved</option>
            <option value="true">Resolved</option>
          </select>
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Topic', 'Agent', 'Severity', 'Status', 'Created'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.contradictions.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={14} style={{ color: c.severity === 'high' ? '#ef4444' : c.severity === 'medium' ? '#f59e0b' : '#3b82f6' }} />
                          {c.topic}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.description.substring(0, 100)}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13 }}>{c.agent_name || '—'}</td>
                      <td style={{ padding: '12px' }}><Badge variant={(severityColors[c.severity] || 'default') as any}>{c.severity}</Badge></td>
                      <td style={{ padding: '12px' }}><Badge variant={c.resolved_at ? 'success' : 'warning'}>{c.resolved_at ? 'Resolved' : 'Open'}</Badge></td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && data.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
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
