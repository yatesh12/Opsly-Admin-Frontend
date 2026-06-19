export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  avatar_url: string | null
  last_login: string | null
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  admin: AdminUser
}

// Dashboard
export interface OverviewStats {
  total_users: number
  active_users_now: number
  inactive_users_7d: number
  total_agents: number
  active_agents: number
  total_conversations: number
  conversations_today: number
  total_documents: number
  mrr_paise: number
  pending_support_tickets: number
}

export interface SystemHealth {
  admin_db_status: string
  admin_db_response_ms: number
  opsly_db_status: string
  opsly_db_response_ms: number | null
  overall_status: string
}

export interface ChartDataPoint {
  label: string
  value: number
}

export interface DashboardCharts {
  user_growth: ChartDataPoint[]
  agent_creation: ChartDataPoint[]
  conversation_volume: ChartDataPoint[]
}

export interface RecentActivity {
  id: string
  type: string
  description: string
  user_email: string | null
  timestamp: string
}

export interface DashboardData {
  stats: OverviewStats
  charts: DashboardCharts
  system_health: SystemHealth
  recent_activity: RecentActivity[]
}

// Users
export interface UserSummary {
  id: string
  email: string
  full_name: string | null
  plan: string
  is_active: boolean
  is_verified: boolean
  agent_count: number
  created_at: string
  last_login: string | null
}

