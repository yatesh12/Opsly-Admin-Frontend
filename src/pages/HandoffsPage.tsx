import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'

interface HandoffItem {
  id: string
  conversation_id: string
  agent_name: string | null
  org_name: string | null
  status: string
  assigned_to_name: string | null
  reason: string | null
  resolution: string | null
  created_at: string | null
  updated_at: string | null
  resolved_at: string | null
}

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'default' | 'danger'> = {
  pending: 'warning',
  accepted: 'success',
  resolved: 'default',
  rejected: 'danger',
}

export function HandoffsPage() {
  const [handoffs, setHandoffs] = useState<HandoffItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [resolveTarget, setResolveTarget] = useState<HandoffItem | null>(null)
  const [resolution, setResolution] = useState('')
  const [resolving, setResolving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100', offset: '0' })
      if (statusFilter) params.set('status', statusFilter)
      const res = await api.get<{ items: HandoffItem[]; total: number }>(`/api/v1/admin/handoffs?${params}`)
      setHandoffs(res.items)
      setTotal(res.total)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter])

  const handleResolve = async () => {
    if (!resolveTarget) return
    setResolving(true)
    try {
      await api.post(`/api/v1/admin/handoffs/${resolveTarget.id}/resolve`, { resolution })
      setResolveTarget(null)
      setResolution('')
      load()
    } catch {} finally {
      setResolving(false)
    }
  }

  const filters = [
    { id: undefined, label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'resolved', label: 'Resolved' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Chat Handoffs</h2>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
          Visitor requests for human assistance — {total} total
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {filters.map(f => (
          <button
            key={f.id || 'all'}
            onClick={() => setStatusFilter(f.id)}
            style={{
              padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
              border: statusFilter === f.id ? '1px solid var(--brand)' : '1px solid var(--border)',
              background: statusFilter === f.id ? 'var(--brand)' : 'var(--bg-surface)',
              color: statusFilter === f.id ? '#fff' : 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading...</div>
      ) : handoffs.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          No handoffs found.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {handoffs.map(h => (
            <Card key={h.id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Badge variant={STATUS_COLORS[h.status] || 'default'}>{h.status}</Badge>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {h.created_at ? new Date(h.created_at).toLocaleString() : '—'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>Org:</strong> {h.org_name || '—'} · <strong>Agent:</strong> {h.agent_name || '—'}
                  </div>
                  {h.reason && (
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                      <strong>Reason:</strong> {h.reason}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Conversation: {h.conversation_id.substring(0, 12)}...
                    {h.assigned_to_name && <> · Assigned: {h.assigned_to_name}</>}
                  </div>
                  {h.resolution && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      <strong>Resolution:</strong> {h.resolution}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                  {h.status === 'accepted' && (
                    <Button size="sm" variant="secondary" onClick={() => setResolveTarget(h)}>Resolve</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!resolveTarget} onClose={() => setResolveTarget(null)} title="Resolve Handoff">
        <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-muted)' }}>
          Provide a resolution summary for this handoff.
        </div>
        <Input
          label="Resolution notes"
          value={resolution}
          onChange={e => setResolution(e.target.value)}
          placeholder="Describe how this request was handled..."
        />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <Button variant="secondary" onClick={() => setResolveTarget(null)}>Cancel</Button>
          <Button variant="primary" loading={resolving} disabled={!resolution.trim()} onClick={handleResolve}>
            Resolve
          </Button>
        </div>
      </Modal>
    </div>
  )
}
