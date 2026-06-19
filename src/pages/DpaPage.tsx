import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { API_BASE_URL } from '../config/constants'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'
import { Header } from '../components/layout/Header'
import { ChevronLeft, ChevronRight, Plus, FileText, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react'
import type { PaginatedDpaTemplates, DpaTemplateSummary, DpaMetrics } from '../types'

export function DpaPage() {
  const [data, setData] = useState<PaginatedDpaTemplates | null>(null)
  const [metrics, setMetrics] = useState<DpaMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ version: '', title: '', summary_text: '', effective_date: '', pdf_url: '' })
  const [actionLoading, setActionLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '20' })
      const [dpaData, metricsData] = await Promise.all([
        api.get<PaginatedDpaTemplates>(`/api/v1/admin/dpa?${params}`),
        api.get<DpaMetrics>('/api/v1/admin/dpa/metrics').catch(() => null),
      ])
      setData(dpaData)
      setMetrics(metricsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [page])

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are accepted')
      return
    }
    setUploadLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = localStorage.getItem('af_token')
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/dpa/upload-pdf`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed')
      const data = await res.json()
      setCreateForm(f => ({ ...f, pdf_url: data.url }))
      setUploadedFileName(file.name)
    } catch (err: any) {
      setError(err.message || 'Failed to upload PDF')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createForm.version || !createForm.title || !createForm.effective_date) {
      setError('Version, title, and effective date are required')
      return
    }
    setActionLoading(true)
    setError('')
    try {
      await api.post('/api/v1/admin/dpa', createForm)
      setShowCreate(false)
      setCreateForm({ version: '', title: '', summary_text: '', effective_date: '', pdf_url: '' })
      setPage(1)
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to create DPA')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePublish = async (id: string) => {
    if (!confirm('Publishing a new DPA will require all organisations to re-accept. Continue?')) return
    setActionLoading(true)
    try {
      await api.post(`/api/v1/admin/dpa/${id}/publish`)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to publish')
    } finally {
      setActionLoading(false)
    }
  }

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this DPA version?')) return
    setActionLoading(true)
    try {
      await api.post(`/api/v1/admin/dpa/${id}/archive`)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to archive')
    } finally {
      setActionLoading(false)
    }
  }

  const statusBadge = (isActive: boolean) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 500,
      background: isActive ? 'var(--green-bg, #e8f5e9)' : 'var(--bg-elevated, #f5f5f5)',
      color: isActive ? 'var(--green, #2e7d32)' : 'var(--text-muted, #757575)',
    }}>
      {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {isActive ? 'Active' : 'Archived'}
    </span>
  )

  return (
    <div>
      <Header title="DPA Management" subtitle="Manage Data Processing Agreement versions" />

      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <MetricCard icon={<FileText size={20} />} label="Total Organisations" value={String(metrics.total_organisations)} />
          <MetricCard icon={<CheckCircle size={20} color="var(--green)" />} label="Accepted" value={String(metrics.accepted_count)} />
          <MetricCard icon={<AlertTriangle size={20} color="var(--yellow)" />} label="Re-Acceptance Required" value={String(metrics.reacceptance_required_count)} />
          <MetricCard icon={<Download size={20} />} label="Adoption" value={`${metrics.adoption_percentage}%`} />
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            New Version
          </Button>
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div> : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500 }}>Version</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500 }}>Title</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500 }}>Effective Date</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 500 }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 500 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.version}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{item.title}</td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(item.effective_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px' }}>{statusBadge(item.is_active)}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {!item.is_active && (
                          <Button variant="primary" size="sm" onClick={() => handlePublish(item.id)} disabled={actionLoading}>
                            Publish
                          </Button>
                        )}
                        {item.is_active && (
                          <Button variant="ghost" size="sm" onClick={() => handleArchive(item.id)} disabled={actionLoading}>
                            Archive
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.items || data.items.length === 0) && (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No DPA versions found</td></tr>
                )}
              </tbody>
            </table>

            {data && data.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16, padding: '8px 0' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'inherit', fontSize: 13 }}>
                  <ChevronLeft size={14} /> Previous
                </button>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {data.total_pages}</span>
                <button onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page >= data.total_pages}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'inherit', fontSize: 13 }}>
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setError('') }}>
        <div style={{ padding: 24, minWidth: 450 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Create New DPA Version</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Version *</label>
              <input value={createForm.version} onChange={e => setCreateForm(f => ({ ...f, version: e.target.value }))}
                placeholder="e.g. v1.0, v2.1"
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Title *</label>
              <input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Data Processing Agreement v1.0"
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Summary</label>
              <textarea value={createForm.summary_text} onChange={e => setCreateForm(f => ({ ...f, summary_text: e.target.value }))}
                placeholder="Brief summary of changes in this version..."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Effective Date *</label>
              <input type="date" value={createForm.effective_date} onChange={e => setCreateForm(f => ({ ...f, effective_date: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>PDF Document</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                  {uploadLoading ? 'Uploading...' : 'Upload PDF'}
                  <input type="file" accept=".pdf,application/pdf" onChange={handlePdfUpload}
                    style={{ display: 'none' }} disabled={uploadLoading} />
                </label>
                {uploadedFileName && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{uploadedFileName}</span>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <input value={createForm.pdf_url} onChange={e => setCreateForm(f => ({ ...f, pdf_url: e.target.value }))}
                  placeholder="Or enter PDF URL..."
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                />
              </div>
            </div>
            {error && <div style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="ghost" onClick={() => { setShowCreate(false); setError('') }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={actionLoading}>{actionLoading ? 'Creating...' : 'Create DPA'}</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ color: 'var(--text-muted)' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  )
}
