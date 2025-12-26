const getApiBaseUrl = () => {
  const isBrowser = typeof window !== "undefined"
  const hostname = isBrowser ? window.location.hostname : ""
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("localhost")

  // [v0] Debug log to track environment detection
  if (isBrowser) {
    console.log(`[v0] Environment Check - Hostname: ${hostname}, isLocalhost: ${isLocalhost}`)
  }

  // If we are NOT on localhost, we MUST use relative paths to avoid CORS issues
  // This overrides any environment variable that might be incorrectly set to localhost
  if (isBrowser && !isLocalhost) {
    console.log("[v0] Production detected: Forcing relative API path (/api)")
    return "/api"
  }

  // Local development fallback
  const envUrl = import.meta.env.VITE_API_URL

  // Extra safety: if we're in production but the env var points to localhost, ignore it
  if (isBrowser && !isLocalhost && envUrl?.includes("localhost")) {
    console.log("[v0] Warning: VITE_API_URL points to localhost in production. Overriding with /api")
    return "/api"
  }

  return envUrl || "/api"
}

const API_BASE_URL = getApiBaseUrl()

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