export interface UserDetail {
  id: string
  email: string
  full_name: string | null
  plan: string
  is_active: boolean
  is_verified: boolean
  mobile_number: string | null
  profession: string | null
  company: string | null
  google_id: string | null
  github_id: string | null
  agent_count: number
  total_conversations: number
  total_documents: number
  total_spent: number
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface PaginatedUsers {
  users: UserSummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface UserActivityLog {
  recent_conversations: { id: string; agent_name: string; created_at: string }[]
  recent_messages: { id: string; content: string; role: string; conversation_id: string; created_at: string }[]
  recent_documents: { id: string; filename: string; status: string; agent_name: string; created_at: string }[]
  billing_history: UserBillingEntry[]
}

export interface UserBillingEntry {
  id: string
  order_id: string
  payment_id: string | null
  amount_paise: number
  currency: string
  description: string
  status: string
  created_at: string
}

// Agents
export interface AgentSummary {
  id: string
  name: string
  user_email: string
  status: string
  personality_id: string | null
  doc_count: number
  total_chunks: number
  conversation_count: number
  created_at: string
  last_used_at: string | null
}

export interface AgentDetail {
  id: string
  name: string
  description: string | null
  user_id: string
  user_email: string
  status: string
  personality_id: string | null
  system_prompt: string | null
  doc_count: number
  total_chunks: number
  total_size_mb: number
  conversation_count: number
  total_tokens_used: number
  created_at: string
  updated_at: string
  last_used_at: string | null
}

export interface PaginatedAgents {
  agents: AgentSummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Analytics
export interface AnalyticsOverview {
  total_users: number
  new_users: number
  total_agents: number
  new_agents: number
  total_conversations: number
  new_conversations: number
  total_messages: number
  total_revenue_paise: number
  revenue_paise: number
  plan_distribution: Record<string, number>
  period_days: number
}

export interface UsageData {
  date: string
  conversations: number
  messages: number
  tokens: number
}

export interface UsageAnalytics {
  daily_usage: UsageData[]
  period_days: number
}

export interface RevenueAnalytics {
  mrr_paise: number
  arr_paise: number
  arpu_paise: number
  churn_rate_percent: number
  revenue_by_plan: Record<string, number>
  period_days: number
}

export interface UserEngagement {
  dau: number
  wau: number
  mau: number
  stickiness_percent: number
  daily_active: { date: string; count: number }[]
  period_days: number
}

export interface PlanMigration {
  upgrades: number
  downgrades: number
  migration_flow: { from: string; to: string; count: number }[]
  period_days: number
}

export interface InactivityPatterns {
  inactive_7d: number
  inactive_30d: number
  inactive_90d: number
  re_engagement_rate_percent: number
  period_days: number
}

export interface UsagePatterns {
  peak_hours: { hour: number; count: number }[]
  api_call_distribution: { action: string; count: number }[]
  period_days: number
}

export interface CohortRetention {
  cohorts: { cohort: string; size: number; retention: Record<string, number> }[]
}

// Support
export interface TicketSummary {
  id: string
  user_id: string | null
  user_email: string | null
  subject: string
  status: string
  priority: string
  category: string
  assigned_to: string | null
  reply_count: number
  created_at: string
  updated_at: string
}

export interface TicketDetail {
  id: string
  user_id: string | null
  user_email: string | null
  subject: string
  message: string
  status: string
  priority: string
  category: string
  assigned_to: string | null
  assigned_name: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface TicketReply {
  id: string
  ticket_id: string
  admin_id: string | null
  admin_name: string | null
  message: string
  is_internal: boolean
  created_at: string
}

export interface PaginatedTickets {
  tickets: TicketSummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Billing
export interface BillingRecordSummary {
  id: string
  user_id: string
  user_email: string
  user_name: string | null
  order_id: string
  payment_id: string | null
  amount_paise: number
  currency: string
  description: string
  status: string
  created_at: string
}

export interface PaginatedBilling {
  records: BillingRecordSummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface RevenueSummary {
  total_revenue_paise: number
  period_revenue_paise: number
  total_transactions: number
  period_transactions: number
  failed_transactions: number
  period_failed_transactions: number
  avg_transaction_value_paise: number
  period_days: number
}

// Documents
export interface DocumentSummary {
  id: string
  agent_id: string
  agent_name: string | null
  user_id: string
  user_email: string | null
  filename: string
  file_type: string
  file_size_bytes: number
  chunk_count: number
  status: string
  error_message: string | null
  created_at: string
  processed_at: string | null
}

export interface PaginatedDocuments {
  documents: DocumentSummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface StorageUsage {
  total_size_bytes: number
  total_files: number
  by_status: Record<string, number>
  by_type: Record<string, number>
  failed_count: number
  processing_count: number
}

// API Keys
export interface ApiKeySummary {
  id: string
  agent_id: string
  agent_name: string | null
  user_id: string
  user_email: string | null
  name: string
  key_prefix: string
  is_active: boolean
  request_count: number
  rate_limit_rpm: number
  created_at: string
  expires_at: string | null
  last_used_at: string | null
}

export interface PaginatedApiKeys {
  keys: ApiKeySummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ApiKeyUsageStats {
  total_keys: number
  active_keys: number
  expired_keys: number
  total_requests: number
  avg_requests_per_key: number
}

// Training
export interface TrainingJobSummary {
  id: string
  agent_id: string
  agent_name: string | null
  user_id: string
  user_email: string | null
  status: string
  current_step: string | null
  progress: number
  docs_total: number
  docs_processed: number
  chunks_created: number
  estimated_seconds: number | null
  error_message: string | null
  queued_at: string
  started_at: string | null
  completed_at: string | null
}

export interface PaginatedTrainingJobs {
  jobs: TrainingJobSummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface TrainingMetrics {
  total_jobs: number
  completed_jobs: number
  failed_jobs: number
  running_jobs: number
  queued_jobs: number
  cancelled_jobs: number
  avg_progress: number
  avg_docs_per_job: number
  total_chunks_created: number
}

// Organizations
export interface OrganizationSummary {
  id: string
  name: string
  owner_id: string
  owner_email: string | null
  owner_name: string | null
  member_count: number
  department_count: number
  created_at: string
}

export interface PaginatedOrganizations {
  organizations: OrganizationSummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface OrgDepartmentInfo {
  id: string
  name: string
  parent_id: string | null
  member_count: number
}

export interface OrgMemberInfo {
  id: string
  user_id: string
  user_email: string | null
  user_name: string | null
  role: string
  department_id: string | null
  department_name: string | null
  reports_to: string | null
}

export interface OrganizationDetail {
  id: string
  name: string
  owner_id: string
  owner_email: string | null
  owner_name: string | null
  departments: OrgDepartmentInfo[]
  members: OrgMemberInfo[]
  created_at: string
}

// Plans
export interface PlanSummary {
  id: string
  name: string
  display_name: string
  description: string | null
  price_paise: number
  currency: string
  agent_limit: number
  storage_mb: number
  api_calls_limit: number
  features: Record<string, any> | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PaginatedPlans {
  plans: PlanSummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Audit Log
export interface AuditLogEntry {
  id: string
  admin_id: string
  admin_email: string
  action: string
  resource_type: string
  resource_id: string | null
  details: string | null
  created_at: string
}

export interface PaginatedAuditLogs {
  logs: AuditLogEntry[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Contradictions
export interface ContradictionSummary {
  id: string
  agent_id: string
  agent_name: string | null
  topic: string
  description: string
  severity: string
  created_at: string
  resolved_at: string | null
}

export interface PaginatedContradictions {
  contradictions: ContradictionSummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// DPA
export interface DpaTemplateSummary {
  id: string
  version: string
  title: string
  summary_text: string
  effective_date: string
  pdf_url: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PaginatedDpaTemplates {
  items: DpaTemplateSummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface DpaMetrics {
  total_organisations: number
  accepted_count: number
  pending_count: number
  reacceptance_required_count: number
  adoption_percentage: number
}
