import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { Header } from '../components/layout/Header'

/**
 * Platform observability.
 *
 * These figures span every organisation, which is why they live in the admin
 * console. The equivalent customer-facing page computed the same unscoped
 * totals but was reachable by any authenticated tenant.
 */

interface Overview {
  period_days: number
  organisations: number
  events: { total: number; errors: number }
  dead_letter_pending: number
  webhooks: { deliveries: number; failures: number }
  plugins: { enabled: number; unhealthy: number }
}

interface TimelineEntry {
  event_type: string
  count: number
}

interface ErrorsResponse {
  event_errors: Array<{
    id: string
    event_type: string
    source: string | null
    organisation_id: string | null
    created_at: string | null
  }>
  dead_letter: Array<{
    id: string
    event_type: string
    error_message: string | null
    retry_count: number
    max_retries: number
    status: string
    created_at: string | null
  }>
}

const PERIODS = [
  { value: 1, label: 'Last 24h' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
]

function Stat({ label, value, sub, danger }: { label: string; value: number; sub?: string; danger?: boolean }) {
  return (
    <Card padding="14px">
      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700, color: danger ? '#ef4444' : undefined }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: danger ? '#ef4444' : 'var(--text-muted)' }}>{sub}</p>}
    </Card>
  )
}

export function ObservabilityPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [errors, setErrors] = useState<ErrorsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [days, setDays] = useState(7)

  useEffect(() => {
    setLoading(true)
    setFailed(false)
    Promise.all([
      api.get<Overview>(`/api/v1/admin/observability/overview?days=${days}`),
      api.get<TimelineEntry[]>(`/api/v1/admin/observability/events/timeline?days=${days}`),
      api.get<ErrorsResponse>('/api/v1/admin/observability/errors?limit=20'),
    ])
      .then(([o, t, e]) => { setOverview(o); setTimeline(t); setErrors(e) })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [days])

  const busiest = timeline[0]?.count || 1

  return (
    <div>
      <Header title="Observability" subtitle="Platform-wide events, failures and delivery health" />

      <div style={{ marginBottom: 20 }}>
        <label htmlFor="obs-period" style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>Period</label>
        <select
          id="obs-period"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
        >
          {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
      ) : failed || !overview ? (
        <Card><p style={{ color: '#ef4444', fontSize: 13 }}>Could not load observability data.</p></Card>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
            <Stat label="Organisations" value={overview.organisations} />
            <Stat label="Events" value={overview.events.total} sub={overview.events.errors > 0 ? `${overview.events.errors} errors` : undefined} danger={overview.events.errors > 0} />
            <Stat label="Dead Letter Queue" value={overview.dead_letter_pending} danger={overview.dead_letter_pending > 0} />
            <Stat label="Webhook Deliveries" value={overview.webhooks.deliveries} sub={overview.webhooks.failures > 0 ? `${overview.webhooks.failures} failed` : undefined} danger={overview.webhooks.failures > 0} />
            <Stat label="Plugins Enabled" value={overview.plugins.enabled} sub={overview.plugins.unhealthy > 0 ? `${overview.plugins.unhealthy} degraded` : 'All healthy'} danger={overview.plugins.unhealthy > 0} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            <Card>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Event volume by type
              </p>
              {timeline.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No events in this period.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {timeline.slice(0, 15).map(t => (
                    <div key={t.event_type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 180 }}>{t.event_type}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: 'var(--brand)', width: `${Math.min((t.count / busiest) * 100, 100)}%` }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 40, textAlign: 'right' }}>{t.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Recent failures
              </p>
              {errors && (errors.event_errors.length > 0 || errors.dead_letter.length > 0) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {errors.event_errors.slice(0, 6).map(e => (
                    <div key={e.id} style={{ fontSize: 12, color: '#ef4444', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 500 }}>{e.event_type}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {' '}— {e.created_at ? new Date(e.created_at).toLocaleString() : 'unknown time'}
                      </span>
                    </div>
                  ))}
                  {errors.dead_letter.slice(0, 6).map(d => (
                    <div key={d.id} style={{ fontSize: 12, color: '#f59e0b', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 500 }}>{d.event_type}</span>
                      <span style={{ color: 'var(--text-muted)' }}> — {d.error_message || 'no message'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No failures in this period.</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
