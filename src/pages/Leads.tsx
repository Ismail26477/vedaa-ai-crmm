"use client"

import { getFirstLineOfNotes } from "@/lib/noteUtils"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { useMemo } from "react"

import { useState, useEffect } from "react"
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns"
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Grid3X3,
  List,
  Phone,
  MoreVertical,
  Trash2,
  Edit,
  Eye,
  MessageCircle,
  Copy,
  Users,
  Flame,
  IndianRupee,
  Calendar,
  TrendingUp,
  X,
  ChevronDown,
  ArrowUpDown,
  UserPlus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { leadSourceLabels, leadCategoryLabels, leadSubcategoryLabels } from "@/data/mockData"
import { StageBadge, PriorityBadge, StatusBadge } from "@/components/ui/stage-badge"
import type { Lead, LeadStage, LeadPriority, LeadSource, Caller } from "@/types/crm"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ImportLeadsDialog } from "@/components/leads/ImportLeadsDialog"
import { LeadDetailDrawer } from "@/components/leads/LeadDetailDrawer"
import { IntegrationImportDialog } from "@/components/leads/IntegrationImportDialog"
import { AddLeadDialog } from "@/components/leads/AddLeadDialog"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { BulkCampaignDialog } from "@/components/leads/BulkCampaignDialog"
import { LeadScoreIndicator, calculateLeadScore } from "@/components/leads/LeadScoreIndicator"
import { DuplicateDetector } from "@/components/leads/DuplicateDetector"
import { FloatingActionMenu } from "@/components/leads/FloatingActionMenu"
import { fetchLeads, fetchCallers, createLead, updateLead, deleteLead, mergeDuplicateLeads } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

