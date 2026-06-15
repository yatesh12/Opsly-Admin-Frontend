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

export interface OverviewStats {
  total_users: number
  total_agents: number
  total_conversations: number
  active_users_today: number
  active_agents: number
  total_documents: number
  total_revenue: number
  pending_support_tickets: number
}

export interface ChartDataPoint {
  label: string
  value: number
}

export interface DashboardCharts {
  user_growth: ChartDataPoint[]
  agent_creation: ChartDataPoint[]
  revenue_over_time: ChartDataPoint[]
  plan_distribution: ChartDataPoint[]
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
  recent_activity: RecentActivity[]
}

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

export interface AnalyticsOverview {
  total_users: number
  new_users: number
  total_agents: number
  new_agents: number
  total_conversations: number
  new_conversations: number
  total_messages: number
  total_revenue: number
  revenue: number
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
