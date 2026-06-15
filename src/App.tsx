import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { UsersPage } from './pages/UsersPage'
import { AgentsPage } from './pages/AgentsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { BillingPage } from './pages/BillingPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { ApiKeysPage } from './pages/ApiKeysPage'
import { TrainingPage } from './pages/TrainingPage'
import { OrganizationsPage } from './pages/OrganizationsPage'
import { PlansPage } from './pages/PlansPage'
import { SupportPage } from './pages/SupportPage'
import { ContradictionsPage } from './pages/ContradictionsPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/api-keys" element={<ApiKeysPage />} />
        <Route path="/training" element={<TrainingPage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/contradictions" element={<ContradictionsPage />} />
        <Route path="/admin-users" element={<AdminUsersPage />} />
        <Route path="/audit-log" element={<AuditLogPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