type DateFilter = "all" | "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "custom"
type SortField = "name" | "createdAt" | "value" | "priority"
type SortOrder = "asc" | "desc"

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [callers, setCallers] = useState<Caller[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [callerFilter, setCallerFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [valueRange, setValueRange] = useState({ min: "", max: "" })
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false)
  const [bulkCampaignDialogOpen, setBulkCampaignDialogOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    srNo: true,
    lead: true,
    phone: true,
    contact: true,
    value: true,
    stage: true,
    priority: true,
    source: true,
    status: true,
    category: true,
    subcategory: true,
    assignedTo: true,
    nextFollowUp: true,
    notes: true,
    createdAt: true,
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadsData, callersData] = await Promise.all([fetchLeads(), fetchCallers()])
        console.log("[v0] Loaded leads:", leadsData.length)
        console.log("[v0] Loaded callers:", callersData.length)
        setLeads(leadsData)
        setCallers(callersData)
      } catch (error) {
        console.error("[v0] Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load leads data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const handleImportLeads = async (importedLeads: Partial<Lead>[]) => {
    try {
      const newLeads = await Promise.all(
        importedLeads.map((lead) =>
          createLead({
            ...lead,
            status: lead.status || "active",
            stage: lead.stage || "new",
            priority: lead.priority || "warm",
            category: lead.category || "property",
            subcategory: lead.subcategory || "india_property",
            value: lead.value || 0,
            source: lead.source || "other",
          }),
        ),
      )

      setLeads((prev) => [...newLeads, ...prev])
      toast({
        title: "Import successful!",
        description: `${newLeads.length} leads have been added to your list`,
      })
    } catch (error) {
      console.error("[v0] Error importing leads:", error)
      toast({
        title: "Error",
        description: "Failed to import leads",
        variant: "destructive",
      })
    }
  }

  const handleAddLead = async (newLead: Lead) => {
    try {
      const createdLead = await createLead(newLead)
      setLeads((prev) => [createdLead, ...prev])
      toast({
        title: "Lead added successfully!",
        description: `Lead "${newLead.name}" has been added to your list`,
      })
    } catch (error) {
      console.error("[v0] Error adding lead:", error)
      toast({
        title: "Error",
        description: "Failed to add lead",
        variant: "destructive",
      })
    }
  }

  const handleExportCSV = () => {
    const headers = [
      "Name",
      "Phone",
      "Email",
      "City",
      "Value",
      "Source",
      "Stage",
      "Priority",
      "Status",
      "Category", // Added Category
      "Subcategory", // Added Subcategory
      "Assigned To",
      "Created At",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredLeads.map((lead) =>
        [
          `"${lead.name}"`,
          `"${lead.phone}"`,
          `"${lead.email}"`,
          `"${lead.city}"`,
          lead.value,
          leadSourceLabels[lead.source] || lead.source,
          lead.stage,
          lead.priority,
          lead.status,
          leadCategoryLabels[lead.category] || lead.category, // Added Category Label
          leadSubcategoryLabels[lead.subcategory] || lead.subcategory, // Added Subcategory Label
          `"${lead.assignedCallerName || ""}"`,
          lead.createdAt,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    toast({ title: "Export complete", description: `${filteredLeads.length} leads exported to CSV` })
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString()}`
  }

  const getDateRange = (filter: DateFilter): { start: Date; end: Date } | null => {
    const now = new Date()
    const today = startOfDay(now)

    switch (filter) {
      case "today":
        return { start: today, end: endOfDay(now) }
      case "yesterday":
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) }
      case "last7days":
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) }
      case "last30days":
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) }
      case "thisMonth":
        return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), end: endOfDay(now) }
      case "custom":
        if (customDateRange.from && customDateRange.to) {
          return { start: startOfDay(customDateRange.from), end: endOfDay(customDateRange.to) }
        }
        return null
      default:
        return null
    }
  }

  const filteredLeads = useMemo(() => {
    const filtered = leads.filter((lead) => {
      if (user?.role === "caller" && user?.callerId) {
        if (lead.assignedCaller !== user.callerId) {
          return false
        }
      }

      const matchesSearch =
        searchQuery === "" ||
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.city.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStage = stageFilter === "all" || lead.stage === stageFilter
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter
      const matchesCaller = callerFilter === "all" || lead.assignedCaller === callerFilter
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter
      const matchesCategory = categoryFilter === "all" || lead.category === categoryFilter
      const matchesSubcategory = subcategoryFilter === "all" || lead.subcategory === subcategoryFilter

      const dateRange = getDateRange(dateFilter)
      const matchesDate = !dateRange || isWithinInterval(parseISO(lead.createdAt), dateRange)

      const minValue = valueRange.min ? Number.parseFloat(valueRange.min) : 0
      const maxValue = valueRange.max ? Number.parseFloat(valueRange.max) : Number.POSITIVE_INFINITY
      const matchesValue = lead.value >= minValue && lead.value <= maxValue

      return (
        matchesSearch &&
        matchesStage &&
        matchesPriority &&
        matchesCaller &&
        matchesStatus &&
        matchesSource &&
        matchesCategory &&
        matchesSubcategory &&
        matchesDate &&
        matchesValue
      )
    })

    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "value":
          comparison = a.value - b.value
          break
        case "priority":
          const priorityOrder = { hot: 3, warm: 2, cold: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [
    leads,
    searchQuery,
    stageFilter,
    priorityFilter,
    callerFilter,
    statusFilter,
    sourceFilter,
    categoryFilter,
    subcategoryFilter, // Added subcategory to dependency array
    dateFilter,
    customDateRange,
    valueRange,
    sortField,
    sortOrder,
    user, // Added user to dependency array
  ])

  const stats = {
    total: filteredLeads.length,
    newToday: filteredLeads.filter((l) => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
    hot: filteredLeads.filter((l) => l.priority === "hot").length,
    totalValue: filteredLeads.reduce((sum, l) => sum + l.value, 0),
    followUpToday: filteredLeads.filter(
      (l) => l.nextFollowUp && new Date(l.nextFollowUp).toDateString() === new Date().toDateString(),
    ).length,
    overdue: filteredLeads.filter((l) => l.nextFollowUp && new Date(l.nextFollowUp) < new Date()).length,
  }

  const sourceDistribution = useMemo(() => {
    const distribution: Record<string, number> = {}
    filteredLeads.forEach((lead) => {
      distribution[lead.source] = (distribution[lead.source] || 0) + 1
    })
    return Object.entries(distribution).map(([source, count]) => ({
      name: leadSourceLabels[source as LeadSource] || source,
      value: count,
    }))
  }, [filteredLeads])

  const conversionData = useMemo(() => {
    return [
      { stage: "New", count: filteredLeads.filter((l) => l.stage === "new").length, color: "#0EA5E9" },
      { stage: "Qualified", count: filteredLeads.filter((l) => l.stage === "qualified").length, color: "#8B5CF6" },
      { stage: "Proposal", count: filteredLeads.filter((l) => l.stage === "proposal").length, color: "#F59E0B" },
      { stage: "Won", count: filteredLeads.filter((l) => l.stage === "won").length, color: "#22C55E" },
    ]
  }, [filteredLeads])

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    try {
      const updatedLead = await updateLead(leadId, { stage: newStage, updatedAt: new Date().toISOString() })
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? updatedLead : lead)))
      toast({ title: "Stage updated", description: `Lead stage changed to ${newStage}` })
    } catch (error) {
      console.error("[v0] Error updating stage:", error)
      toast({
        title: "Error",
        description: "Failed to update lead stage",
        variant: "destructive",
      })
    }
  }

  const handlePriorityChange = async (leadId: string, newPriority: LeadPriority) => {
    try {
      const updatedLead = await updateLead(leadId, { priority: newPriority, updatedAt: new Date().toISOString() })
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? updatedLead : lead)))
      toast({ title: "Priority updated", description: `Lead priority changed to ${newPriority}` })
    } catch (error) {
      console.error("[v0] Error updating priority:", error)
      toast({
        title: "Error",
        description: "Failed to update lead priority",
        variant: "destructive",
      })
    }
  }

  const handleUpdateLead = async (updatedLead: Lead) => {
    try {
      const lead = await updateLead(updatedLead.id, updatedLead)
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l)))
      setSelectedLead(lead)
      toast({ title: "Lead updated successfully!" })
    } catch (error) {
      console.error("[v0] Error updating lead:", error)
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      })
    }
  }

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead)
    setDetailDrawerOpen(true)
  }

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map((l) => l.id))
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedLeads.map((id) => deleteLead(id)))
      setLeads((prev) => prev.filter((l) => !selectedLeads.includes(l.id)))
      toast({ title: "Leads deleted", description: `${selectedLeads.length} leads removed` })
      setSelectedLeads([])
    } catch (error) {
      console.error("[v0] Error bulk deleting leads:", error)
      toast({
        title: "Error",
        description: "Failed to delete leads",
        variant: "destructive",
      })
    }
  }

  const handleBulkAssign = (callerId: string) => {
    const caller = callers.find((c) => c.id === callerId)

    Promise.all(
      selectedLeads.map((leadId) => {
        const lead = leads.find((l) => l.id === leadId)
        if (lead) {
          return updateLead(leadId, {
            ...lead,
            assignedCaller: callerId,
            assignedCallerName: caller?.name,
            updatedAt: new Date().toISOString(),
          })
        }
        return Promise.resolve() // Return a resolved promise if lead is not found
      }),
    )
      .then((updatedLeads) => {
        setLeads((prev) =>
          prev.map((lead) =>
            selectedLeads.includes(lead.id)
              ? {
                  ...lead,
                  assignedCaller: callerId,
                  assignedCallerName: caller?.name,
                  updatedAt: new Date().toISOString(),
                }
              : lead,
          ),
        )
        toast({
          title: "Bulk assignment successful",
          description: `${selectedLeads.length} leads assigned to ${caller?.name}`,
        })
        setSelectedLeads([])
      })
      .catch((error) => {
        console.error("[v0] Error bulk assigning:", error)
        toast({
          title: "Error",
          description: "Failed to assign leads",
          variant: "destructive",
        })
      })
  }

  const handleBulkStageChange = async (stage: LeadStage) => {
    try {
      await Promise.all(
        selectedLeads.map((leadId) => updateLead(leadId, { stage, updatedAt: new Date().toISOString() })),
      )
      setLeads((prev) =>
        prev.map((lead) =>
          selectedLeads.includes(lead.id) ? { ...lead, stage, updatedAt: new Date().toISOString() } : lead,
        ),
      )
      toast({ title: "Stage updated", description: `${selectedLeads.length} leads moved to ${stage}` })
      setSelectedLeads([])
    } catch (error) {
      console.error("[v0] Error bulk changing stage:", error)
      toast({
        title: "Error",
        description: "Failed to update lead stages",
        variant: "destructive",
      })
    }
  }

  const handleBulkPriorityChange = async (priority: LeadPriority) => {
    try {
      await Promise.all(
        selectedLeads.map((leadId) => updateLead(leadId, { priority, updatedAt: new Date().toISOString() })),
      )
      setLeads((prev) =>
        prev.map((lead) =>
          selectedLeads.includes(lead.id) ? { ...lead, priority, updatedAt: new Date().toISOString() } : lead,
        ),
      )
      toast({ title: "Priority updated", description: `${selectedLeads.length} leads marked as ${priority}` })
      setSelectedLeads([])
    } catch (error) {
      console.error("[v0] Error bulk changing priority:", error)
      toast({
        title: "Error",
        description: "Failed to update lead priorities",
        variant: "destructive",
      })
    }
  }

  const handleBulkCampaign = (
    type: "email" | "sms",
    data: { subject?: string; message: string; template?: string },
  ) => {
    const selectedLeadsList = leads.filter((lead) => selectedLeads.includes(lead.id))

    toast({
      title: `${type === "email" ? "Email" : "SMS"} Campaign Sent`,
      description: `Successfully sent ${type} to ${selectedLeadsList.length} lead(s)`,
    })

    console.log(`[v0] Sending ${type} campaign to ${selectedLeadsList.length} leads:`, data)
  }

  const handleMergeDuplicates = async (duplicateIds: string[], keepId: string) => {
    try {
      await mergeDuplicateLeads(duplicateIds, keepId)

      setLeads((prev) => prev.filter((lead) => !duplicateIds.includes(lead.id)))

      toast({
        title: "Duplicates Merged",
        description: `Successfully merged ${duplicateIds.length} duplicate lead(s)`,
      })
    } catch (error) {
      console.error("[v0] Error merging duplicates:", error)
      toast({
        title: "Error",
        description: "Failed to merge duplicates",
        variant: "destructive",
      })
    }
  }

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone)
    toast({ title: "Copied!", description: "Phone number copied to clipboard" })
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setStageFilter("all")
    setPriorityFilter("all")
    setCallerFilter("all")
    setStatusFilter("all")
    setSourceFilter("all")
    setCategoryFilter("all")
    setSubcategoryFilter("all") // Reset subcategory filter
    setDateFilter("all")
    setCustomDateRange({})
    setValueRange({ min: "", max: "" })
    toast({ title: "Filters cleared", description: "All filters have been reset" })
  }

  const activeFiltersCount = [
    searchQuery !== "",
    stageFilter !== "all",
    priorityFilter !== "all",
    callerFilter !== "all",
    statusFilter !== "all",
    sourceFilter !== "all",
    categoryFilter !== "all",
    subcategoryFilter !== "all", // Count subcategory filter
    dateFilter !== "all",
    valueRange.min !== "" || valueRange.max !== "",
  ].filter(Boolean).length

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  // Renamed for clarity and consistency with updates
  const exportLeads = handleExportCSV

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading leads...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Leads</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage and track your sales leads</p>
          </div>

          {/* Desktop Add Lead Button */}
          <div className="hidden md:flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent" onClick={exportLeads}>
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button className="btn-gradient-primary gap-2" onClick={() => setAddLeadDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Lead
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <Card className="stat-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Leads</p>
                <p className="text-xl font-bold font-display">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">New Today</p>
                <p className="text-xl font-bold font-display">{stats.newToday}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hot Leads</p>
                <p className="text-xl font-bold font-display">{stats.hot}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold font-display">{formatCurrency(stats.totalValue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Follow-ups Today</p>
                <p className="text-xl font-bold font-display">{stats.followUpToday}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-xl font-bold font-display">{stats.overdue}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conversionData.map((item, index) => (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.stage}</span>
                      <span className="font-medium">{item.count} leads</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(item.count / stats.total) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={sourceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sourceDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={["#0EA5E9", "#8B5CF6", "#F59E0B", "#22C55E", "#EF4444", "#6B7280"][index % 6]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {sourceDistribution.slice(0, 4).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: ["#0EA5E9", "#8B5CF6", "#F59E0B", "#22C55E"][index % 4] }}
                    />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, phone, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <Calendar className="w-4 h-4" />
                      {dateFilter === "all"
                        ? "All Time"
                        : dateFilter === "today"
                          ? "Today"
                          : dateFilter === "yesterday"
                            ? "Yesterday"
                            : dateFilter === "last7days"
                              ? "Last 7 Days"
                              : dateFilter === "last30days"
                                ? "Last 30 Days"
                                : dateFilter === "thisMonth"
                                  ? "This Month"
                                  : "Custom Range"}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setDateFilter("all")}>All Time</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("today")}>Today</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("yesterday")}>Yesterday</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("last7days")}>Last 7 Days</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("last30days")}>Last 30 Days</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("thisMonth")}>This Month</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <Popover>
                      <PopoverTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Custom Range...</DropdownMenuItem>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="range"
                          selected={{ from: customDateRange.from, to: customDateRange.to }}
                          onSelect={(range) => {
                            setCustomDateRange({ from: range?.from, to: range?.to })
                            if (range?.from && range?.to) {
                              setDateFilter("custom")
                            }
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="new">New Lead</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="won">Closed Won</SelectItem>
                    <SelectItem value="lost">Closed Lost</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={cn(activeFiltersCount > 0 && "border-primary")}
                >
                  <Filter className="w-4 h-4" />
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-2">
                    <X className="w-4 h-4" />
                    Clear Filters
                  </Button>
                )}

                <div className="flex items-center gap-1 ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Column Visibility</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.entries(visibleColumns).map(([key, value]) => (
                        <DropdownMenuCheckboxItem
                          key={key}
                          checked={value}
                          onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, [key]: checked }))}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="interested">Interested</SelectItem>
                        <SelectItem value="callback">Callback</SelectItem>
                        <SelectItem value="not_interested">Not Interested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Source</label>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="google_ads">Google Ads</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="walk_in">Walk-in</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Updated Category filter */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Category</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="property">Property</SelectItem>
                        <SelectItem value="loans">Loans</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Added Subcategory filter */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Subcategory</label>
                    <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Subcategories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subcategories</SelectItem>
                        <SelectItem value="india_property">India Property</SelectItem>
                        <SelectItem value="australia_property">Australia Property</SelectItem>
                        <SelectItem value="dubai_property">Dubai Property</SelectItem>
                        <SelectItem value="personal_loan">Personal Loan</SelectItem>
                        <SelectItem value="home_loan">Home Loan</SelectItem>
                        <SelectItem value="business_loan">Business Loan</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Assigned To</label>
                    <Select value={callerFilter} onValueChange={setCallerFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Callers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Callers</SelectItem>
                        {callers
                          .filter((c) => c.role === "caller")
                          .map((caller) => (
                            <SelectItem key={caller.id} value={caller.id}>
                              {caller.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Min Value</label>
                    <Input
                      type="number"
                      placeholder="e.g. 1000000"
                      value={valueRange.min}
                      onChange={(e) => setValueRange((prev) => ({ ...prev, min: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Max Value</label>
                    <Input
                      type="number"
                      placeholder="e.g. 50000000"
                      value={valueRange.max}
                      onChange={(e) => setValueRange((prev) => ({ ...prev, max: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {selectedLeads.length > 0 && (
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">{selectedLeads.length} selected</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <UserPlus className="w-4 h-4" />
                        Assign To
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {callers
                        .filter((c) => c.role === "caller")
                        .map((caller) => (
                          <DropdownMenuItem key={caller.id} onClick={() => handleBulkAssign(caller.id)}>
                            {caller.name}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <TrendingUp className="w-4 h-4" />
                        Change Stage
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkStageChange("new")}>New Lead</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStageChange("qualified")}>Qualified</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStageChange("proposal")}>Proposal</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStageChange("negotiation")}>
                        Negotiation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStageChange("won")}>Closed Won</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStageChange("lost")}>Closed Lost</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <Flame className="w-4 h-4" />
                        Change Priority
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkPriorityChange("hot")}>Hot</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkPriorityChange("warm")}>Warm</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkPriorityChange("cold")}>Cold</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <DuplicateDetector leads={leads} onMergeDuplicates={handleMergeDuplicates} />

        {viewMode === "list" ? (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    {visibleColumns.srNo && <TableHead className="w-16">Sr No</TableHead>}
                    {visibleColumns.lead && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("name")}
                          className="gap-2 h-auto p-0 hover:bg-transparent"
                        >
                          Lead
                          <ArrowUpDown className="w-3 h-3" />
                        </Button>
                      </TableHead>
                    )}
                    <TableHead>Score</TableHead>
                    {visibleColumns.phone && <TableHead>Phone</TableHead>}
                    {visibleColumns.contact && <TableHead>Call/Whatsapp/Copy</TableHead>}
                    {visibleColumns.value && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("value")}
                          className="gap-2 h-auto p-0 hover:bg-transparent"
                        >
                          Value
                          <ArrowUpDown className="w-3 h-3" />
                        </Button>
                      </TableHead>
                    )}
                    {visibleColumns.stage && (
                      <TableHead>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 h-auto p-0 hover:bg-transparent">
                              Stage
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Filter by Stage</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "all"}
                              onCheckedChange={() => setStageFilter("all")}
                            >
                              All Stages
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "new"}
                              onCheckedChange={() => setStageFilter("new")}
                            >
                              New Lead
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "qualified"}
                              onCheckedChange={() => setStageFilter("qualified")}
                            >
                              Qualified
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "proposal"}
                              onCheckedChange={() => setStageFilter("proposal")}
                            >
                              Proposal
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "negotiation"}
                              onCheckedChange={() => setStageFilter("negotiation")}
                            >
                              Negotiation
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "won"}
                              onCheckedChange={() => setStageFilter("won")}
                            >
                              Closed Won
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "lost"}
                              onCheckedChange={() => setStageFilter("lost")}
                            >
                              Closed Lost
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
                    )}
                    {visibleColumns.priority && (
                      <TableHead>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 h-auto p-0 hover:bg-transparent">
                              Priority
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                              checked={priorityFilter === "all"}
                              onCheckedChange={() => setPriorityFilter("all")}
                            >
                              All Priorities
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={priorityFilter === "hot"}
                              onCheckedChange={() => setPriorityFilter("hot")}
                            >
                              🔥 Hot
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={priorityFilter === "warm"}
                              onCheckedChange={() => setPriorityFilter("warm")}
                            >
                              🟡 Warm
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={priorityFilter === "cold"}
                              onCheckedChange={() => setPriorityFilter("cold")}
                            >
                              ❄️ Cold
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
                    )}
                    {visibleColumns.source && (
                      <TableHead>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 h-auto p-0 hover:bg-transparent">
                              Source
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Filter by Source</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                              checked={sourceFilter === "all"}
                              onCheckedChange={() => setSourceFilter("all")}
                            >
                              All Sources
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={sourceFilter === "website"}
                              onCheckedChange={() => setSourceFilter("website")}
                            >
                              Website
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={sourceFilter === "referral"}
                              onCheckedChange={() => setSourceFilter("referral")}
                            >
                              Referral
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={sourceFilter === "social_media"}
                              onCheckedChange={() => setSourceFilter("social_media")}
                            >
                              Social Media
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={sourceFilter === "google_ads"}
                              onCheckedChange={() => setSourceFilter("google_ads")}
                            >
                              Google Ads
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={sourceFilter === "walk_in"}
                              onCheckedChange={() => setSourceFilter("walk_in")}
                            >
                              Walk-in
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
                    )}
                    {visibleColumns.status && (
                      <TableHead>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 h-auto p-0 hover:bg-transparent">
                              Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                              checked={statusFilter === "all"}
                              onCheckedChange={() => setStatusFilter("all")}
                            >
                              All Statuses
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={statusFilter === "active"}
                              onCheckedChange={() => setStatusFilter("active")}
                            >
                              Active
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={statusFilter === "inactive"}
                              onCheckedChange={() => setStatusFilter("inactive")}
                            >
                              Inactive
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={statusFilter === "pending"}
                              onCheckedChange={() => setStatusFilter("pending")}
                            >
                              Pending
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
                    )}
                    {visibleColumns.category && (
                      <TableHead>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 h-auto p-0 hover:bg-transparent">
                              Category
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                              checked={categoryFilter === "all"}
                              onCheckedChange={() => setCategoryFilter("all")}
                            >
                              All Categories
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={categoryFilter === "property"}
                              onCheckedChange={() => setCategoryFilter("property")}
                            >
                              Property
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={categoryFilter === "loans"}
                              onCheckedChange={() => setCategoryFilter("loans")}
                            >
                              Loans
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={categoryFilter === "other"}
                              onCheckedChange={() => setCategoryFilter("other")}
                            >
                              Other
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
                    )}
                    {visibleColumns.subcategory && (
                      <TableHead>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 h-auto p-0 hover:bg-transparent">
                              Subcategory
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Filter by Subcategory</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                              checked={subcategoryFilter === "all"}
                              onCheckedChange={() => setSubcategoryFilter("all")}
                            >
                              All Subcategories
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={subcategoryFilter === "india_property"}
                              onCheckedChange={() => setSubcategoryFilter("india_property")}
                            >
                              India Property
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={subcategoryFilter === "australia_property"}
                              onCheckedChange={() => setSubcategoryFilter("australia_property")}
                            >
                              Australia Property
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={subcategoryFilter === "dubai_property"}
                              onCheckedChange={() => setSubcategoryFilter("dubai_property")}
                            >
                              Dubai Property
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={subcategoryFilter === "personal_loan"}
                              onCheckedChange={() => setSubcategoryFilter("personal_loan")}
                            >
                              Personal Loan
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={subcategoryFilter === "home_loan"}
                              onCheckedChange={() => setSubcategoryFilter("home_loan")}
                            >
                              Home Loan
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={subcategoryFilter === "business_loan"}
                              onCheckedChange={() => setSubcategoryFilter("business_loan")}
                            >
                              Business Loan
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={subcategoryFilter === "other"}
                              onCheckedChange={() => setSubcategoryFilter("other")}
                            >
                              Other
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
                    )}
                    {visibleColumns.assignedTo && (
                      <TableHead>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 h-auto p-0 hover:bg-transparent">
                              Assigned To
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Filter by Caller</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                              checked={callerFilter === "all"}
                              onCheckedChange={() => setCallerFilter("all")}
                            >
                              All Callers
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={callerFilter === "Not Assigned"}
                              onCheckedChange={() => setCallerFilter("Not Assigned")}
                            >
                              Not Assigned
                            </DropdownMenuCheckboxItem>
                            {callers
                              .filter((c) => c.role === "caller")
                              .map((caller) => (
                                <DropdownMenuCheckboxItem
                                  key={caller.id}
                                  checked={callerFilter === caller.id}
                                  onCheckedChange={() => setCallerFilter(caller.id)}
                                >
                                  {caller.name}
                                </DropdownMenuCheckboxItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
                    )}
                    {visibleColumns.nextFollowUp && <TableHead>Next Follow-up</TableHead>}
                    {visibleColumns.notes && <TableHead>Notes</TableHead>}
                    {visibleColumns.createdAt && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("createdAt")}
                          className="gap-2 h-auto p-0 hover:bg-transparent"
                        >
                          Created
                          <ArrowUpDown className="w-3 h-3" />
                        </Button>
                      </TableHead>
                    )}
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead, index) => {
                    const isOverdue = lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date()
                    const isToday =
                      lead.nextFollowUp && new Date(lead.nextFollowUp).toDateString() === new Date().toDateString()
                    const leadScore = calculateLeadScore(lead)

                    return (
                      <TableRow
                        key={lead.id}
                        className={cn(
                          "hover:bg-muted/50 transition-colors cursor-pointer",
                          isOverdue && "bg-destructive/5",
                        )}
                        onClick={() => openLeadDetail(lead)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedLeads.includes(lead.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLeads((prev) => [...prev, lead.id])
                              } else {
                                setSelectedLeads((prev) => prev.filter((id) => id !== lead.id))
                              }
                            }}
                          />
                        </TableCell>
                        {visibleColumns.srNo && (
                          <TableCell>
                            <span className="text-sm text-muted-foreground font-medium">{index + 1}</span>
                          </TableCell>
                        )}
                        {visibleColumns.lead && (
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center relative">
                                <span className="text-sm font-medium text-accent-foreground">
                                  {lead.name.charAt(0)}
                                </span>
                                {(isOverdue || isToday) && (
                                  <div
                                    className={cn(
                                      "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                                      isOverdue ? "bg-destructive" : "bg-success",
                                    )}
                                  />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{lead.name}</p>
                                <p className="text-sm text-muted-foreground">{lead.city}</p>
                              </div>
                            </div>
                          </TableCell>
                        )}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <LeadScoreIndicator score={leadScore} size="sm" />
                        </TableCell>
                        {visibleColumns.phone && (
                          <TableCell>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyPhone(lead.phone)
                              }}
                              className="text-sm font-medium text-foreground whitespace-nowrap hover:text-primary cursor-pointer transition-colors"
                              title="Click to copy"
                            >
                              {lead.phone}
                            </button>
                          </TableCell>
                        )}
                        {visibleColumns.contact && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(`tel:${lead.phone}`)}
                              >
                                <Phone className="w-4 h-4 text-success" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\s/g, "")}`)}
                              >
                                <MessageCircle className="w-4 h-4 text-success" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyPhone(lead.phone)}
                              >
                                <Copy className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.value && (
                          <TableCell>
                            <span className="font-semibold text-foreground">{formatCurrency(lead.value)}</span>
                          </TableCell>
                        )}
                        {visibleColumns.stage && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={lead.stage}
                              onValueChange={(value) => handleStageChange(lead.id, value as LeadStage)}
                            >
                              <SelectTrigger className="w-[140px] h-8 border-0 bg-transparent p-0 [&>svg]:hidden">
                                <StageBadge stage={lead.stage} size="sm" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New Lead</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="proposal">Proposal</SelectItem>
                                <SelectItem value="negotiation">Negotiation</SelectItem>
                                <SelectItem value="won">Closed Won</SelectItem>
                                <SelectItem value="lost">Closed Lost</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                        {visibleColumns.priority && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={lead.priority}
                              onValueChange={(value) => handlePriorityChange(lead.id, value as LeadPriority)}
                            >
                              <SelectTrigger className="w-[100px] h-8 border-0 bg-transparent p-0 [&>svg]:hidden">
                                <PriorityBadge priority={lead.priority} size="sm" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hot">Hot</SelectItem>
                                <SelectItem value="warm">Warm</SelectItem>
                                <SelectItem value="cold">Cold</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                        {visibleColumns.source && (
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{leadSourceLabels[lead.source]}</span>
                          </TableCell>
                        )}
                        {visibleColumns.status && (
                          <TableCell>
                            <StatusBadge status={lead.status} size="sm" />
                          </TableCell>
                        )}
                        {/* Added Category column cell */}
                        {visibleColumns.category && (
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{leadCategoryLabels[lead.category]}</span>
                          </TableCell>
                        )}
                        {/* Added Subcategory column cell */}
                        {visibleColumns.subcategory && (
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {leadSubcategoryLabels[lead.subcategory]}
                            </span>
                          </TableCell>
                        )}
                        {visibleColumns.assignedTo && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <span className="text-sm text-foreground">{lead.assignedCallerName || "-"}</span>
                          </TableCell>
                        )}
                        {visibleColumns.nextFollowUp && (
                          <TableCell>
                            {lead.nextFollowUp ? (
                              <div className="space-y-1">
                                {lead.followUpReason && (
                                  <p className="text-sm font-medium text-foreground line-clamp-1">
                                    {lead.followUpReason}
                                  </p>
                                )}
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    isOverdue ? "text-destructive" : isToday ? "text-success" : "text-foreground",
                                  )}
                                >
                                  {format(parseISO(lead.nextFollowUp), "dd MMM yyyy, hh:mm a")}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.notes && (
                          <TableCell>
                            {lead.notes ? (
                              <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                                {getFirstLineOfNotes(lead.notes)}
                              </p>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.createdAt && (
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {format(parseISO(lead.createdAt), "dd MMM yyyy")}
                            </span>
                          </TableCell>
                        )}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openLeadDetail(lead)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openLeadDetail(lead)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Lead
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedLead(lead)
                                  setDetailDrawerOpen(true)
                                }}
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                Log Call
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={async () => {
                                  try {
                                    await deleteLead(lead.id)
                                    setLeads((prev) => prev.filter((l) => l.id !== lead.id))
                                    toast({ title: "Lead deleted", description: `Lead ${lead.name} has been removed` })
                                  } catch (error) {
                                    console.error("[v0] Error deleting lead:", error)
                                    toast({
                                      title: "Error",
                                      description: "Failed to delete lead",
                                      variant: "destructive",
                                    })
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {filteredLeads.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No leads found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or add new leads</p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => {
              const isOverdue = lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date()
              const isToday =
                lead.nextFollowUp && new Date(lead.nextFollowUp).toDateString() === new Date().toDateString()

              return (
                <Card
                  key={lead.id}
                  className={cn(
                    "hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer",
                    isOverdue && "border-destructive",
                  )}
                  onClick={() => openLeadDetail(lead)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center relative">
                          <span className="font-medium text-accent-foreground">{lead.name.charAt(0)}</span>
                          {(isOverdue || isToday) && (
                            <div
                              className={cn(
                                "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                                isOverdue ? "bg-destructive" : "bg-success",
                              )}
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.city}</p>
                        </div>
                      </div>
                      <PriorityBadge priority={lead.priority} size="sm" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Value</span>
                        <span className="font-semibold text-foreground">{formatCurrency(lead.value)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Stage</span>
                        <StageBadge stage={lead.stage} size="sm" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <StatusBadge status={lead.status} size="sm" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Source</span>
                        <span className="text-sm text-foreground">{leadSourceLabels[lead.source]}</span>
                      </div>
                      {/* Added Category and Subcategory to grid view */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Category</span>
                        <span className="text-sm text-foreground">{leadCategoryLabels[lead.category]}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Subcategory</span>
                        <span className="text-sm text-foreground">{leadSubcategoryLabels[lead.subcategory]}</span>
                      </div>
                      {lead.nextFollowUp && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Follow-up</span>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isOverdue ? "text-destructive" : isToday ? "text-success" : "text-foreground",
                            )}
                          >
                            {format(parseISO(lead.nextFollowUp), "dd MMM")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-2 mt-4 pt-4 border-t border-border"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 bg-transparent"
                        onClick={() => window.open(`tel:${lead.phone}`)}
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 bg-transparent"
                        onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\s/g, "")}`)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {filteredLeads.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No leads found</p>
                <p className="text-sm mt-1">Try adjusting your filters or add new leads</p>
              </div>
            )}
          </div>
        )}

        <ImportLeadsDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImportLeads} />

        <LeadDetailDrawer
          lead={selectedLead}
          open={detailDrawerOpen}
          onOpenChange={setDetailDrawerOpen}
          onUpdateLead={handleUpdateLead}
        />

        <IntegrationImportDialog
          open={integrationDialogOpen}
          onOpenChange={setIntegrationDialogOpen}
          onImport={handleImportLeads}
        />

        <AddLeadDialog open={addLeadDialogOpen} onOpenChange={setAddLeadDialogOpen} onAddLead={handleAddLead} />

        <BulkCampaignDialog
          isOpen={bulkCampaignDialogOpen}
          onOpenChange={setBulkCampaignDialogOpen}
          selectedLeads={selectedLeads}
          onSend={handleBulkCampaign}
        />

        {/* Floating Action Menu for mobile */}
        <div className="md:hidden">
          <FloatingActionMenu
            onAddLead={() => setAddLeadDialogOpen(true)}
            onImport={() => setImportDialogOpen(true)}
            onExport={exportLeads}
            onFilter={() => setShowAdvancedFilters(!showAdvancedFilters)}
            onBulkDelete={() => {
              if (selectedLeads.length > 0) {
                setSelectedLeads([])
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default Leads
