import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { Header } from '../components/layout/Header'
import {
  Users, Bot, MessageSquare, FileText, DollarSign, Activity, AlertCircle, TrendingUp,
} from 'lucide-react'
import type { DashboardData } from '../types'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

const statCards = [
  { key: 'total_users', icon: Users, label: 'Total Users', color: '#3b82f6' },
  { key: 'total_agents', icon: Bot, label: 'Total Agents', color: '#8b5cf6' },
  { key: 'total_conversations', icon: MessageSquare, label: 'Conversations', color: '#22c55e' },
  { key: 'active_users_today', icon: Activity, label: 'Active Today', color: '#f59e0b' },
  { key: 'active_agents', icon: Bot, label: 'Active Agents', color: '#06b6d4' },
  { key: 'total_documents', icon: FileText, label: 'Documents', color: '#ec4899' },
  { key: 'total_revenue', icon: DollarSign, label: 'Total Revenue', color: '#22c55e', format: true },
  { key: 'pending_support_tickets', icon: AlertCircle, label: 'Pending Tickets', color: '#ef4444' },
]

const CHART_COLORS = ['#43009a', '#7a1aff', '#b380ff', '#944dff', '#d1b3ff']

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<DashboardData>('/api/v1/admin/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spinner size="lg" /></div>
  }

  if (!data) return null

  return (
    <div>
      <Header title="Dashboard" subtitle="Overview of the Opsly platform" />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {statCards.map((card) => {
          const val = (data.stats as any)[card.key]
          return (
            <Card key={card.key} padding="16px">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{card.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>
                    {card.format ? `$${typeof val === 'number' ? val.toFixed(2) : val}` : (val ?? 0)}
                  </p>
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${card.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: card.color,
                }}>
                  <card.icon size={20} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card title="User Growth" subtitle="Last 30 days">
          {data.charts.user_growth.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.charts.user_growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke="#43009a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </Card>

        <Card title="Plan Distribution">
          {data.charts.plan_distribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.charts.plan_distribution} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                    {data.charts.plan_distribution.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                {data.charts.plan_distribution.map((item, idx) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}: <strong style={{ color: 'var(--text-primary)' }}>{item.value}</strong></span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyChart />}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card title="Agent Creation" subtitle="Last 30 days">
          {data.charts.agent_creation.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.charts.agent_creation}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="value" fill="#7a1aff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </Card>

        <Card title="Revenue" subtitle="Last 30 days">
          {data.charts.revenue_over_time.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.charts.revenue_over_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </Card>
      </div>

      <Card title="Recent Activity">
        {data.recent_activity.length > 0 ? data.recent_activity.slice(0, 8).map((activity) => (
          <div key={activity.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={16} />
              </div>
              <div>
                <p style={{ fontSize: 14 }}>{activity.description}</p>
                {activity.user_email && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activity.user_email}</p>}
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(activity.timestamp).toLocaleDateString()}</span>
          </div>
        )) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No recent activity</p>}
      </Card>
    </div>
  )
}

function EmptyChart() {
  return <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
}
