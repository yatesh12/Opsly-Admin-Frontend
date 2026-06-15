import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Header } from '../components/layout/Header'
import { Search, ChevronLeft, ChevronRight, Download, IndianRupee } from 'lucide-react'
import type { PaginatedBilling, RevenueSummary } from '../types'

function fmt(paise: number) { return `₹${Math.round(paise / 100).toLocaleString('en-IN')}` }

export function BillingPage() {
  const [data, setData] = useState<PaginatedBilling | null>(null)
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null)
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
    const endpoint = showFailed ? '/api/v1/admin/billing/failed' : `/api/v1/admin/billing?${params}`
    Promise.all([
      api.get<RevenueSummary>('/api/v1/admin/billing/revenue-summary?days=30'),
      api.get<PaginatedBilling>(endpoint),
    ]).then(([r, d]) => { setRevenue(r); setData(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [page, statusFilter, showFailed])

  const statusColors: Record<string, string> = { captured: 'success', completed: 'success', failed: 'danger', refunded: 'warning', pending: 'info' }

  return (
    <div>
      <Header title="Billing" subtitle="Revenue and payment records" />

      {revenue && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          <Card padding="14px">
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Total Revenue</p>
            <p style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{fmt(revenue.total_revenue_paise)}</p>
          </Card>
          <Card padding="14px">
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Revenue (30d)</p>
            <p style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{fmt(revenue.period_revenue_paise)}</p>
          </Card>
          <Card padding="14px">
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Transactions</p>
            <p style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{revenue.total_transactions}</p>
          </Card>
          <Card padding="14px">
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Avg Value</p>
            <p style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{fmt(Math.round(revenue.avg_transaction_value_paise))}</p>
          </Card>
          <Card padding="14px">
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Failed</p>
            <p style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: '#ef4444' }}>{revenue.failed_transactions}</p>
          </Card>
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              placeholder="Search by email or order ID..."
              style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 140 }}>
            <option value="">All Status</option>
            <option value="captured">Captured</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="pending">Pending</option>
          </select>
          <Button variant={showFailed ? 'primary' : 'secondary'} size="sm" onClick={() => { setShowFailed(!showFailed); setPage(1) }}>
            Failed
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.open('/api/v1/admin/billing/export', '_blank')} icon={<Download size={14} />}>
            Export CSV
          </Button>
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['User', 'Order', 'Amount', 'Currency', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.records.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: 14 }}>
                        <div>{r.user_email}</div>
                        {r.user_name && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.user_name}</div>}
                      </td>
                      <td style={{ padding: '12px', fontSize: 13 }}>{r.order_id}</td>
                      <td style={{ padding: '12px', fontSize: 14, fontWeight: 600 }}>{fmt(r.amount_paise)}</td>
                      <td style={{ padding: '12px', fontSize: 13 }}>{r.currency}</td>
                      <td style={{ padding: '12px' }}><Badge variant={(statusColors[r.status] || 'default') as any}>{r.status}</Badge></td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
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
