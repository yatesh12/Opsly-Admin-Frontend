import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { Header } from '../components/layout/Header'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import type { AnalyticsOverview, UsageAnalytics, RevenueAnalytics, UserEngagement, PlanMigration, InactivityPatterns, UsagePatterns, CohortRetention } from '../types'

const CHART_COLORS = ['#43009a', '#7a1aff', '#b380ff', '#944dff', '#d1b3ff', '#22c55e', '#f59e0b', '#ef4444']

function fmt(paise: number) { return `₹${(paise / 100).toLocaleString('en-IN')}` }

type Tab = 'overview' | 'revenue' | 'engagement' | 'plans' | 'inactivity' | 'usage' | 'cohorts'

export function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [period, setPeriod] = useState(30)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Analytics</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Platform metrics and insights</p>
        </div>
        <select value={period} onChange={(e) => setPeriod(Number(e.target.value))}
          style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['overview', 'revenue', 'engagement', 'plans', 'inactivity', 'usage', 'cohorts'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: tab === t ? 'var(--brand)' : 'var(--bg-elevated)',
              color: tab === t ? '#fff' : 'var(--text-primary)', fontSize: 13,
              cursor: 'pointer', fontWeight: tab === t ? 600 : 400, fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}>
            {t === 'overview' ? 'Overview' : t === 'revenue' ? 'Revenue' : t === 'engagement' ? 'Engagement' : t === 'plans' ? 'Plan Migration' : t === 'inactivity' ? 'Inactivity' : t === 'usage' ? 'Usage' : 'Cohorts'}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab period={period} />}
      {tab === 'revenue' && <RevenueTab period={period} />}
      {tab === 'engagement' && <EngagementTab period={period} />}
      {tab === 'plans' && <PlanMigrationTab period={period} />}
      {tab === 'inactivity' && <InactivityTab period={period} />}
      {tab === 'usage' && <UsagePatternsTab period={period} />}
      {tab === 'cohorts' && <CohortTab />}
    </div>
  )
}

