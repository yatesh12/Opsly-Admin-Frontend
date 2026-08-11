/**
 * Operator console for bulk email.
 *
 * The flow is deliberately not one screen with a Send button. It is:
 * draft → preview → test send to yourself → approve (which shows the real
 * recipient count) → scheduled dispatch. Each step is a separate action
 * because each one is a chance to notice that the audience is wrong, and the
 * cost of noticing afterwards is an email that cannot be recalled.
 *
 * Everything here is rendered from what the backend reports. There is no
 * computed open rate, no estimated delivery figure, and no zero standing in
 * for "we do not measure this" — an unsent campaign says "Not sent yet"
 * rather than showing a confident 0%.
 */

import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { Header } from '../components/layout/Header'
import { Mail, Send, Eye, Users, Ban, AlertTriangle } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  kind: string
  status: string
  subject: string
  estimated_recipients: number
  sent_count: number
  failed_count: number
  skipped_count: number
  scheduled_for: string | null
  started_at: string | null
  completed_at: string | null
  approved_by: string | null
  test_sent_at: string | null
  created_at: string
}

interface FilterSpec {
  key: string
  label: string
  kind: 'enum' | 'multi_enum' | 'int' | 'bool'
  description: string
  options: string[]
}

const KINDS = [
  'announcement',
  'product_update',
  'maintenance',
  'promotion',
  'educational',
  're_engagement',
  'plan_upgrade',
  'custom',
]

/** Which kinds bypass marketing consent. Mirrors the backend's fixed map. */
const OPERATIONAL_KINDS = new Set(['maintenance'])

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  draft: 'default',
  scheduled: 'warning',
  sending: 'warning',
  sent: 'success',
  cancelled: 'default',
  failed: 'danger',
}

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filters, setFilters] = useState<FilterSpec[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editor, setEditor] = useState<Campaign | null>(null)
  const [creating, setCreating] = useState(false)
  const [preview, setPreview] = useState<{ subject: string; html: string; email_class: string } | null>(null)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, filterSet] = await Promise.all([
        api.get<{ campaigns: Campaign[] }>('/api/v1/admin/campaigns'),
        api.get<{ filters: FilterSpec[] }>('/api/v1/admin/campaigns/filters'),
      ])
      setCampaigns(list.campaigns)
      setFilters(filterSet.filters)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <>
        <Header title="Email Campaigns" />
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spinner />
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Email Campaigns" />
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && (
          <Card>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--danger)' }}>
              <AlertTriangle size={16} />
              <span style={{ fontSize: 13 }}>{error}</span>
            </div>
          </Card>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, maxWidth: 620 }}>
            Campaigns are sent through the application backend, which applies
            consent and suppression on every recipient. Marketing kinds never
            reach anyone who has opted out; maintenance notices are classed as
            operational and do reach everyone.
          </p>
          <Button onClick={() => setCreating(true)}>
            <Mail size={15} /> New campaign
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <Card>
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No campaigns yet.
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Campaign', 'Kind', 'Status', 'Recipients', 'Sent', 'Skipped', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 14px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div style={{ color: 'var(--text-3)', fontSize: 12 }}>{c.subject || '(no subject)'}</div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {c.kind.replace(/_/g, ' ')}
                      {OPERATIONAL_KINDS.has(c.kind) && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>operational</div>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <Badge variant={STATUS_TONE[c.status] ?? 'default'}>{c.status}</Badge>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {c.approved_by ? c.estimated_recipients.toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {c.started_at ? c.sent_count.toLocaleString() : 'Not sent yet'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {c.started_at ? c.skipped_count.toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '11px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const p = await api.post<typeof preview>(`/api/v1/admin/campaigns/${c.id}/preview`, {})
                          setPreview(p)
                        }}
                      >
                        <Eye size={14} />
                      </Button>{' '}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const s = await api.get<Record<string, unknown>>(`/api/v1/admin/campaigns/${c.id}/stats`)
                          setStats(s)
                        }}
                      >
                        <Users size={14} />
                      </Button>{' '}
                      {(c.status === 'draft' || c.status === 'scheduled') && (
                        <Button size="sm" onClick={() => setEditor(c)}>
                          Open
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {(creating || editor) && (
        <CampaignEditor
          campaign={editor}
          filters={filters}
          onClose={() => {
            setCreating(false)
            setEditor(null)
            void load()
          }}
        />
      )}

      {preview && (
        <Modal isOpen onClose={() => setPreview(null)} title={`Preview — ${preview.subject}`}>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
            Class: <strong>{preview.email_class}</strong>
            {preview.email_class === 'marketing'
              ? ' — only sent to accounts that have not opted out.'
              : ' — sent regardless of marketing preference.'}
          </div>
          <iframe
            title="campaign preview"
            srcDoc={preview.html}
            sandbox=""
            style={{ width: '100%', height: 560, border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}
          />
        </Modal>
      )}

      {stats && (
        <Modal isOpen onClose={() => setStats(null)} title="Delivery">
          {!stats.dispatched ? (
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
              This campaign has not been dispatched, so there is nothing to report.
            </p>
          ) : (
            <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--text-2)' }}>
              {JSON.stringify(
                { ...stats, opens: undefined, clicks: undefined },
                null,
                2,
              )}
            </pre>
          )}
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>
            Open and click tracking is not implemented, so no engagement figures
            are shown. A zero here would mean “nobody opened it”, which is a
            different claim from “we do not measure this”.
          </p>
        </Modal>
      )}
    </>
  )
}

