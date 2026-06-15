import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Header } from '../components/layout/Header'
import { Search, ChevronLeft, ChevronRight, MessageSquare, Send } from 'lucide-react'
import type { PaginatedTickets, TicketDetail, TicketReply } from '../types'

export function SupportPage() {
  const [data, setData] = useState<PaginatedTickets | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null)
  const [replies, setReplies] = useState<TicketReply[]>([])
  const [showDetail, setShowDetail] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTickets = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: '20' })
    if (statusFilter) params.set('status', statusFilter)
    api.get<PaginatedTickets>(`/api/v1/admin/support/tickets?${params}`)
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTickets() }, [page, statusFilter])

  const viewTicket = async (ticketId: string) => {
    try {
      const [ticket, ticketReplies] = await Promise.all([
        api.get<TicketDetail>(`/api/v1/admin/support/tickets/${ticketId}`),
        api.get<TicketReply[]>(`/api/v1/admin/support/tickets/${ticketId}/replies`),
      ])
      setSelectedTicket(ticket)
      setReplies(ticketReplies)
      setShowDetail(true)
      setReplyText('')
    } catch (err) { console.error(err) }
  }

  const updateStatus = async (ticketId: string, status: string) => {
    try {
      await api.put(`/api/v1/admin/support/tickets/${ticketId}`, { status })
      fetchTickets()
      if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, status })
    } catch (err) { console.error(err) }
  }

  const sendReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      await api.post(`/api/v1/admin/support/tickets/${selectedTicket!.id}/replies`, { message: replyText })
      const updated = await api.get<TicketReply[]>(`/api/v1/admin/support/tickets/${selectedTicket!.id}/replies`)
      setReplies(updated)
      setReplyText('')
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  const statusColors: Record<string, string> = { open: 'info', in_progress: 'warning', resolved: 'success', closed: 'default' }
  const priorityColors: Record<string, string> = { low: 'default', medium: 'warning', high: 'danger', urgent: 'danger' }

  return (
    <div>
      <Header title="Support" subtitle="Manage support tickets" />

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', width: 160 }}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Subject', 'User', 'Status', 'Priority', 'Replies', 'Created'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.tickets.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => viewTicket(t.id)}>
                      <td style={{ padding: '12px', fontSize: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MessageSquare size={14} style={{ color: 'var(--text-muted)' }} />
                          {t.subject}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{t.user_email || 'Anonymous'}</td>
                      <td style={{ padding: '12px' }}><Badge variant={(statusColors[t.status] || 'default') as any}>{t.status}</Badge></td>
                      <td style={{ padding: '12px' }}><Badge variant={(priorityColors[t.priority] || 'default') as any}>{t.priority}</Badge></td>
                      <td style={{ padding: '12px', fontSize: 14 }}>{t.reply_count}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && data.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{((page - 1) * 20) + 1}-{Math.min(page * 20, data.total)} of {data.total}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></Button>
                  <Button size="sm" variant="secondary" disabled={page >= data.total_pages} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Ticket Details" width={640}>
        {selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{selectedTicket.subject}</h3>
                <Badge variant={(statusColors[selectedTicket.status] || 'default') as any}>{selectedTicket.status}</Badge>
                <Badge variant={(priorityColors[selectedTicket.priority] || 'default') as any}>{selectedTicket.priority}</Badge>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>From: {selectedTicket.user_email || 'Anonymous'} | Category: {selectedTicket.category}</p>
            </div>

            <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <p style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{selectedTicket.message}</p>
            </div>

            {replies.length > 0 && (
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Replies ({replies.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {replies.map(r => (
                    <div key={r.id} style={{ padding: 10, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{r.admin_name || 'System'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: 13 }}>{r.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Add Reply</h4>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={replyText} onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply..."
                  style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                />
                <Button size="sm" onClick={sendReply} disabled={sending || !replyText.trim()} icon={<Send size={14} />}>Send</Button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 8 }}>
              {selectedTicket.status !== 'resolved' && <Button size="sm" variant="primary" onClick={() => updateStatus(selectedTicket.id, 'resolved')}>Mark Resolved</Button>}
              {selectedTicket.status !== 'closed' && <Button size="sm" variant="secondary" onClick={() => updateStatus(selectedTicket.id, 'closed')}>Close</Button>}
              {selectedTicket.status === 'closed' && <Button size="sm" variant="secondary" onClick={() => updateStatus(selectedTicket.id, 'open')}>Reopen</Button>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
