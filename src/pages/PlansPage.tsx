import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Header } from '../components/layout/Header'
import { Plus, Edit3, Trash2 } from 'lucide-react'
import type { PaginatedPlans, PlanSummary } from '../types'

function fmt(paise: number, currency = 'INR') {
  if (currency === 'INR') return `₹${(paise / 100).toLocaleString('en-IN')}`
  return `${currency} ${(paise / 100).toFixed(2)}`
}

function toRupees(paise: number) { return paise / 100 }
function toPaise(rupees: number) { return Math.round(rupees * 100) }

function formatFeatures(features: Record<string, any> | null): string {
  if (!features) return ''
  return Object.entries(features)
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
    .join('\n')
}

function parseFeatures(text: string): Record<string, any> {
  if (!text.trim()) return {}
  const lines = text.trim().split('\n')
  const result: Record<string, any> = {}
  for (const line of lines) {
    const sep = line.includes(':') ? ':' : '='
    const idx = line.indexOf(sep)
    if (idx > 0) {
      const key = line.substring(0, idx).trim().toLowerCase().replace(/\s+/g, '_')
      const val = line.substring(idx + 1).trim()
      result[key] = isNaN(Number(val)) ? val : Number(val)
    }
  }
  return result
}

export function PlansPage() {
  const [data, setData] = useState<PaginatedPlans | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<PlanSummary | null>(null)
  const [form, setForm] = useState({
    name: '',
    display_name: '',
    description: '',
    price_paise: 0,
    currency: 'INR',
    agent_limit: 1,
    storage_mb: 100,
    api_calls_limit: 1000,
    features_text: '',
    is_active: true,
    sort_order: 0,
  })
  const [saving, setSaving] = useState(false)

  const fetchData = () => {
    setLoading(true)
    api.get<PaginatedPlans>('/api/v1/admin/plans')
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '',
      display_name: '',
      description: '',
      price_paise: 0,
      currency: 'INR',
      agent_limit: 1,
      storage_mb: 100,
      api_calls_limit: 1000,
      features_text: '',
      is_active: true,
      sort_order: 0,
    })
    setShowModal(true)
  }

  const openEdit = (plan: PlanSummary) => {
    setEditing(plan)
    setForm({
      name: plan.name,
      display_name: plan.display_name,
      description: plan.description || '',
      price_paise: plan.price_paise,
      currency: plan.currency,
      agent_limit: plan.agent_limit,
      storage_mb: plan.storage_mb,
      api_calls_limit: plan.api_calls_limit,
      features_text: formatFeatures(plan.features),
      is_active: plan.is_active,
      sort_order: plan.sort_order,
    })
    setShowModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const body = {
        ...form,
        description: form.description || null,
        features: parseFeatures(form.features_text),
      }
      if (editing) {
        await api.patch(`/api/v1/admin/plans/${editing.id}`, body)
      } else {
        await api.post('/api/v1/admin/plans', body)
      }
      setShowModal(false)
      fetchData()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const deletePlan = async (planId: string) => {
    if (!confirm('Delete this plan?')) return
    try { await api.delete(`/api/v1/admin/plans/${planId}`); fetchData() }
    catch (err) { console.error(err) }
  }

  return (
    <div>
      <Header title="Plans" subtitle="Manage subscription plans" />
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={openCreate} icon={<Plus size={14} />}>Create Plan</Button>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
        <div style={{ display: 'grid', gap: 16 }}>
          {data?.plans.map(plan => (
            <Card key={plan.id} padding="16px">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{plan.display_name}</h3>
                    <Badge variant={plan.is_active ? 'success' : 'danger'}>{plan.is_active ? 'Active' : 'Inactive'}</Badge>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{plan.sort_order}</span>
                  </div>
                  {plan.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{plan.description}</p>}
                  <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 13, flexWrap: 'wrap' }}>
                    <span><strong>{fmt(plan.price_paise, plan.currency)}</strong></span>
                    <span>🤖 {plan.agent_limit} agents</span>
                    <span>💾 {plan.storage_mb} MB</span>
                    <span>🔌 {plan.api_calls_limit.toLocaleString()} API calls</span>
                    <span style={{ color: 'var(--text-muted)' }}>{plan.currency}</span>
                  </div>
                  {plan.features && Object.keys(plan.features).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {Object.entries(plan.features).map(([k, v]) => (
                        <Badge key={k} variant="default">
                          {k.replace(/_/g, ' ')}: {String(v)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(plan)}><Edit3 size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deletePlan(plan.id)} style={{ color: '#ef4444' }}><Trash2 size={14} /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Plan' : 'Create Plan'} width={600}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Plan Name (slug)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. starter" disabled={!!editing} />
          <Input label="Display Name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="e.g. Starter" />
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', minHeight: 60, resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Price (₹)" type="number" value={String(toRupees(form.price_paise))}
              onChange={(e) => setForm({ ...form, price_paise: toPaise(Number(e.target.value)) })} />
            <Input label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="INR" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input label="Agent Limit" type="number" value={String(form.agent_limit)} onChange={(e) => setForm({ ...form, agent_limit: Number(e.target.value) })} />
            <Input label="Storage (MB)" type="number" value={String(form.storage_mb)} onChange={(e) => setForm({ ...form, storage_mb: Number(e.target.value) })} />
            <Input label="API Calls Limit" type="number" value={String(form.api_calls_limit)} onChange={(e) => setForm({ ...form, api_calls_limit: Number(e.target.value) })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Sort Order" type="number" value={String(form.sort_order)} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Features (one per line, format: key: value)</label>
            <textarea value={form.features_text} onChange={(e) => setForm({ ...form, features_text: e.target.value })}
              placeholder={`e.g. priority_support: true\ncustom_branding: false\napi_access: true\nteam_seats: 5`}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', minHeight: 80, resize: 'vertical' }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Plan' : 'Create Plan'}</Button>
        </div>
      </Modal>
    </div>
  )
}