function OverviewTab({ period }: { period: number }) {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [usage, setUsage] = useState<UsageAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get<AnalyticsOverview>(`/api/v1/admin/analytics/overview?days=${period}`),
      api.get<UsageAnalytics>(`/api/v1/admin/analytics/usage?days=${period}`),
    ]).then(([o, u]) => { setOverview(o); setUsage(u) }).catch(console.error).finally(() => setLoading(false))
  }, [period])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
  if (!overview) return null

  const summaryCards = [
    { label: 'Total Users', value: overview.total_users, change: overview.new_users, color: '#3b82f6' },
    { label: 'Total Agents', value: overview.total_agents, change: overview.new_agents, color: '#8b5cf6' },
    { label: 'Conversations', value: overview.total_conversations, color: '#22c55e' },
    { label: 'Messages', value: overview.total_messages, color: '#ec4899' },
    { label: 'Total Revenue', value: fmt(overview.total_revenue_paise), color: '#f59e0b' },
    { label: `Revenue (${period}d)`, value: fmt(overview.revenue_paise), color: '#10b981' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {summaryCards.map((card, i) => (
          <Card key={i} padding="14px">
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{card.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700 }}>{card.value}</p>
            {'change' in card && card.change !== undefined && <p style={{ fontSize: 11, color: '#22c55e' }}>+{card.change} new</p>}
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card title="Conversation Volume">
          {usage && usage.daily_usage.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usage.daily_usage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="conversations" fill="#43009a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No data</p>}
        </Card>
        <Card title="Token Usage">
          {usage && usage.daily_usage.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usage.daily_usage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="tokens" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No data</p>}
        </Card>
      </div>

      <Card title="Plan Distribution">
        <div style={{ display: 'flex', gap: 32, padding: '8px 0' }}>
          {Object.entries(overview.plan_distribution).map(([plan, count]) => (
            <div key={plan} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand)' }}>{count}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{plan}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function RevenueTab({ period }: { period: number }) {
  const [data, setData] = useState<RevenueAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    api.get<RevenueAnalytics>(`/api/v1/admin/analytics/revenue?days=${period}`)
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [period])
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
  if (!data) return null

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>MRR</p><p style={{ fontSize: 24, fontWeight: 700 }}>{fmt(data.mrr_paise)}</p></Card>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>ARR</p><p style={{ fontSize: 24, fontWeight: 700 }}>{fmt(data.arr_paise)}</p></Card>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>ARPU</p><p style={{ fontSize: 24, fontWeight: 700 }}>{fmt(Math.round(data.arpu_paise))}</p></Card>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Churn Rate</p><p style={{ fontSize: 24, fontWeight: 700, color: data.churn_rate_percent > 5 ? '#ef4444' : '#22c55e' }}>{data.churn_rate_percent}%</p></Card>
      </div>
      <Card title="Revenue by Plan">
        <div style={{ display: 'flex', gap: 24, padding: '8px 0' }}>
          {Object.entries(data.revenue_by_plan).map(([plan, amt], i) => (
            <div key={plan} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: CHART_COLORS[i % CHART_COLORS.length] }}>{fmt(amt)}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{plan}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function EngagementTab({ period }: { period: number }) {
  const [data, setData] = useState<UserEngagement | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    api.get<UserEngagement>(`/api/v1/admin/analytics/engagement?days=${period}`)
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [period])
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
  if (!data) return null

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>DAU</p><p style={{ fontSize: 24, fontWeight: 700 }}>{data.dau}</p></Card>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>WAU</p><p style={{ fontSize: 24, fontWeight: 700 }}>{data.wau}</p></Card>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>MAU</p><p style={{ fontSize: 24, fontWeight: 700 }}>{data.mau}</p></Card>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stickiness</p><p style={{ fontSize: 24, fontWeight: 700, color: data.stickiness_percent > 20 ? '#22c55e' : '#f59e0b' }}>{data.stickiness_percent}%</p></Card>
      </div>
      {data.daily_active.length > 0 && (
        <Card title="Daily Active Users">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.daily_active}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}

function PlanMigrationTab({ period }: { period: number }) {
  const [data, setData] = useState<PlanMigration | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    api.get<PlanMigration>(`/api/v1/admin/analytics/plan-migration?days=${period}`)
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [period])
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
  if (!data) return null

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Upgrades</p><p style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{data.upgrades}</p></Card>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Downgrades</p><p style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{data.downgrades}</p></Card>
      </div>
      {data.migration_flow.length > 0 && (
        <Card title="Migration Flow">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)' }}>From</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)' }}>To</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)' }}>Count</th>
              </tr></thead>
              <tbody>
                {data.migration_flow.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontSize: 14 }}>{m.from}</td>
                    <td style={{ padding: '10px 12px', fontSize: 14 }}>{m.to}</td>
                    <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600 }}>{m.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function InactivityTab({ period }: { period: number }) {
  const [data, setData] = useState<InactivityPatterns | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    api.get<InactivityPatterns>(`/api/v1/admin/analytics/inactivity?days=${period}`)
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [period])
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
  if (!data) return null

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Inactive &gt;7d</p><p style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{data.inactive_7d}</p></Card>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Inactive &gt;30d</p><p style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{data.inactive_30d}</p></Card>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Inactive &gt;90d</p><p style={{ fontSize: 24, fontWeight: 700, color: '#dc2626' }}>{data.inactive_90d}</p></Card>
        <Card padding="14px"><p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Re-engagement Rate</p><p style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{data.re_engagement_rate_percent}%</p></Card>
      </div>
    </div>
  )
}

function UsagePatternsTab({ period }: { period: number }) {
  const [data, setData] = useState<UsagePatterns | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    api.get<UsagePatterns>(`/api/v1/admin/analytics/usage-patterns?days=${period}`)
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [period])
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
  if (!data) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <Card title="Peak Usage Hours">
        {data.peak_hours.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.peak_hours}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No data</p>}
      </Card>
      <Card title="API Call Distribution">
        {data.api_call_distribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data.api_call_distribution} dataKey="count" nameKey="action" cx="50%" cy="50%" outerRadius={100} label={({ action, count }) => `${action}: ${count}`}>
                {data.api_call_distribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No data</p>}
      </Card>
    </div>
  )
}

function CohortTab() {
  const [data, setData] = useState<CohortRetention | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    api.get<CohortRetention>('/api/v1/admin/analytics/cohort-retention')
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
  if (!data || data.cohorts.length === 0) return <Card padding="40px"><p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No cohort data available yet</p></Card>

  const months = Object.keys(data.cohorts[0]?.retention || {})

  return (
    <Card title="Cohort Retention" subtitle="User retention by signup month">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Cohort</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>Size</th>
              {months.map(m => <th key={m} style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.cohorts.map(c => (
              <tr key={c.cohort} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 500 }}>{new Date(c.cohort).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{c.size}</td>
                {months.map(m => {
                  const val = c.retention[m]
                  return (
                    <td key={m} style={{
                      padding: '8px 12px', textAlign: 'right',
                      color: val > 50 ? '#22c55e' : val > 20 ? '#f59e0b' : '#ef4444',
                      fontWeight: val > 0 ? 600 : 400,
                    }}>
                      {val > 0 ? `${val}%` : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
