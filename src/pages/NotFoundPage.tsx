import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      <h1 style={{ fontSize: 64, fontWeight: 700, color: 'var(--brand)' }}>404</h1>
      <p style={{ fontSize: 18, color: 'var(--text-secondary)' }}>Page not found</p>
      <Link to="/">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  )
}
