import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Header } from '../components/layout/Header'
import { Search, ChevronLeft, ChevronRight, Eye, Trash2, Bot } from 'lucide-react'
import type { PaginatedAgents, AgentDetail } from '../types'

export function AgentsPage() {
  const [data, setData] = useState<PaginatedAgents | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<AgentDetail | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const fetchAgents = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: '20' })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    api.get<PaginatedAgents>(`/api/v1/admin/agents?${params}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAgents() }, [page, statusFilter])

  const viewAgent = async (agentId: string) => {
    try {
      const agent = await api.get<AgentDetail>(`/api/v1/admin/agents/${agentId}`)
      setSelectedAgent(agent)
      setShowDetail(true)
    } catch (err) { console.error(err) }
  }

  const deleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return
    try {
      await api.delete(`/api/v1/admin/agents/${agentId}`)
      setShowDetail(false)
      fetchAgents()
    } catch (err) { console.error(err) }
  }

  const statusColors: Record<string, string> = { ready: 'success', indexing: 'info', failed: 'danger', paused: 'warning', archived: 'default' }

  return (
    <div>
      <Header title="Agents" subtitle="Manage AI agents across the platform" />

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchAgents()}
              placeholder="Search agents by name or user email..."
              style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 160 }}>
            <option value="">All Status</option>
            <option value="ready">Ready</option>
            <option value="indexing">Indexing</option>
            <option value="failed">Failed</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Name', 'User', 'Status', 'Documents', 'Conversations', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.agents.map(agent => (
                    <tr key={agent.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Bot size={16} style={{ color: 'var(--brand)' }} />
                          {agent.name}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{agent.user_email}</td>
                      <td style={{ padding: '12px' }}><Badge variant={(statusColors[agent.status] || 'default') as any}>{agent.status}</Badge></td>
                      <td style={{ padding: '12px', fontSize: 14 }}>{agent.doc_count}</td>
                      <td style={{ padding: '12px', fontSize: 14 }}>{agent.conversation_count}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(agent.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}><Button size="sm" variant="ghost" onClick={() => viewAgent(agent.id)}><Eye size={14} /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && data.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, data.total)} of {data.total}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></Button>
                  <Button size="sm" variant="secondary" disabled={page >= data.total_pages} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Agent Details" width={600}>
        {selectedAgent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Name</label><p style={{ fontSize: 14, fontWeight: 600 }}>{selectedAgent.name}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>User</label><p style={{ fontSize: 14 }}>{selectedAgent.user_email}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</label><p style={{ fontSize: 14 }}><Badge variant={(statusColors[selectedAgent.status] || 'default') as any}>{selectedAgent.status}</Badge></p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Personality</label><p style={{ fontSize: 14 }}>{selectedAgent.personality_id || 'Classic'}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Documents</label><p style={{ fontSize: 14 }}>{selectedAgent.doc_count}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Chunks</label><p style={{ fontSize: 14 }}>{selectedAgent.total_chunks}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conversations</label><p style={{ fontSize: 14 }}>{selectedAgent.conversation_count}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tokens Used</label><p style={{ fontSize: 14 }}>{selectedAgent.total_tokens_used.toLocaleString()}</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Size</label><p style={{ fontSize: 14 }}>{selectedAgent.total_size_mb.toFixed(2)} MB</p></div>
              <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Created</label><p style={{ fontSize: 14 }}>{new Date(selectedAgent.created_at).toLocaleDateString()}</p></div>
            </div>
            {selectedAgent.description && <div><label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Description</label><p style={{ fontSize: 14, marginTop: 4 }}>{selectedAgent.description}</p></div>}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="danger" size="sm" onClick={() => deleteAgent(selectedAgent.id)} icon={<Trash2 size={14} />}>Delete Agent</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
