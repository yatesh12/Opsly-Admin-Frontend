import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: 240,
        padding: '24px 32px',
        maxWidth: 'calc(100vw - 240px)',
      }}>
        <Outlet />
      </main>
    </div>
  )
}
