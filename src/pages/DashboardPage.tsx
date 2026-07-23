import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Header } from '../components/layout/Header'
import { Users, Bot, MessageSquare, FileText, IndianRupee, Activity, AlertCircle, TrendingUp, Wifi, WifiOff, Database, Server } from 'lucide-react'
import type { DashboardData, RedisMetrics } from '../types'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function fmt(paise: number) { return `₹${Math.round(paise / 100).toLocaleString('en-IN')}` }

const statCards = [
  { key: 'total_users', icon: Users, label: 'Total Users', color: '#3b82f6' },
  { key: 'active_users_now', icon: Activity, label: 'Active Now (15m)', color: '#22c55e' },
  { key: 'inactive_users_7d', icon: Users, label: 'Inactive (7d)', color: '#ef4444' },
  { key: 'total_agents', icon: Bot, label: 'Total Agents', color: '#8b5cf6' },
  { key: 'conversations_today', icon: MessageSquare, label: 'Conversations Today', color: '#f59e0b' },
  { key: 'active_agents', icon: Bot, label: 'Active Agents', color: '#06b6d4' },
  { key: 'total_documents', icon: FileText, label: 'Documents', color: '#ec4899' },
  { key: 'pending_support_tickets', icon: AlertCircle, label: 'Pending Tickets', color: '#ef4444' },
]

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [redis, setRedis] = useState<RedisMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<DashboardData>('/api/v1/admin/dashboard'),
      api.get<RedisMetrics>('/api/v1/admin/system/redis').catch(() => null),
    ])
      .then(([d, r]) => { setData(d); setRedis(r) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spinner size="lg" /></div>
  }
  if (!data) return null

  const health = data.system_health
  const healthOk = health?.overall_status === 'healthy'

  return (
    <div>
      <Header title="Dashboard" subtitle="Real-time platform pulse" />

      {/* System Health Banner */}
      <div style={{
        padding: '12px 16px', borderRadius: 10, marginBottom: 16,
        background: healthOk ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${healthOk ? '#22c55e' : '#ef4444'}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {healthOk ? <Wifi size={20} style={{ color: '#22c55e' }} /> : <WifiOff size={20} style={{ color: '#ef4444' }} />}
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>System {healthOk ? 'Healthy' : 'Degraded'}</span>
          <span style={{ marginLeft: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
            Admin DB: {health?.admin_db_status} ({health?.admin_db_response_ms}ms)
            {health?.opsly_db_status !== 'skipped' && ` | Opsly DB: ${health?.opsly_db_status} (${health?.opsly_db_response_ms || '—'}ms)`}
          </span>
        </div>
      </div>

      {/* Redis Metrics Banner */}
      {redis && redis.configured && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 20,
          background: redis.healthy ? 'rgba(139,92,246,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${redis.healthy ? '#8b5cf6' : '#ef4444'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Database size={18} style={{ color: redis.healthy ? '#8b5cf6' : '#ef4444' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              Redis {redis.healthy ? 'Connected' : 'Unreachable'}
            </span>
            {redis.version && <Badge variant="info">{redis.version}</Badge>}
            {redis.mode && <Badge variant="default">{redis.mode}</Badge>}
            {redis.role && <Badge variant="default">{redis.role}</Badge>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            <RedisStat label="Latency" value={redis.latency_ms != null ? `${redis.latency_ms}ms` : '—'} color="#22c55e" />
            <RedisStat label="Ops/sec" value={redis.instantaneous_ops_per_sec?.toLocaleString() ?? '—'} color="#3b82f6" />
            <RedisStat label="Memory" value={redis.used_memory_mb != null ? `${redis.used_memory_mb} MB` : '—'} color="#f59e0b"
              sub={redis.memory_usage_pct != null ? `${redis.memory_usage_pct}%` : undefined} />
            <RedisStat label="Keys" value={redis.total_keys?.toLocaleString() ?? '—'} color="#8b5cf6" />
            <RedisStat label="Clients" value={redis.connected_clients?.toString() ?? '—'} color="#06b6d4"
              sub={redis.blocked_clients ? `${redis.blocked_clients} blocked` : undefined} />
            <RedisStat label="Hit Rate" value={redis.hit_rate_pct != null ? `${redis.hit_rate_pct}%` : '—'} color="#22c55e" />
            <RedisStat label="Commands" value={redis.total_commands_processed?.toLocaleString() ?? '—'} color="#ec4899" />
            <RedisStat label="Evicted" value={redis.evicted_keys?.toLocaleString() ?? '—'} color={redis.evicted_keys && redis.evicted_keys > 0 ? '#ef4444' : '#22c55e'} />
          </div>
          {redis.error && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>Error: {redis.error}</div>
          )}
        </div>
      )}
      {redis && !redis.configured && (
        <div style={{
          padding: '10px 16px', borderRadius: 10, marginBottom: 20,
          background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b',
          fontSize: 13, color: 'var(--text-secondary)',
        }}>
          <Database size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Redis not configured in admin backend (set <code>REDIS_URL</code> in admin .env)
        </div>
      )}

      {/* MRR Highlight */}
      <Card padding="14px" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Monthly Recurring Revenue (MRR)</p>
            <p style={{ fontSize: 32, fontWeight: 700 }}>{fmt(data.stats.mrr_paise)}</p>
          </div>
        </div>
      </Card>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        {statCards.map((card) => {
          const val = (data.stats as any)[card.key]
          return (
            <Card key={card.key} padding="14px">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{card.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>{val ?? 0}</p>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                  <card.icon size={18} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
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
        <Card title="Conversations" subtitle="Last 14 days">
          {data.charts.conversation_volume.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.charts.conversation_volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
      </div>

      {/* Recent Activity */}
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

function RedisStat({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  )
}
