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
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
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
    if (!replyText.trim() || !selectedTicket) return
    setSending(true)
    try {
      await api.post(`/api/v1/admin/support/tickets/${selectedTicket.id}/replies`, { message: replyText, is_internal: false })
      const updated = await api.get<TicketReply[]>(`/api/v1/admin/support/tickets/${selectedTicket.id}/replies`)
      setReplies(updated)
      setReplyText('')
      if (selectedTicket.status === 'open') {
        await updateStatus(selectedTicket.id, 'in_progress')
      }
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  const statusColors: Record<string, string> = { open: 'warning', in_progress: 'info', resolved: 'success', closed: 'default' }
  const priorityColors: Record<string, string> = { low: 'default', medium: 'warning', high: 'danger', urgent: 'danger' }

  return (
    <div>
      <Header title="Support" subtitle="Manage support tickets and inquiries" />

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input placeholder="Search tickets..."
              style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
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
                    {['Subject', 'User', 'Status', 'Priority', 'Category', 'Replies', 'Updated', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.tickets.map(ticket => (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: 14, fontWeight: 500 }}>{ticket.subject}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{ticket.user_email || 'Anonymous'}</td>
                      <td style={{ padding: '12px' }}><Badge variant={(statusColors[ticket.status] || 'default') as any}>{ticket.status}</Badge></td>
                      <td style={{ padding: '12px' }}><Badge variant={(priorityColors[ticket.priority] || 'default') as any}>{ticket.priority}</Badge></td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{ticket.category}</td>
                      <td style={{ padding: '12px', fontSize: 14 }}>{ticket.reply_count}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(ticket.updated_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}><Button size="sm" variant="ghost" onClick={() => viewTicket(ticket.id)}><MessageSquare size={14} /></Button></td>
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

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title={`Ticket: ${selectedTicket?.subject}`} width={640}>
        {selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Badge variant={(statusColors[selectedTicket.status] || 'default') as any}>{selectedTicket.status}</Badge>
              <Badge variant={(priorityColors[selectedTicket.priority] || 'default') as any}>{selectedTicket.priority}</Badge>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>{selectedTicket.category}</span>
            </div>

            <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{selectedTicket.user_email || 'Anonymous'}</p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedTicket.message}</p>
            </div>

            {replies.length > 0 && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Replies ({replies.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {replies.map(reply => (
                    <div key={reply.id} style={{ padding: 12, background: reply.is_internal ? 'rgba(245,158,11,0.08)' : 'var(--bg-elevated)', borderRadius: 8, borderLeft: reply.is_internal ? '3px solid var(--warning)' : '3px solid var(--brand)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: reply.is_internal ? 'var(--warning)' : 'var(--text-primary)' }}>
                          {reply.admin_name || 'Admin'} {reply.is_internal ? '(Internal)' : ''}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(reply.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{reply.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply..."
                  rows={3}
                  style={{ flex: 1, padding: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                />
                <Button onClick={sendReply} loading={sending} icon={<Send size={16} />} style={{ alignSelf: 'flex-end' }}>Send</Button>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {selectedTicket.status !== 'resolved' && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(selectedTicket.id, 'resolved')}>Mark Resolved</Button>
                )}
                {selectedTicket.status === 'resolved' && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(selectedTicket.id, 'open')}>Reopen</Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
