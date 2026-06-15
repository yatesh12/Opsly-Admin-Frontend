import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { Header } from '../components/layout/Header'
import { Users, Bot, MessageSquare, DollarSign, MessageCircle } from 'lucide-react'
import type { AnalyticsOverview, UsageAnalytics } from '../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export function AnalyticsPage() {
  const [period, setPeriod] = useState(30)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [usage, setUsage] = useState<UsageAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get<AnalyticsOverview>(`/api/v1/admin/analytics/overview?days=${period}`),
      api.get<UsageAnalytics>(`/api/v1/admin/analytics/usage?days=${period}`),
    ])
      .then(([o, u]) => { setOverview(o); setUsage(u) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [period])

  const summaryCards = overview ? [
    { icon: Users, label: 'Total Users', value: overview.total_users, change: overview.new_users, color: '#3b82f6' },
    { icon: Users, label: 'New Users', value: overview.new_users, color: '#8b5cf6' },
    { icon: Bot, label: 'Total Agents', value: overview.total_agents, change: overview.new_agents, color: '#22c55e' },
    { icon: Bot, label: 'New Agents', value: overview.new_agents, color: '#06b6d4' },
    { icon: MessageSquare, label: 'Conversations', value: overview.total_conversations, change: overview.new_conversations, color: '#f59e0b' },
    { icon: MessageCircle, label: 'Messages', value: overview.total_messages, color: '#ec4899' },
    { icon: DollarSign, label: 'Total Revenue', value: `$${overview.total_revenue.toFixed(2)}`, color: '#22c55e' },
    { icon: DollarSign, label: `Revenue (${period}d)`, value: `$${overview.revenue.toFixed(2)}`, color: '#10b981' },
  ] : []

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spinner size="lg" /></div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Analytics</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Platform metrics and usage data</p>
        </div>
        <select value={period} onChange={(e) => setPeriod(Number(e.target.value))}
          style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {summaryCards.map((card, i) => (
          <Card key={i} padding="14px">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                <card.icon size={18} />
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{card.label}</p>
                <p style={{ fontSize: 20, fontWeight: 700 }}>{card.value}</p>
                {'change' in card && card.change !== undefined && <p style={{ fontSize: 11, color: 'var(--success)' }}>+{card.change} new</p>}
              </div>
            </div>
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
          ) : <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No data available</p>}
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
          ) : <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No data available</p>}
        </Card>
      </div>

      <Card title="Plan Distribution">
        {overview ? (
          <div style={{ display: 'flex', gap: 32, padding: '8px 0' }}>
            {Object.entries(overview.plan_distribution).map(([plan, count]) => (
              <div key={plan} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand)' }}>{count}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{plan}</p>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  )
}
