import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Header } from '../components/layout/Header'
import { Plus, Edit3, Trash2, IndianRupee, Users, HardDrive, Radio, Globe, Check, X } from 'lucide-react'
import type { PaginatedPlans, PlanSummary } from '../types'

function fmt(pricePaise: number, currency = 'INR') {
  const inr = Math.round(pricePaise / 100)
  if (currency === 'INR') return `₹${inr.toLocaleString('en-IN')}`
  return `${currency} ${inr.toFixed(0)}`
}

function fmtStorage(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`
  return `${mb} MB`
}

function fmtAgent(n: number): string {
  if (n === -1) return 'Unlimited'
  if (n === 1) return '1 agent'
  return `${n} agents`
}

function fmtLimit(n: number): string {
  if (n === -1) return 'Unlimited'
  return n.toLocaleString('en-IN')
}

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

function FeatureBadge({ label, value }: { label: string; value: any }) {
  const strVal = String(value)
  const isBool = typeof value === 'boolean'
  const isGood = value === true || value === 'true'
  const isBad = value === false || value === 'false'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 6, fontSize: 12,
      background: isBool ? (isGood ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.06)') : 'var(--bg-elevated)',
      border: `1px solid ${
        isBool ? (isGood ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)')
        : 'var(--border)'
      }`,
      color: isBool ? (isGood ? '#22c55e' : isBad ? '#ef4444' : 'var(--text-secondary)') : 'var(--text-secondary)',
    }}>
      {isBool ? (isGood ? <Check size={11} /> : <X size={11} />) : null}
      {label.replace(/_/g, ' ')}{!isBool ? `: ${strVal}` : ''}
    </span>
  )
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

  const sectionStyle: React.CSSProperties = {
    padding: '14px 18px', borderBottom: '1px solid var(--border)',
  }
  const lastSectionStyle: React.CSSProperties = {
    ...sectionStyle, borderBottom: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em',
  }
  const valueStyle: React.CSSProperties = {
    fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2,
  }
  const gridCellStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8,
  }
  const gridValueStyle: React.CSSProperties = {
    fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
  }
  const gridLabelStyle: React.CSSProperties = {
    fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 1,
  }

  return (
    <div>
      <Header title="Plans" subtitle="Manage subscription plans" />
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={openCreate} icon={<Plus size={14} />}>Create Plan</Button>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
        <div style={{ display: 'grid', gap: 16 }}>
          {data?.plans.map(plan => {
            const f = plan.features
            const isHighlighted = f?.highlighted === true || f?.highlighted === 'true'
            return (
              <Card key={plan.id} padding="0" style={{
                border: isHighlighted ? '1px solid var(--brand)' : undefined,
                boxShadow: isHighlighted ? '0 0 0 1px rgba(92,107,192,0.08), 0 4px 12px rgba(0,0,0,0.06)' : undefined,
              }}>
                {/* ── Header ── */}
                <div style={{ ...sectionStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{plan.display_name}</h3>
                    <Badge variant={plan.is_active ? 'success' : 'danger'}>{plan.is_active ? 'Active' : 'Inactive'}</Badge>
                    {isHighlighted && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                        padding: '2px 8px', borderRadius: 4,
                        background: 'rgba(92,107,192,0.1)', color: 'var(--brand)',
                      }}>
                        Popular
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{plan.sort_order}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(plan)}><Edit3 size={14} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePlan(plan.id)} style={{ color: '#ef4444' }}><Trash2 size={14} /></Button>
                  </div>
                </div>

                {/* ── Description ── */}
                {plan.description && (
                  <div style={{ ...sectionStyle, padding: '6px 18px' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{plan.description}</p>
                  </div>
                )}

                {/* ── Key Metrics Grid ── */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 0,
                }}>
                  <div style={{ padding: '16px 18px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                    <div style={gridCellStyle}>
                      <IndianRupee size={16} style={{ color: 'var(--brand)' }} />
                      <div>
                        <div style={gridValueStyle}>{fmt(plan.price_paise, plan.currency)}</div>
                        <div style={gridLabelStyle}>Monthly</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 18px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                    <div style={gridCellStyle}>
                      <Users size={16} style={{ color: '#3b82f6' }} />
                      <div>
                        <div style={gridValueStyle}>{fmtAgent(plan.agent_limit)}</div>
                        <div style={gridLabelStyle}>Agents</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                    <div style={gridCellStyle}>
                      <HardDrive size={16} style={{ color: '#f59e0b' }} />
                      <div>
                        <div style={gridValueStyle}>{fmtStorage(plan.storage_mb)}</div>
                        <div style={gridLabelStyle}>Storage</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 18px', borderRight: '1px solid var(--border)' }}>
                    <div style={gridCellStyle}>
                      <Radio size={16} style={{ color: '#22c55e' }} />
                      <div>
                        <div style={gridValueStyle}>{fmtLimit(plan.api_calls_limit)}</div>
                        <div style={gridLabelStyle}>API calls/mo</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 18px' }}>
                    <div style={gridCellStyle}>
                      <Globe size={16} style={{ color: 'var(--text-muted)' }} />
                      <div>
                        <div style={gridValueStyle}>{plan.currency}</div>
                        <div style={gridLabelStyle}>Currency</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Features ── */}
                {f && Object.keys(f).length > 0 && (
                  <div style={lastSectionStyle}>
                    <div style={{ ...labelStyle, marginBottom: 8 }}>Features</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {Object.entries(f).map(([k, v]) => {
                        if (k === 'build_features' || k === 'maintenance_features') return null
                        return <FeatureBadge key={k} label={k} value={v} />
                      })}
                    </div>
                  </div>
                )}

                {/* ── Feature lists ── */}
                {(f?.build_features || f?.maintenance_features) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                    {f?.build_features && (
                      <div style={{ padding: '14px 18px', borderRight: '1px solid var(--border)' }}>
                        <div style={{ ...labelStyle, marginBottom: 6 }}>Build Features</div>
                        <ul style={{ margin: 0, paddingLeft: 14, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                          {(f.build_features as string[]).map((feat, i) => <li key={i}>{feat}</li>)}
                        </ul>
                      </div>
                    )}
                    {f?.maintenance_features && (
                      <div style={{ padding: '14px 18px' }}>
                        <div style={{ ...labelStyle, marginBottom: 6 }}>Maintenance Features</div>
                        <ul style={{ margin: 0, paddingLeft: 14, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                          {(f.maintenance_features as string[]).map((feat, i) => <li key={i}>{feat}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
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
            <Input label="Price (paise)" type="number" value={String(form.price_paise)}
              onChange={(e) => setForm({ ...form, price_paise: Math.round(Number(e.target.value)) })} />
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
