"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { fetchCallers, fetchLeads, fetchCallLogs, createCaller } from "@/lib/api"
import type { Caller } from "@/types/crm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, PhoneIcon, Mail, Users, UserCheck, UserX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { CallerPerformanceDrawer } from "@/components/callers/CallerPerformanceDrawer"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, Award, ActivityIcon } from "lucide-react"

const Callers = () => {
  const [callers, setCallers] = useState<Caller[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [callLogs, setCallLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCaller, setEditingCaller] = useState<Caller | null>(null)
  const [performanceDrawerOpen, setPerformanceDrawerOpen] = useState(false)
  const [selectedCallerForPerformance, setSelectedCallerForPerformance] = useState<Caller | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "caller" as "caller" | "admin",
    password: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [callersData, leadsData, callLogsData] = await Promise.all([fetchCallers(), fetchLeads(), fetchCallLogs()])
      console.log("[v0] Callers loaded:", callersData)
      setCallers(callersData)
      setLeads(leadsData)
      setCallLogs(callLogsData)
    } catch (error) {
      console.error("[v0] Error loading callers data:", error)
      toast({
        title: "Error loading data",
        description: "Failed to fetch callers data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredCallers = callers.filter(
    (caller) =>
      caller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caller.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getAssignedLeadsCount = (callerId: string) => {
    return leads.filter((lead) => lead.assignedCaller === callerId).length
  }

  const getCallerMetrics = (callerId: string) => {
    const callerLeads = leads.filter((l) => l.assignedCaller === callerId)
    const callerCalls = callLogs.filter((c) => c.callerId === callerId)
    const wonLeads = callerLeads.filter((l) => l.stage === "won")
    const todayDate = new Date().toISOString().split("T")[0]
    const todayLeads = callerLeads.filter((l) => l.createdAt.startsWith(todayDate))
    const todayCalls = callerCalls.filter((c) => c.createdAt && c.createdAt.startsWith(todayDate))
    const totalRevenue = wonLeads.reduce((sum, l) => sum + l.value, 0)
    const conversionRate = callerLeads.length > 0 ? (wonLeads.length / callerLeads.length) * 100 : 0

    return {
      totalLeads: callerLeads.length,
      totalCalls: callerCalls.length,
      dealsWon: wonLeads.length,
      todayLeads: todayLeads.length,
      todayCalls: todayCalls.length,
      revenue: totalRevenue,
      conversionRate: conversionRate,
    }
  }

  const callerPerformanceData = callers
    .filter((c) => c.role === "caller")
    .map((caller) => {
      const metrics = getCallerMetrics(caller.id)
      return {
        name: caller.name.split(" ")[0],
        calls: metrics.todayCalls,
        leads: metrics.todayLeads,
        deals: metrics.dealsWon,
      }
    })

  const handleToggleStatus = (callerId: string) => {
    setCallers((prev) =>
      prev.map((caller) =>
        caller.id === callerId ? { ...caller, status: caller.status === "active" ? "inactive" : "active" } : caller,
      ),
    )
    toast({ title: "Status updated" })
  }

  const handleViewPerformance = (caller: Caller) => {
    setSelectedCallerForPerformance(caller)
    setPerformanceDrawerOpen(true)
  }

  const handleOpenDialog = (caller?: Caller) => {
    if (caller) {
      setEditingCaller(caller)
      setFormData({
        name: caller.name,
        username: caller.username,
        email: caller.email,
        phone: caller.phone,
        role: caller.role,
        password: "", // Password field for editing
      })
    } else {
      setEditingCaller(null)
      setFormData({ name: "", username: "", email: "", phone: "", role: "caller", password: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingCaller) {
      // Edit existing caller (not implemented in backend yet)
      setCallers((prev) => prev.map((c) => (c.id === editingCaller.id ? { ...c, ...formData } : c)))
      toast({ title: "Caller updated successfully" })
    } else {
      // Create new caller
      try {
        const newCaller = await createCaller(formData)
        setCallers((prev) => [...prev, newCaller])
        toast({ title: "Caller created successfully" })
      } catch (error) {
        console.error("[v0] Error creating caller:", error)
        toast({
          title: "Error creating caller",
          description: "Failed to create caller",
          variant: "destructive",
        })
        return
      }
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      email: "",
      phone: "",
      role: "caller",
      password: "",
    })
    setEditingCaller(null)
  }

  const stats = {
    total: callers.length,
    active: callers.filter((c) => c.status === "active").length,
    inactive: callers.filter((c) => c.status === "inactive").length,
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Callers / Agents</h1>
          <p className="text-muted-foreground mt-1">Manage your sales team members</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient-primary gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Add Caller
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCaller ? "Edit Caller" : "Add New Caller"}</DialogTitle>
              <DialogDescription>
                {editingCaller ? "Update caller details" : "Create a new caller account"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password {!editingCaller && "*"}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={editingCaller ? "Leave blank to keep current" : "Min. 6 characters"}
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                />
                {!editingCaller && (
                  <p className="text-xs text-muted-foreground">Caller will use this password to log in</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value as "caller" | "admin" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caller">Caller</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="btn-gradient-primary">
                {editingCaller ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Callers</p>
                <p className="text-2xl font-bold font-display">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold font-display">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <UserX className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold font-display">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ActivityIcon className="w-4 h-4" />
            Today's Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={callerPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="leads" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deals" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search callers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Caller</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Today's Activity</TableHead>
                <TableHead>Total Leads</TableHead>
                <TableHead>Deals Won</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCallers.map((caller) => {
                const metrics = getCallerMetrics(caller.id)
                return (
                  <TableRow key={caller.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            caller.status === "active" ? "bg-success/10" : "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "text-sm font-medium",
                              caller.status === "active" ? "text-success" : "text-muted-foreground",
                            )}
                          >
                            {caller.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <button
                            onClick={() => handleViewPerformance(caller)}
                            className="font-medium text-foreground hover:text-primary hover:underline transition-colors text-left"
                          >
                            {caller.name}
                          </button>
                          <p className="text-sm text-muted-foreground">{caller.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{caller.username}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(`mailto:${caller.email}`)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(`tel:${caller.phone}`)}
                        >
                          <PhoneIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={caller.role === "admin" ? "default" : "secondary"}>
                        {caller.role === "admin" ? "Admin" : "Caller"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{metrics.todayLeads} imports</span>
                        <span className="text-xs text-muted-foreground">{metrics.todayCalls} calls</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{metrics.totalLeads}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-success" />
                        <span className="font-medium text-success">{metrics.dealsWon}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {metrics.conversionRate >= 20 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                        <span
                          className={cn(
                            "font-medium",
                            metrics.conversionRate >= 20 ? "text-success" : "text-muted-foreground",
                          )}
                        >
                          {metrics.conversionRate.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-primary">{formatCurrency(metrics.revenue)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={caller.status === "active" ? "default" : "secondary"}
                        className={cn(
                          "cursor-pointer",
                          caller.status === "active"
                            ? "bg-success/10 text-success hover:bg-success/20 border border-success/20"
                            : "bg-muted text-muted-foreground",
                        )}
                        onClick={() => handleToggleStatus(caller.id)}
                      >
                        {caller.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary"
                          onClick={() => setSelectedCallerForPerformance(caller) || setPerformanceDrawerOpen(true)}
                        >
                          <ActivityIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleOpenDialog(caller)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CallerPerformanceDrawer
        caller={selectedCallerForPerformance}
        open={performanceDrawerOpen}
        onOpenChange={setPerformanceDrawerOpen}
      />
    </div>
  )
}

export default Callers
