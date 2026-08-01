import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Header } from '../components/layout/Header'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Event bus inspection.
 *
 * READ-ONLY by design. Retry and replay remain in the customer backend because
 * both dispatch through its in-process event bus; a separate service can write
 * rows but cannot invoke the handlers, so a retry button here would appear to
 * work while doing nothing. See admin-backend/app/api/v1/events.py.
 */

type Tab = 'events' | 'dead-letters'

interface EventRow {
  id: string
  event_type: string
  source: string | null
  organisation_id: string | null
  agent_id: string | null
  correlation_id: string | null
  severity: string | null
  created_at: string | null
}

interface DeadLetterRow {
  id: string
  original_event_id: string | null
  event_type: string
  error_message: string | null
  retry_count: number
  max_retries: number
  status: string
  created_at: string | null
}

interface Paginated<T> {
  total: number
  page: number
  per_page: number
  items: T[]
}

export function EventBusPage() {
  const [tab, setTab] = useState<Tab>('events')
  const [events, setEvents] = useState<Paginated<EventRow> | null>(null)
  const [deadLetters, setDeadLetters] = useState<Paginated<DeadLetterRow> | null>(null)
  const [eventTypes, setEventTypes] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api.get<{ event_types: string[] }>('/api/v1/admin/events/types')
      .then(r => setEventTypes(r.event_types))
      .catch(() => setEventTypes([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    setFailed(false)
    const params = new URLSearchParams({ page: String(page), per_page: '50' })
    if (typeFilter && tab === 'events') params.set('event_type', typeFilter)

    const request = tab === 'events'
      ? api.get<Paginated<EventRow>>(`/api/v1/admin/events?${params}`).then(setEvents)
      : api.get<Paginated<DeadLetterRow>>(`/api/v1/admin/events/dead-letters?${params}`).then(setDeadLetters)

    request.catch(() => setFailed(true)).finally(() => setLoading(false))
  }, [tab, typeFilter, page])

  const current = tab === 'events' ? events : deadLetters
  const totalPages = current ? Math.max(1, Math.ceil(current.total / current.per_page)) : 1

  return (
    <div>
      <Header title="Event Bus" subtitle="Platform event log and dead-letter queue" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([['events', 'Events'], ['dead-letters', 'Dead Letters']] as const).map(([id, label]) => (
          <Button
            key={id}
            variant={tab === id ? 'primary' : 'secondary'}
            onClick={() => { setTab(id); setPage(1) }}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card>
        {tab === 'events' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <label htmlFor="event-type-filter" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Type</label>
            <select
              id="event-type-filter"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
              style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', minWidth: 220 }}
            >
              <option value="">All types</option>
              {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
        ) : failed ? (
          <p style={{ color: '#ef4444', fontSize: 13 }}>Could not load the event log.</p>
        ) : !current || current.items.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {tab === 'events' ? 'No events match this filter.' : 'No dead letters. Every handler has succeeded.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tab === 'events'
              ? (current as Paginated<EventRow>).items.map(e => (
                  <div key={e.id} style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, minWidth: 200 }}>{e.event_type}</span>
                    {e.source && <Badge variant="info">{e.source}</Badge>}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {e.organisation_id ? `org ${e.organisation_id.slice(0, 8)}` : 'no org'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {e.created_at ? new Date(e.created_at).toLocaleString() : ''}
                    </span>
                  </div>
                ))
              : (current as Paginated<DeadLetterRow>).items.map(d => (
                  <div key={d.id} style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{d.event_type}</span>
                      <Badge variant={d.status === 'pending' ? 'warning' : 'danger'}>{d.status}</Badge>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        retry {d.retry_count}/{d.max_retries}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {d.created_at ? new Date(d.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                    {d.error_message && (
                      <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{d.error_message}</div>
                    )}
                  </div>
                ))}
          </div>
        )}

        {current && current.total > current.per_page && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 16 }}>
            <Button variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={16} />
            </Button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
            <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </Card>

      {tab === 'dead-letters' && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
          Retry and replay run in the customer backend, which owns the in-process
          event bus these handlers are registered on.
        </p>
      )}
    </div>
  )
}
