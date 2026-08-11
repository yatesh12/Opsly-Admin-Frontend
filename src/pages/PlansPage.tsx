import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Header } from '../components/layout/Header'
import { IndianRupee, Users, HardDrive, Radio, Globe, Check, X } from 'lucide-react'
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

  const fetchData = () => {
    setLoading(true)
    api.get<PaginatedPlans>('/api/v1/admin/plans')
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  // openCreate / openEdit / save / deletePlan were REMOVED in Phase 2 along
  // with the admin write endpoints they called. Leaving them here would keep
  // a one-line path back to editing live commercial terms.

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
      <Header title="Plans" subtitle="Legacy plans table — read-only" />
      {/* Create/Edit/Delete removed in Phase 2. This page wrote directly to the
          `plans` table with no versioning, no audit and no effective date --
          and that table was read by order creation and the storage/file-size
          checks, so an edit here changed what a live subscriber was charged.
          The commercial contract is now declared in code, immutable once
          published, and each subscription pins the version governing it. */}
      <Card padding="16" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          This table is no longer the commercial source of truth
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Prices, limits and feature entitlements come from the versioned
          commercial catalog in the application backend. This view shows the
          legacy <code>plans</code> table, which is stale (no rows for
          Professional or Business; still lists retired Builder and Pro) and is
          scheduled for removal. Changing a price is a reviewed code change that
          publishes a new catalog version — existing subscribers stay pinned to
          the version they bought.
        </div>
      </Card>

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
                  {/* Edit/Delete removed -- see the notice above. */}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>read-only</span>
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
                        if (k === 'build_features' || k === 'maintenance_features' || k === 'features') return null
                        return <FeatureBadge key={k} label={k} value={v} />
                      })}
                    </div>
                  </div>
                )}

                {/* ── Feature list ── */}
                {f?.features && Array.isArray(f.features) && (
                  <div style={{ padding: '14px 18px' }}>
                    <div style={{ ...labelStyle, marginBottom: 6 }}>Features</div>
                    <ul style={{ margin: 0, paddingLeft: 14, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                      {(f.features as string[]).map((feat, i) => <li key={i}>{feat}</li>)}
                    </ul>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}


    </div>
  )
}
