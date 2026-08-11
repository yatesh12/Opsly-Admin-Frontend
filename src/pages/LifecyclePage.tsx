/**
 * Read-only operator view of subscription lifecycle and email delivery.
 *
 * There is no "set plan" control here and there will not be one. An operator
 * who can change entitlement with a click and no recorded reason is a second
 * grant path alongside verified payment, and an entitlement nobody can
 * attribute is an entitlement nobody can audit. Manual grants go through
 * `scripts/grant_plan.py`, which requires a reason and writes an event
 * carrying `grant_source=operator` — so a granted plan is always
 * distinguishable from a purchased one, and this page shows that difference.
 *
 * Every figure comes from a COUNT the backend performed. When there is
 * nothing to count, this says so rather than rendering zeroes that look like
 * measurements.
 */

import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { Header } from '../components/layout/Header'
import { AlertTriangle } from 'lucide-react'

interface Summary {
  has_data: boolean
  subscriptions_total: number
  by_status: { status: string; count: number }[]
  by_plan: { plan_id: string; status: string; count: number }[]
  free_expiry: { no_expiry?: number; in_period?: number; past_expiry?: number }
  email_deliveries: { email_class: string; status: string; count: number }[]
  marketing_consent: { marketing_consent: string; count: number }[]
  suppressions: { scope: string; reason: string; count: number }[]
  permanently_failed_emails: number
}

interface SubscriptionRow {
  id: string
  user_id: string
  email: string
  full_name: string
  plan_id: string
  catalog_version: string
  status: string
  billing_period: string | null
  current_period_end: string | null
  free_period_end: string | null
  cancel_at_period_end: boolean
  auto_renew: boolean
  grant_source: string | null
  organisation_name: string | null
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  free: 'default',
  past_due: 'warning',
  grace_period: 'warning',
  cancelled: 'warning',
  expired: 'danger',
  suspended: 'danger',
  payment_failed: 'danger',
  pending_activation: 'default',
}

function date(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—'
}

export function LifecyclePage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [rows, setRows] = useState<SubscriptionRow[]>([])
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''
      const [s, list] = await Promise.all([
        api.get<Summary>('/api/v1/admin/lifecycle/summary'),
        api.get<{ subscriptions: SubscriptionRow[] }>(
          `/api/v1/admin/lifecycle/subscriptions${query}`,
        ),
      ])
      setSummary(s)
      setRows(list.subscriptions)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && !summary) {
    return (
      <>
        <Header title="Lifecycle" />
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spinner />
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Lifecycle" />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {error && (
          <Card>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--danger)', fontSize: 13 }}>
              <AlertTriangle size={16} /> {error}
            </div>
          </Card>
        )}

        {summary && !summary.has_data ? (
          <Card>
            <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No subscriptions exist yet, so there is nothing to report.
            </div>
          </Card>
        ) : (
          summary && (
            <>
              {summary.permanently_failed_emails > 0 && (
                <Card>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--warning)', fontSize: 13 }}>
                    <AlertTriangle size={16} />
                    <span>
                      <strong>{summary.permanently_failed_emails}</strong> email
                      {summary.permanently_failed_emails === 1 ? '' : 's'} exhausted
                      every retry and will not be attempted again.
                    </span>
                  </div>
                </Card>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
                <Panel title="Subscriptions by status">
                  {summary.by_status.map((r) => (
                    <Row key={r.status} label={r.status.replace(/_/g, ' ')} value={r.count} />
                  ))}
                </Panel>

                <Panel title="Free periods">
                  <Row label="In period" value={summary.free_expiry.in_period ?? 0} />
                  <Row label="Past expiry" value={summary.free_expiry.past_expiry ?? 0} />
                  <Row
                    label="No expiry set"
                    value={summary.free_expiry.no_expiry ?? 0}
                    hint="Accounts created before Phase 4. Open-ended by design; never shortened retroactively."
                  />
                </Panel>

                <Panel title="Marketing consent">
                  {summary.marketing_consent.length === 0 ? (
                    <Empty />
                  ) : (
                    summary.marketing_consent.map((r) => (
                      <Row key={r.marketing_consent} label={r.marketing_consent} value={r.count} />
                    ))
                  )}
                </Panel>

                <Panel title="Suppressions">
                  {summary.suppressions.length === 0 ? (
                    <Empty />
                  ) : (
                    summary.suppressions.map((r) => (
                      <Row key={`${r.scope}:${r.reason}`} label={`${r.scope} / ${r.reason}`} value={r.count} />
                    ))
                  )}
                </Panel>

                <Panel title="Email deliveries">
                  {summary.email_deliveries.length === 0 ? (
                    <Empty />
                  ) : (
                    summary.email_deliveries.map((r) => (
                      <Row key={`${r.email_class}:${r.status}`} label={`${r.email_class} / ${r.status}`} value={r.count} />
                    ))
                  )}
                </Panel>
              </div>
            </>
          )
        )}

        <Card padding="none">
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Subscriptions</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 12.5 }}
            >
              <option value="">All statuses</option>
              {['free', 'active', 'past_due', 'grace_period', 'cancelled', 'expired', 'payment_failed', 'suspended', 'pending_activation'].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {rows.length === 0 ? (
            <div style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No subscriptions match.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Account', 'Plan', 'Status', 'Period ends', 'Source', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 500 }}>{r.email}</div>
                      <div style={{ color: 'var(--text-3)', fontSize: 11.5 }}>
                        {r.organisation_name ?? r.full_name}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {r.plan_id}
                      <div style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{r.catalog_version}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge variant={STATUS_TONE[r.status] ?? 'default'}>{r.status}</Badge>
                      {r.cancel_at_period_end && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>cancels at period end</div>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {r.plan_id === 'free' ? date(r.free_period_end) : date(r.current_period_end)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {r.grant_source ?? '—'}
                      {r.grant_source === 'operator' && (
                        <div style={{ fontSize: 11, color: 'var(--warning)' }}>manual grant</div>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const d = await api.get<Record<string, unknown>>(
                            `/api/v1/admin/lifecycle/subscriptions/${r.user_id}`,
                          )
                          setDetail(d)
                        }}
                      >
                        History
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {detail && (
        <Modal isOpen onClose={() => setDetail(null)} title="Lifecycle history">
          <pre style={{ fontSize: 11.5, whiteSpace: 'pre-wrap', color: 'var(--text-2)', maxHeight: 520, overflow: 'auto' }}>
            {JSON.stringify(detail, null, 2)}
          </pre>
        </Modal>
      )}
    </>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </Card>
  )
}

function Row({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
        <span style={{ color: 'var(--text-2)', textTransform: 'capitalize' }}>{label}</span>
        <strong style={{ color: 'var(--text-1)' }}>{value.toLocaleString()}</strong>
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{hint}</div>}
    </div>
  )
}

function Empty() {
  return <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No data available.</div>
}

export default LifecyclePage