// ==========================================================================

function CampaignEditor({
  campaign,
  filters,
  onClose,
}: {
  campaign: Campaign | null
  filters: FilterSpec[]
  onClose: () => void
}) {
  const [name, setName] = useState(campaign?.name ?? '')
  const [kind, setKind] = useState(campaign?.kind ?? 'announcement')
  const [subject, setSubject] = useState(campaign?.subject ?? '')
  const [body, setBody] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaPath, setCtaPath] = useState('')
  const [audience, setAudience] = useState<Record<string, unknown>>({})
  const [estimate, setEstimate] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [id, setId] = useState(campaign?.id ?? null)
  const [testSent, setTestSent] = useState(Boolean(campaign?.test_sent_at))
  const [testUserId, setTestUserId] = useState('')
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    if (!campaign) return
    void api
      .get<Record<string, unknown>>(`/api/v1/admin/campaigns/${campaign.id}`)
      .then((full) => {
        setBody(String(full.body ?? ''))
        setCtaLabel(String(full.cta_label ?? ''))
        setCtaPath(String(full.cta_path ?? ''))
        setAudience((full.audience as Record<string, unknown>) ?? {})
      })
  }, [campaign])

  async function refreshEstimate(next: Record<string, unknown>) {
    try {
      const result = await api.post<{ estimated_recipients: number }>(
        '/api/v1/admin/campaigns/audience/estimate',
        next,
      )
      setEstimate(result.estimated_recipients)
      setMessage(null)
    } catch (err) {
      setEstimate(null)
      setMessage((err as Error).message)
    }
  }

  function setFilter(key: string, value: unknown) {
    const next = { ...audience }
    if (value === '' || value === null || (Array.isArray(value) && !value.length)) {
      delete next[key]
    } else {
      next[key] = value
    }
    setAudience(next)
    void refreshEstimate(next)
  }

  const payload = {
    name,
    kind,
    subject,
    body,
    cta_label: ctaLabel || null,
    cta_path: ctaPath || null,
    audience,
  }

  async function save() {
    setBusy(true)
    setMessage(null)
    try {
      if (id) {
        await api.put(`/api/v1/admin/campaigns/${id}`, payload)
        // Editing resets approval and the test send on the server; reflect it
        // here so the UI cannot claim a stale test still counts.
        setTestSent(false)
        setMessage('Saved. The previous test send no longer counts — send a new one.')
      } else {
        const created = await api.post<{ id: string }>('/api/v1/admin/campaigns', payload)
        setId(created.id)
        setMessage('Draft created.')
      }
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function sendTest() {
    if (!id) return
    setBusy(true)
    try {
      await api.post(`/api/v1/admin/campaigns/${id}/test-send`, {
        to_user_id: testUserId,
        to_email: testEmail,
      })
      setTestSent(true)
      setMessage('Test sent. Check it before approving.')
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function approve() {
    if (!id) return
    setBusy(true)
    try {
      const result = await api.post<{ estimated_recipients: number; scheduled_for: string }>(
        `/api/v1/admin/campaigns/${id}/approve`,
        {},
      )
      setMessage(
        `Approved for ${result.estimated_recipients.toLocaleString()} recipients. ` +
          `Dispatch begins ${new Date(result.scheduled_for).toLocaleString()}.`,
      )
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={id ? 'Edit campaign' : 'New campaign'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />

        <div>
          <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Kind</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            style={{ width: '100%', padding: 9, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 13 }}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 5 }}>
            {OPERATIONAL_KINDS.has(kind)
              ? 'Operational: reaches everyone, including accounts that opted out of marketing.'
              : 'Marketing: skipped for anyone who has opted out or been suppressed.'}
          </p>
        </div>

        <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />

        <div>
          <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 5 }}>Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            style={{ width: '100%', padding: 10, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-1)', color: 'var(--text-1)', fontSize: 13, fontFamily: 'inherit' }}
          />
          <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 5 }}>
            Plain paragraphs, separated by blank lines. HTML is escaped rather
            than rendered, so nothing you type can become markup in a
            customer’s inbox.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="Button label (optional)" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
          <Input
            label="Button path (relative, e.g. /pricing)"
            value={ctaPath}
            onChange={(e) => setCtaPath(e.target.value)}
          />
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Audience</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {filters.map((f) => (
              <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 10, alignItems: 'center' }}>
                <label style={{ fontSize: 12.5, color: 'var(--text-2)' }} title={f.description}>
                  {f.label}
                </label>
                {f.kind === 'bool' ? (
                  <select
                    value={audience[f.key] === undefined ? '' : String(audience[f.key])}
                    onChange={(e) => setFilter(f.key, e.target.value === '' ? '' : e.target.value === 'true')}
                    style={selectStyle}
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : f.kind === 'int' ? (
                  <input
                    type="number"
                    min={1}
                    value={(audience[f.key] as number) ?? ''}
                    onChange={(e) => setFilter(f.key, e.target.value === '' ? '' : Number(e.target.value))}
                    style={selectStyle}
                  />
                ) : (
                  <select
                    multiple={f.options.length > 0}
                    value={(audience[f.key] as string[]) ?? []}
                    onChange={(e) =>
                      setFilter(
                        f.key,
                        Array.from(e.target.selectedOptions).map((o) => o.value),
                      )
                    }
                    style={{ ...selectStyle, minHeight: f.options.length ? 68 : undefined }}
                  >
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 13 }}>
            {estimate === null ? (
              <span style={{ color: 'var(--text-3)' }}>Choose filters to see the recipient count.</span>
            ) : (
              <span style={{ color: estimate === 0 ? 'var(--danger)' : 'var(--text-1)' }}>
                <strong>{estimate.toLocaleString()}</strong> matching account
                {estimate === 1 ? '' : 's'}
                {estimate === 0 && ' — a campaign matching nobody cannot be approved.'}
              </span>
            )}
          </div>
        </div>

        {id && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Test send</div>
            <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 8 }}>
              Goes to an existing Opsly account, addressed from that account’s
              own email. Required before approval — a campaign nobody has seen
              rendered is a campaign nobody has checked.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
              <Input label="User id" value={testUserId} onChange={(e) => setTestUserId(e.target.value)} />
              <Input label="Account email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
              <Button variant="secondary" disabled={busy || !testUserId} onClick={sendTest}>
                <Send size={14} /> Send test
              </Button>
            </div>
          </div>
        )}

        {message && (
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', background: 'var(--bg-2)', padding: '9px 11px', borderRadius: 7 }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={save} disabled={busy || !name.trim()}>
            {id ? 'Save' : 'Create draft'}
          </Button>
          <Button
            onClick={approve}
            disabled={busy || !id || !testSent || !estimate}
            title={
              !testSent
                ? 'Send a test to yourself first'
                : !estimate
                  ? 'This audience matches nobody'
                  : 'Approve and schedule'
            }
          >
            <Ban size={14} style={{ display: 'none' }} />
            Approve &amp; schedule
          </Button>
        </div>
      </div>
    </Modal>
  )
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: 8,
  borderRadius: 7,
  border: '1px solid var(--border)',
  background: 'var(--bg-1)',
  color: 'var(--text-1)',
  fontSize: 12.5,
}

export default CampaignsPage
