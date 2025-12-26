const getApiBaseUrl = () => {
  // Always use relative paths in production
  // This is the ONLY way to ensure CORS works correctly on Vercel
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    console.log("[v0] Current hostname:", hostname)

    // If we're NOT on localhost, ALWAYS use relative /api path
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      console.log("[v0] Production detected, using relative /api path")
      return "/api"
    }

    // Only on localhost, check for env variable
    console.log("[v0] Localhost detected")
  }

  // Local development fallback - check env variable or use relative path
  const envUrl = import.meta.env.VITE_API_URL
  console.log("[v0] VITE_API_URL:", envUrl || "not set")

  // NEVER return a hardcoded localhost URL - always use what's configured or relative
  return envUrl || "/api"
}

const API_BASE_URL = getApiBaseUrl()
console.log("[v0] Final API_BASE_URL:", API_BASE_URL)

// Leads
export const fetchLeads = async () => {
  const response = await fetch(`${API_BASE_URL}/leads`)
  if (!response.ok) throw new Error("Failed to fetch leads")
  return response.json()
}

export const createLead = async (leadData: any) => {
  const response = await fetch(`${API_BASE_URL}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadData),
  })
  if (!response.ok) throw new Error("Failed to create lead")
  return response.json()
}

export const updateLead = async (id: string, leadData: any) => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadData),
  })
  if (!response.ok) throw new Error("Failed to update lead")
  return response.json()
}

export const deleteLead = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete lead")
  return response.json()
}

export const mergeDuplicateLeads = async (duplicateIds: string[], keepId: string) => {
  const response = await fetch(`${API_BASE_URL}/leads/merge-duplicates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ duplicateIds, keepId }),
  })
  if (!response.ok) throw new Error("Failed to merge duplicate leads")
  return response.json()
}

// Callers
export const fetchCallers = async () => {
  const response = await fetch(`${API_BASE_URL}/callers`)
  if (!response.ok) throw new Error("Failed to fetch callers")
  return response.json()
}

export const createCaller = async (callerData: any) => {
  const response = await fetch(`${API_BASE_URL}/callers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(callerData),
  })
  if (!response.ok) throw new Error("Failed to create caller")
  return response.json()
}

// Activities
export const fetchActivities = async () => {
  const response = await fetch(`${API_BASE_URL}/activities`)
  if (!response.ok) throw new Error("Failed to fetch activities")
  return response.json()
}

export const fetchLeadActivities = async (leadId: string) => {
  const response = await fetch(`${API_BASE_URL}/activities/lead/${leadId}`)
  if (!response.ok) throw new Error("Failed to fetch lead activities")
  return response.json()
}

// Call Logs
export const fetchCallLogs = async () => {
  const response = await fetch(`${API_BASE_URL}/call-logs`)
  if (!response.ok) throw new Error("Failed to fetch call logs")
  return response.json()
}

export const fetchLeadCallLogs = async (leadId: string) => {
  const response = await fetch(`${API_BASE_URL}/call-logs/lead/${leadId}`)
  if (!response.ok) throw new Error("Failed to fetch lead call logs")
  return response.json()
}

export const createCallLog = async (callLogData: any) => {
  const response = await fetch(`${API_BASE_URL}/call-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(callLogData),
  })
  if (!response.ok) throw new Error("Failed to create call log")
  return response.json()
}

// Dashboard
export const fetchDashboardStats = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`)
  if (!response.ok) throw new Error("Failed to fetch dashboard stats")
  return response.json()
}

// Reports
export const fetchReportStats = async () => {
  const response = await fetch(`${API_BASE_URL}/reports/stats`)
  if (!response.ok) throw new Error("Failed to fetch report stats")
  return response.json()
}

// Auth
export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error("Invalid credentials")
  return response.json()
}

// Settings
export const fetchSettings = async () => {
  const response = await fetch(`${API_BASE_URL}/settings`)
  if (!response.ok) throw new Error("Failed to fetch settings")
  return response.json()
}

export const updateEmailSettings = async (emailConfig: any) => {
  const response = await fetch(`${API_BASE_URL}/settings/email`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emailConfig),
  })
  if (!response.ok) throw new Error("Failed to update email settings")
  return response.json()
}

export const updateLeadAssignmentSettings = async (leadAssignment: any) => {
  const response = await fetch(`${API_BASE_URL}/settings/lead-assignment`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadAssignment),
  })
  if (!response.ok) throw new Error("Failed to update lead assignment settings")
  return response.json()
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}
