"use client"

import { useState, useEffect } from "react"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  Users,
  Trophy,
  Calendar,
  Flame,
  IndianRupee,
  Clock,
  Target,
  Sparkles,
  ArrowUpRight,
  Plus,
  UserPlus,
  PhoneCall,
  Eye,
  ChevronRight,
  ActivityIcon,
  Zap,
  TrendingDown,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Progress } from "@/components/ui/progress"
import { PriorityBadge } from "@/components/ui/stage-badge"
import { fetchDashboardStats, fetchLeads, fetchActivities, fetchCallers, fetchCallLogs } from "@/lib/api"
import type { DashboardStats, Lead, Caller, CallLog, Activity } from "@/types/crm"
import { formatCurrency } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [activitiesData, setActivitiesData] = useState<Activity[]>([])
  const [callers, setCallers] = useState<Caller[]>([])
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("[v0] Fetching dashboard data...")
        const [statsData, leadsData, activitiesData, callersData, callLogsData] = await Promise.all([
          fetchDashboardStats(),
          fetchLeads(),
          fetchActivities(),
          fetchCallers(),
          fetchCallLogs(),
        ])

        console.log("[v0] Dashboard stats received:", statsData)
        console.log("[v0] Leads count:", leadsData.length)
        console.log("[v0] Active Leads:", statsData?.activeLeads)
        console.log("[v0] Hot Leads:", statsData?.hotLeads)
        console.log("[v0] Deals Closed:", statsData?.dealsClosed)
        console.log("[v0] Pipeline Value:", statsData?.pipelineValue)

        setStats(statsData)
        setLeads(leadsData)
        setActivitiesData(activitiesData)
        setCallers(callersData)
        setCallLogs(callLogsData)
      } catch (error) {
        console.error("[v0] Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">No dashboard data available</p>
        </div>
      </div>
    )
  }

  const stageDistribution = [
    { name: "New Lead", value: leads.filter((l) => l.stage === "new").length, color: "#0EA5E9" },
    { name: "Qualified", value: leads.filter((l) => l.stage === "qualified").length, color: "#8B5CF6" },
    { name: "Proposal", value: leads.filter((l) => l.stage === "proposal").length, color: "#F59E0B" },
    { name: "Negotiation", value: leads.filter((l) => l.stage === "negotiation").length, color: "#F97316" },
    { name: "Won", value: leads.filter((l) => l.stage === "won").length, color: "#22C55E" },
    { name: "Lost", value: leads.filter((l) => l.stage === "lost").length, color: "#EF4444" },
  ]

  const priorityDistribution = [
    { name: "Hot", value: leads.filter((l) => l.priority === "hot" && l.status === "active").length, color: "#EF4444" },
    {
      name: "Warm",
      value: leads.filter((l) => l.priority === "warm" && l.status === "active").length,
      color: "#F59E0B",
    },
    {
      name: "Cold",
      value: leads.filter((l) => l.priority === "cold" && l.status === "active").length,
      color: "#0EA5E9",
    },
  ]

  const sourceDistribution = [
    { name: "Website", value: leads.filter((l) => l.source === "website").length, color: "#8B5CF6" },
    { name: "Google Ads", value: leads.filter((l) => l.source === "google_ads").length, color: "#F59E0B" },
    { name: "Referral", value: leads.filter((l) => l.source === "referral").length, color: "#22C55E" },
    { name: "Social Media", value: leads.filter((l) => l.source === "social_media").length, color: "#0EA5E9" },
    { name: "Walk-in", value: leads.filter((l) => l.source === "walk_in").length, color: "#F97316" },
    { name: "Other", value: leads.filter((l) => l.source === "other").length, color: "#64748B" },
  ]

  const callerPerformanceData = callers
    .filter((c) => c.role === "caller")
    .map((caller) => {
      const callerLeads = leads.filter((l) => l.assignedCaller === caller.id)
      const callerCalls = callLogs.filter((c) => c.callerId === caller.id)
      return {
        caller: caller.name.split(" ")[0],
        leads: callerLeads.length,
        calls: callerCalls.length,
        won: callerLeads.filter((l) => l.stage === "won").length,
        conversion:
          callerLeads.length > 0
            ? Math.round((callerLeads.filter((l) => l.stage === "won").length / callerLeads.length) * 100)
            : 0,
        avgCallTime:
          callerCalls.length > 0
            ? Math.round(callerCalls.reduce((sum, c) => sum + c.duration, 0) / callerCalls.length / 60)
            : 0,
      }
    })

  const teamMetrics = callers
    .filter((c) => c.role === "caller")
    .map((caller) => {
      const callerLeads = leads.filter((l) => l.assignedCaller === caller.id)
      const callerCalls = callLogs.filter((c) => c.callerId === caller.id)
      const wonLeads = callerLeads.filter((l) => l.stage === "won")
      const conversionRate = callerLeads.length > 0 ? (wonLeads.length / callerLeads.length) * 100 : 0
      const totalRevenue = wonLeads.reduce((sum, l) => sum + l.value, 0)

      return {
        id: caller.id,
        name: caller.name,
        leadsAssigned: callerLeads.length,
        callsMade: callerCalls.length,
        dealsWon: wonLeads.length,
        revenue: totalRevenue,
        conversionRate: conversionRate,
        activeLeads: callerLeads.filter((l) => l.status === "active").length,
        target: 100,
      }
    })

  const upcomingFollowUps = leads
    .filter((l) => l.nextFollowUp)
    .sort((a, b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime())
    .slice(0, 5)

  const conversionFunnel = [
    { stage: "Total Leads", count: leads.length, percentage: 100 },
    {
      stage: "Qualified",
      count: leads.filter((l) => l.stage !== "new").length,
      percentage: Math.round((leads.filter((l) => l.stage !== "new").length / leads.length) * 100),
    },
    {
      stage: "Proposal",
      count: leads.filter((l) => ["proposal", "negotiation", "won"].includes(l.stage)).length,
      percentage: Math.round(
        (leads.filter((l) => ["proposal", "negotiation", "won"].includes(l.stage)).length / leads.length) * 100,
      ),
    },
    {
      stage: "Negotiation",
      count: leads.filter((l) => ["negotiation", "won"].includes(l.stage)).length,
      percentage: Math.round(
        (leads.filter((l) => ["negotiation", "won"].includes(l.stage)).length / leads.length) * 100,
      ),
    },
    {
      stage: "Closed Won",
      count: leads.filter((l) => l.stage === "won").length,
      percentage: Math.round((leads.filter((l) => l.stage === "won").length / leads.length) * 100),
    },
  ]

  const quickActions = [
    { icon: UserPlus, label: "Add Lead", color: "bg-primary", href: "/leads" },
    { icon: PhoneCall, label: "Log Call", color: "bg-secondary", href: "/leads" },
    { icon: Calendar, label: "Schedule", color: "bg-success", href: "/leads" },
    { icon: Eye, label: "View Reports", color: "bg-info", href: "/reports" },
  ]

  const statsCards = [
    {
      title: "Active Leads",
      value: stats.activeLeads || 0,
      change: stats.lastMonthActiveLeads
        ? `+${Math.round(((stats.activeLeads - stats.lastMonthActiveLeads) / stats.lastMonthActiveLeads) * 100)}% from last month`
        : "+0% from last month",
      icon: Users,
      color: "bg-gradient-to-br from-indigo-500 to-purple-600",
    },
    {
      title: "Hot Leads",
      value: stats.hotLeads || 0,
      change: stats.hotLeadsThisWeek ? `+${stats.hotLeadsThisWeek} this week` : "+0 this week",
      icon: Flame,
      color: "bg-gradient-to-br from-orange-500 to-red-600",
    },
    {
      title: "Deals Closed",
      value: stats.dealsClosed || 0,
      change: stats.thisMonthDeals ? `${stats.thisMonthDeals} this month` : "0 this month",
      icon: Trophy,
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
    },
    {
      title: "Pipeline Value",
      value: `₹${((stats.pipelineValue || 0) / 10000000).toFixed(1)}Cr`,
      change: stats.lastMonthPipelineValue
        ? `+${Math.round(((stats.pipelineValue - stats.lastMonthPipelineValue) / stats.lastMonthPipelineValue) * 100)}% from last month`
        : "+0% from last month",
      icon: IndianRupee,
      color: "bg-gradient-to-br from-amber-500 to-orange-600",
    },
  ]

  const trendData = stats.trendData || []
  const revenueData = stats.revenueData || []

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "created":
        return <UserPlus className="w-4 h-4" />
      case "assigned":
        return <Users className="w-4 h-4" />
      case "stage_changed":
        return <ArrowUpRight className="w-4 h-4" />
      case "call_logged":
        return <PhoneCall className="w-4 h-4" />
      case "note_added":
        return <Clock className="w-4 h-4" />
      default:
        return <ActivityIcon className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "created":
        return "bg-blue-500/10 text-blue-600"
      case "assigned":
        return "bg-purple-500/10 text-purple-600"
      case "stage_changed":
        return "bg-green-500/10 text-green-600"
      case "call_logged":
        return "bg-orange-500/10 text-orange-600"
      case "note_added":
        return "bg-gray-500/10 text-gray-600"
      default:
        return "bg-primary/10 text-primary"
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            Welcome Back!
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-secondary" />
            Here's what's happening with your real estate business today
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
            <Calendar className="w-4 h-4" />
            Today
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-primary/80">
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            change={card.change}
            changeType={card.change.startsWith("+") ? "positive" : "negative"}
            icon={card.icon}
            gradient
            gradientColors={card.color}
          />
        ))}
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Quick Actions
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="flex flex-col items-center gap-3 p-4 rounded-xl bg-background/80 backdrop-blur-sm border border-border hover:border-primary/50 hover:shadow-lg transition-all group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Activity Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Lead & Call Activity
              </CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Leads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-muted-foreground">Calls</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-muted-foreground">Conversions</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "var(--shadow-lg)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(234, 89%, 34%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(234, 89%, 34%)", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="hsl(38, 92%, 50%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(38, 92%, 50%)", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(142, 76%, 36%)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Status */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Pipeline Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {stageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {stageDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activitiesData.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 group">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground group-hover:text-primary transition-colors">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{activity.userName || "System"}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {activitiesData.length === 0 && (
                <div className="text-center py-8">
                  <ActivityIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel - moved to sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Target className="w-4 h-4 text-primary" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionFunnel.map((stage, index) => (
                <div key={stage.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{stage.stage}</span>
                    <span className="text-xs font-semibold text-primary">{stage.percentage}%</span>
                  </div>
                  <Progress value={stage.percentage} className="h-2" />
                  {index < conversionFunnel.length - 1 && (
                    <div className="flex justify-end">
                      <ArrowUpRight className="w-3 h-3 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-success" />
              Revenue Growth (Lakhs)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-info" />
              Team Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={callerPerformanceData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="caller" className="text-xs" />
                <PolarRadiusAxis className="text-xs" />
                <Radar
                  name="Leads"
                  dataKey="leads"
                  stroke="hsl(234, 89%, 34%)"
                  fill="hsl(234, 89%, 34%)"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Calls"
                  dataKey="calls"
                  stroke="hsl(38, 92%, 50%)"
                  fill="hsl(38, 92%, 50%)"
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Team Performance Metrics
            </CardTitle>
            <Button size="sm" variant="ghost" className="gap-2">
              View All <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMetrics.map((member, index) => (
              <div
                key={member.id}
                className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{member.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        {member.name}
                        {index === 0 && <Trophy className="w-4 h-4 text-secondary" />}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.leadsAssigned} leads assigned • {member.callsMade} calls made
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-success">{member.dealsWon}</p>
                    <p className="text-xs text-muted-foreground">Deals Won</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Conversion</p>
                    <p className="text-sm font-semibold text-primary">{member.conversionRate.toFixed(1)}%</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                    <p className="text-sm font-semibold text-success">{formatCurrency(member.revenue)}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Active</p>
                    <p className="text-sm font-semibold text-info">{member.activeLeads}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Call Rate</p>
                    <p className="text-sm font-semibold text-secondary">
                      {member.callsMade > 0 ? (member.callsMade / member.leadsAssigned).toFixed(1) : "0"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Target Progress</span>
                    <span className="font-medium text-foreground">{member.conversionRate.toFixed(0)}% of target</span>
                  </div>
                  <Progress value={member.conversionRate} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sourceDistribution.map((source) => (
                <div
                  key={source.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{source.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      {source.value > 0 ? (
                        <TrendingUp className="w-3 h-3 text-success" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-destructive" />
                      )}
                      {source.value > 0 ? "+" : "-"}
                      {source.value}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{source.value}</p>
                    <p className="text-xs text-muted-foreground">leads</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Follow-ups */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              Upcoming Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingFollowUps.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-sm font-medium text-accent-foreground">{lead.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.projectName || "No project"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={lead.priority} size="sm" />
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(lead.nextFollowUp!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-xs text-muted-foreground">{lead.assignedCallerName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
