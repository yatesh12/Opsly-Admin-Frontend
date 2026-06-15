import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Header } from '../components/layout/Header'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import type { PaginatedAuditLogs } from '../types'

export function AuditLogPage() {
  const [data, setData] = useState<PaginatedAuditLogs | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [days, setDays] = useState(7)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: '50', days: String(days) })
    if (actionFilter) params.set('action', actionFilter)
    api.get<PaginatedAuditLogs>(`/api/v1/admin/audit-logs?${params}`)
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [page, actionFilter, days])

  const actionColors: Record<string, string> = {
    user_blocked: 'danger', user_unblocked: 'success', user_deleted: 'danger',
    plan_changed: 'info', agent_deleted: 'danger', admin_created: 'info', admin_deleted: 'danger',
  }

  const actionLabels: Record<string, string> = {
    user_blocked: 'Blocked User', user_unblocked: 'Unblocked User', user_deleted: 'Deleted User',
    plan_changed: 'Changed Plan', agent_deleted: 'Deleted Agent', agent_created: 'Created Agent',
    admin_created: 'Created Admin', admin_deleted: 'Deleted Admin', user_updated: 'Updated User',
  }

  return (
    <div>
      <Header title="Audit Log" subtitle="Track admin actions across the platform" />

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
            <select value={days} onChange={(e) => { setDays(Number(e.target.value)); setPage(1) }}
              style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}>
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 180 }}>
            <option value="">All Actions</option>
            <option value="user_blocked">Blocked User</option>
            <option value="user_unblocked">Unblocked User</option>
            <option value="user_deleted">Deleted User</option>
            <option value="plan_changed">Changed Plan</option>
            <option value="agent_deleted">Deleted Agent</option>
            <option value="admin_created">Created Admin</option>
            <option value="admin_deleted">Deleted Admin</option>
          </select>
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Admin', 'Action', 'Resource', 'Resource ID', 'Details', 'Timestamp'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: 14 }}>{log.admin_email}</td>
                      <td style={{ padding: '12px' }}><Badge variant={(actionColors[log.action] || 'default') as any}>{actionLabels[log.action] || log.action}</Badge></td>
                      <td style={{ padding: '12px', fontSize: 13 }}>{log.resource_type}</td>
                      <td style={{ padding: '12px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{log.resource_id ? log.resource_id.substring(0, 8) + '...' : '—'}</td>
                      <td style={{ padding: '12px', fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details || '—'}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && data.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{((page - 1) * 50) + 1}-{Math.min(page * 50, data.total)} of {data.total}</span>
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
