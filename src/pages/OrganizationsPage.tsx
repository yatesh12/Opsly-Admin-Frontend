import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'
import { Header } from '../components/layout/Header'
import { Search, ChevronLeft, ChevronRight, Building2, Users, Eye } from 'lucide-react'
import type { PaginatedOrganizations, OrganizationDetail } from '../types'

export function OrganizationsPage() {
  const [data, setData] = useState<PaginatedOrganizations | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<OrganizationDetail | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: '20' })
    if (search) params.set('search', search)
    api.get<PaginatedOrganizations>(`/api/v1/admin/organizations?${params}`)
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [page, search])

  const viewOrg = async (orgId: string) => {
    setDetailLoading(true); setShowDetail(true)
    try { setSelected(await api.get<OrganizationDetail>(`/api/v1/admin/organizations/${orgId}`)) }
    catch (err) { console.error(err) }
    finally { setDetailLoading(false) }
  }

  return (
    <div>
      <Header title="Organizations" subtitle="View platform organizations" />

      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organizations..."
              style={{ width: '100%', padding: '8px 12px 8px 36px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Name', 'Owner', 'Members', 'Departments', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.organizations.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Building2 size={16} style={{ color: 'var(--brand)' }} />
                          {o.name}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: 13 }}>{o.owner_email || o.owner_name || '—'}</td>
                      <td style={{ padding: '12px', fontSize: 14 }}>{o.member_count}</td>
                      <td style={{ padding: '12px', fontSize: 14 }}>{o.department_count}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}><Button size="sm" variant="ghost" onClick={() => viewOrg(o.id)}><Eye size={14} /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && data.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
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

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Organization Details" width={700}>
        {detailLoading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{selected.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Owner: {selected.owner_email || selected.owner_name || selected.owner_id}</p>
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={16} /> Departments ({selected.departments.length})
              </h4>
              {selected.departments.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selected.departments.map(d => (
                    <div key={d.id} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontSize: 13 }}>
                      {d.name} <span style={{ color: 'var(--text-muted)' }}>({d.member_count} members)</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No departments</p>}
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={16} /> Members ({selected.members.length})
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Role</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.members.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', fontSize: 13 }}>{m.user_name || m.user_email || m.user_id}</td>
                        <td style={{ padding: '8px 10px', fontSize: 13 }}>{m.role}</td>
                        <td style={{ padding: '8px 10px', fontSize: 13, color: 'var(--text-secondary)' }}>{m.department_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
