"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Lead, LeadStage, LeadPriority, CallbackReason, NotInterestedReason } from "@/types/crm"
import { leadSourceLabels, mockCallLogs, mockActivities as allActivities } from "@/data/mockData"
import { useToast } from "@/hooks/use-toast"
import {
  Phone,
  Mail,
  MessageSquare,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  History,
  Plus,
  Save,
  X,
  FileText,
  Check,
  XCircle,
  Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface LeadDetailDrawerProps {
  lead: Lead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateLead: (updatedLead: Lead) => void
}

export function LeadDetailDrawer({ lead, open, onOpenChange, onUpdateLead }: LeadDetailDrawerProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("details")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [isLoggingCall, setIsLoggingCall] = useState(false)
  const [showCallbackDialog, setShowCallbackDialog] = useState(false)
  const [showNotInterestedDialog, setShowNotInterestedDialog] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: lead?.name || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    city: lead?.city || "",
    value: lead?.value || 0,
    projectName: lead?.projectName || "",
  })

  const [callForm, setCallForm] = useState({
    type: "outbound" as "inbound" | "outbound",
    duration: "",
    notes: "",
    nextFollowUp: "",
  })

  const [callbackForm, setCallbackForm] = useState({
    reason: "" as CallbackReason | "",
    scheduledDate: "",
    scheduledTime: "",
    note: "",
  })

  const [notInterestedForm, setNotInterestedForm] = useState({
    reason: "" as NotInterestedReason | "",
    note: "",
  })

  const handleStartEdit = () => {
    setEditForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      city: lead.city,
      value: lead.value,
      projectName: lead.projectName || "",
    })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      city: lead.city,
      value: lead.value,
      projectName: lead.projectName || "",
    })
  }

  const handleSaveEdit = () => {
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      toast({
        title: "Missing fields",
        description: "Name, email, and phone are required",
        variant: "destructive",
      })
      return
    }

    const updatedLead = {
      ...lead,
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      city: editForm.city,
      value: editForm.value,
      projectName: editForm.projectName,
      updatedAt: new Date().toISOString(),
    }

    onUpdateLead(updatedLead)
    setIsEditing(false)
    toast({ title: "Lead updated", description: "Lead information has been saved" })
  }

  if (!lead) return null

  const leadActivities = allActivities.filter((a) => a.leadId === lead.id)
  const leadCalls = mockCallLogs.filter((c) => c.leadId === lead.id)

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`
    return `₹${value.toLocaleString()}`
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const handleStatusChange = (status: "interested" | "callback" | "not_interested") => {
    if (status === "callback") {
      setShowCallbackDialog(true)
    } else if (status === "not_interested") {
      setShowNotInterestedDialog(true)
    } else {
      onUpdateLead({ ...lead, status, updatedAt: new Date().toISOString() })
      toast({ title: "Status updated", description: "Lead marked as interested" })
    }
  }

  const handleCallbackSubmit = () => {
    if (!callbackForm.reason) {
      toast({ title: "Missing field", description: "Please select a callback reason", variant: "destructive" })
      return
    }

    const scheduledAt =
      callbackForm.scheduledDate && callbackForm.scheduledTime
        ? `${callbackForm.scheduledDate}T${callbackForm.scheduledTime}:00`
        : undefined

    const updatedLead = {
      ...lead,
      status: "callback" as const,
      callbackReason: callbackForm.reason,
      callbackScheduledAt: scheduledAt,
      nextFollowUp: scheduledAt,
      notes: callbackForm.note
        ? lead.notes
          ? `${lead.notes}\n\n[${format(new Date(), "dd MMM yyyy, HH:mm")}]\n${callbackForm.note}`
          : `[${format(new Date(), "dd MMM yyyy, HH:mm")}]\n${callbackForm.note}`
        : lead.notes,
      updatedAt: new Date().toISOString(),
    }

    onUpdateLead(updatedLead)
    setShowCallbackDialog(false)
    setCallbackForm({ reason: "", scheduledDate: "", scheduledTime: "", note: "" })
    toast({ title: "Callback scheduled", description: "Lead marked for callback" })
  }

  const handleNotInterestedSubmit = () => {
    if (!notInterestedForm.reason) {
      toast({ title: "Missing field", description: "Please select a reason", variant: "destructive" })
      return
    }

    const updatedLead = {
      ...lead,
      status: "not_interested" as const,
      notInterestedReason: notInterestedForm.reason,
      notes: notInterestedForm.note
        ? lead.notes
          ? `${lead.notes}\n\n[${format(new Date(), "dd MMM yyyy, HH:mm")}]\n${notInterestedForm.note}`
          : `[${format(new Date(), "dd MMM yyyy, HH:mm")}]\n${notInterestedForm.note}`
        : lead.notes,
      updatedAt: new Date().toISOString(),
    }

    onUpdateLead(updatedLead)
    setShowNotInterestedDialog(false)
    setNotInterestedForm({ reason: "", note: "" })
    toast({ title: "Status updated", description: "Lead marked as not interested" })
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return

    const updatedLead = {
      ...lead,
      notes: lead.notes
        ? `${lead.notes}\n\n[${format(new Date(), "dd MMM yyyy, HH:mm")}]\n${newNote}`
        : `[${format(new Date(), "dd MMM yyyy, HH:mm")}]\n${newNote}`,
      updatedAt: new Date().toISOString(),
    }

    const noteText = newNote.toLowerCase()
    let autoStage = updatedLead.stage
    let autoPriority = updatedLead.priority

    // Auto-qualify if stage is still "new"
    if (updatedLead.stage === "new") {
      autoStage = "qualified"
    }

    // Auto-update priority based on keywords in notes
    if (noteText.includes("urgent") || noteText.includes("asap") || noteText.includes("high")) {
      autoPriority = "high"
    } else if (noteText.includes("low") || noteText.includes("not interested")) {
      autoPriority = "low"
    } else if (noteText.includes("medium") || noteText.includes("moderate")) {
      autoPriority = "medium"
    }

    updatedLead.stage = autoStage
    updatedLead.priority = autoPriority

    onUpdateLead(updatedLead)
    setNewNote("")
    setIsAddingNote(false)

    // Show which fields were auto-updated
    const updates = []
    if (autoStage !== lead.stage) updates.push(`stage to ${autoStage}`)
    if (autoPriority !== lead.priority) updates.push(`priority to ${autoPriority}`)

    if (updates.length > 0) {
      toast({
        title: "Note added & updated",
        description: `Note saved. Auto-updated ${updates.join(" and ")}`,
      })
    } else {
      toast({ title: "Note added", description: "Your note has been saved to the lead" })
    }
  }

  const handleLogCall = () => {
    if (!callForm.duration || !callForm.notes) {
      toast({ title: "Missing fields", description: "Please fill in duration and notes", variant: "destructive" })
      return
    }

    const updatedLead = {
      ...lead,
      nextFollowUp: callForm.nextFollowUp || lead.nextFollowUp,
      updatedAt: new Date().toISOString(),
    }

    onUpdateLead(updatedLead)
    setCallForm({ type: "outbound", duration: "", notes: "", nextFollowUp: "" })
    setIsLoggingCall(false)
    toast({ title: "Call logged", description: "Call has been recorded successfully" })
  }

  const handleStageChange = (newStage: LeadStage) => {
    onUpdateLead({ ...lead, stage: newStage, updatedAt: new Date().toISOString() })
    toast({ title: "Stage updated", description: `Lead stage changed to ${newStage}` })
  }

  const handlePriorityChange = (newPriority: LeadPriority) => {
    onUpdateLead({ ...lead, priority: newPriority, updatedAt: new Date().toISOString() })
    toast({ title: "Priority updated", description: `Lead priority changed to ${newPriority}` })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-6 pb-3 border-b border-border">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-xl font-semibold text-accent-foreground">{lead.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl font-display">{lead.name}</SheetTitle>
                <p className="text-muted-foreground text-sm mt-1">{lead.email}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleStartEdit}>
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Lead Status</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={lead.status === "interested" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "gap-2 transition-all",
                    lead.status === "interested" && "bg-success hover:bg-success/90 text-white border-success",
                  )}
                  onClick={() => handleStatusChange("interested")}
                >
                  <Check className="w-4 h-4" />
                  Interested
                </Button>
                <Button
                  variant={lead.status === "callback" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "gap-2 transition-all",
                    lead.status === "callback" && "bg-info hover:bg-info/90 text-white border-info",
                  )}
                  onClick={() => handleStatusChange("callback")}
                >
                  <Phone className="w-4 h-4" />
                  Callback
                </Button>
                <Button
                  variant={lead.status === "not_interested" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "gap-2 transition-all",
                    lead.status === "not_interested" &&
                      "bg-destructive hover:bg-destructive/90 text-white border-destructive",
                  )}
                  onClick={() => handleStatusChange("not_interested")}
                >
                  <XCircle className="w-4 h-4" />
                  Not Interested
                </Button>
              </div>
            </div>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-6 mt-4 grid grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-6 py-4">
              <TabsContent value="details" className="mt-0 space-y-4">
                {isEditing ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span>Edit Lead Details</span>
                        <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="edit-name" className="text-xs text-muted-foreground mb-1 block">
                            Name *
                          </Label>
                          <Input
                            id="edit-name"
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor="edit-email" className="text-xs text-muted-foreground mb-1 block">
                            Email *
                          </Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-phone" className="text-xs text-muted-foreground mb-1 block">
                            Phone Number *
                          </Label>
                          <Input
                            id="edit-phone"
                            value={editForm.phone}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-city" className="text-xs text-muted-foreground mb-1 block">
                            City
                          </Label>
                          <Input
                            id="edit-city"
                            value={editForm.city}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-value" className="text-xs text-muted-foreground mb-1 block">
                            Deal Value
                          </Label>
                          <Input
                            id="edit-value"
                            type="number"
                            value={editForm.value}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, value: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-project" className="text-xs text-muted-foreground mb-1 block">
                            Project
                          </Label>
                          <Input
                            id="edit-project"
                            value={editForm.projectName}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, projectName: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSaveEdit} className="flex-1 gap-2">
                          <Save className="w-4 h-4" />
                          Save Changes
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline" className="flex-1 bg-transparent">
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Name</p>
                          <p className="text-sm font-medium">{lead.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                          <p className="text-sm font-medium">{lead.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">City</p>
                          <p className="text-sm font-medium">{lead.city}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Deal Value</p>
                          <p className="text-sm font-medium">{formatCurrency(lead.value)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Source</p>
                          <p className="text-sm font-medium">{leadSourceLabels[lead.source]}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Stage</p>
                          <p className="text-sm font-medium capitalize">{lead.stage}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Priority</p>
                          <p className="text-sm font-medium capitalize">{lead.priority}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Assigned Caller</p>
                          <p className="text-sm font-medium">{lead.assignedCallerName || "Not Assigned"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Created Date</p>
                          <p className="text-sm font-medium">{format(new Date(lead.createdAt), "dd MMM yyyy")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Project</p>
                          <p className="text-sm font-medium">{lead.projectName || "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Stage</Label>
                    <Select value={lead.stage} onValueChange={handleStageChange}>
                      <SelectTrigger>
                        <SelectValue />
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
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Priority</Label>
                    <Select value={lead.priority} onValueChange={handlePriorityChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">Hot</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="cold">Cold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <div className="space-y-4">
                  {leadActivities.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No activity recorded yet</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                      {leadActivities.map((activity) => (
                        <div key={activity.id} className="relative pl-10 pb-6">
                          <div
                            className={cn(
                              "absolute left-2.5 w-3 h-3 rounded-full border-2 border-background",
                              activity.type === "created" && "bg-info",
                              activity.type === "assigned" && "bg-primary",
                              activity.type === "stage_changed" && "bg-secondary",
                              activity.type === "call_logged" && "bg-success",
                              activity.type === "note_added" && "bg-warning",
                            )}
                          />
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-sm text-foreground">{activity.description}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{activity.userName}</span>
                              <span>•</span>
                              <span>{format(new Date(activity.createdAt), "dd MMM yyyy, HH:mm")}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="calls" className="mt-0 space-y-4">
                {!isLoggingCall && (
                  <Button onClick={() => setIsLoggingCall(true)} className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    Log New Call
                  </Button>
                )}

                {isLoggingCall && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <span>Log Call</span>
                        <Button variant="ghost" size="icon" onClick={() => setIsLoggingCall(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Call Type</label>
                          <Select
                            value={callForm.type}
                            onValueChange={(v: "inbound" | "outbound") => setCallForm((prev) => ({ ...prev, type: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="outbound">Outbound</SelectItem>
                              <SelectItem value="inbound">Inbound</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Duration (mins)</label>
                          <Input
                            type="number"
                            placeholder="e.g. 15"
                            value={callForm.duration}
                            onChange={(e) => setCallForm((prev) => ({ ...prev, duration: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Next Follow-up</label>
                        <Input
                          type="date"
                          value={callForm.nextFollowUp}
                          onChange={(e) => setCallForm((prev) => ({ ...prev, nextFollowUp: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                        <Textarea
                          placeholder="What was discussed..."
                          value={callForm.notes}
                          onChange={(e) => setCallForm((prev) => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleLogCall} className="w-full gap-2">
                        <Save className="w-4 h-4" />
                        Save Call
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {leadCalls.length === 0 && !isLoggingCall ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <PhoneCall className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No calls logged yet</p>
                  </div>
                ) : (
                  leadCalls.map((call) => (
                    <Card key={call.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                              call.type === "outbound" ? "bg-info/10" : "bg-success/10",
                            )}
                          >
                            {call.type === "outbound" ? (
                              <PhoneOutgoing className="w-5 h-5 text-info" />
                            ) : (
                              <PhoneIncoming className="w-5 h-5 text-success" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground capitalize">{call.type} Call</span>
                              <span className="text-sm text-muted-foreground">{formatDuration(call.duration)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{call.notes}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{call.callerName}</span>
                              <span>•</span>
                              <span>{format(new Date(call.createdAt), "dd MMM yyyy, HH:mm")}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-0 space-y-4">
                {!isAddingNote && (
                  <Button onClick={() => setIsAddingNote(true)} className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    Add Note
                  </Button>
                )}

                {isAddingNote && (
                  <Card>
                    <CardContent className="py-4 space-y-3">
                      <Textarea
                        placeholder="Write your note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={4}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => {
                            setIsAddingNote(false)
                            setNewNote("")
                          }}
                        >
                          Cancel
                        </Button>
                        <Button className="flex-1 gap-2" onClick={handleAddNote}>
                          <Save className="w-4 h-4" />
                          Save Note
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {lead.notes ? (
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-warning" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground whitespace-pre-wrap">{lead.notes}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : !isAddingNote ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No notes added yet</p>
                  </div>
                ) : null}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2 bg-transparent"
                onClick={() => window.open(`tel:${lead.phone}`)}
              >
                <Phone className="w-4 h-4" />
                Call
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 bg-transparent"
                onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\s/g, "")}`)}
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 bg-transparent"
                onClick={() => window.open(`mailto:${lead.email}`)}
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showCallbackDialog} onOpenChange={setShowCallbackDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Call Back Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="callback-reason">
                Call Back Reason <span className="text-destructive">*</span>
              </Label>
              <Select
                value={callbackForm.reason}
                onValueChange={(value: CallbackReason) => setCallbackForm((prev) => ({ ...prev, reason: value }))}
              >
                <SelectTrigger id="callback-reason">
                  <SelectValue placeholder="-- Select Reason --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_request">On Request</SelectItem>
                  <SelectItem value="not_picked">Not Picked</SelectItem>
                  <SelectItem value="not_reachable">Not Reachable</SelectItem>
                  <SelectItem value="switched_off">Switched Off</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Next Follow Up On</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={callbackForm.scheduledDate}
                  onChange={(e) => setCallbackForm((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                />
                <Input
                  type="time"
                  value={callbackForm.scheduledTime}
                  onChange={(e) => setCallbackForm((prev) => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="callback-note">Note</Label>
              <Textarea
                id="callback-note"
                placeholder="Enter Note"
                value={callbackForm.note}
                onChange={(e) => setCallbackForm((prev) => ({ ...prev, note: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallbackDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCallbackSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotInterestedDialog} onOpenChange={setShowNotInterestedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Not Interested Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="not-interested-reason">
                Not Interested Reason <span className="text-destructive">*</span>
              </Label>
              <Select
                value={notInterestedForm.reason}
                onValueChange={(value: NotInterestedReason) =>
                  setNotInterestedForm((prev) => ({ ...prev, reason: value }))
                }
              >
                <SelectTrigger id="not-interested-reason">
                  <SelectValue placeholder="-- Select Reason --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low_budget">Low Budget</SelectItem>
                  <SelectItem value="not_a_property_seeker">Not A Property Seeker</SelectItem>
                  <SelectItem value="location_mismatch">Location Mismatch</SelectItem>
                  <SelectItem value="dnd">DND</SelectItem>
                  <SelectItem value="already_bought">Already Bought</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="not-interested-note">Note</Label>
              <Textarea
                id="not-interested-note"
                placeholder="Enter Note"
                value={notInterestedForm.note}
                onChange={(e) => setNotInterestedForm((prev) => ({ ...prev, note: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotInterestedDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleNotInterestedSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
