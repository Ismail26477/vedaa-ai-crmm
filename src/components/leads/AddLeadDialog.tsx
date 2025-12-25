"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Lead, LeadStage, LeadPriority, LeadSource, LeadStatus, LeadCategory, LeadSubcategory } from "@/types/crm"
import { leadSourceLabels, leadCategoryLabels, leadSubcategoryLabels, categorySubcategoryMap } from "@/data/mockData"
import { useToast } from "@/hooks/use-toast"

interface AddLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddLead: (lead: Lead) => void
}

export function AddLeadDialog({ open, onOpenChange, onAddLead }: AddLeadDialogProps) {
  const { toast } = useToast()
  const [callers, setCallers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    projectName: "",
    value: "",
    source: "website" as LeadSource,
    stage: "new" as LeadStage,
    priority: "warm" as LeadPriority,
    status: "active" as LeadStatus,
    category: "property" as LeadCategory,
    subcategory: "india_property" as LeadSubcategory,
    assignedCaller: "unassigned",
    notes: "",
  })

  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>(
    categorySubcategoryMap["property"] || [],
  )

  useEffect(() => {
    const loadCallers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/callers")
        const data = await response.json()
        setCallers(data)
      } catch (error) {
        console.error("Error loading callers:", error)
      }
    }
    if (open) {
      loadCallers()
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" })
      return
    }
    if (!formData.phone.trim()) {
      toast({ title: "Error", description: "Phone number is required", variant: "destructive" })
      return
    }

    const assignedCaller = callers.find((c) => c.id === formData.assignedCaller)

    const newLead: Lead = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      city: formData.city.trim() || "Not specified",
      projectName: formData.projectName.trim() || undefined,
      value: Number.parseFloat(formData.value) || 0,
      source: formData.source,
      stage: formData.stage,
      priority: formData.priority,
      status: formData.status,
      category: formData.category,
      subcategory: formData.subcategory,
      assignedCaller: formData.assignedCaller || undefined,
      assignedCallerName: assignedCaller?.name,
      notes: formData.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onAddLead(newLead)

    // Reset form
    setFormData({
      name: "",
      phone: "",
      email: "",
      city: "",
      projectName: "",
      value: "",
      source: "website",
      stage: "new",
      priority: "warm",
      status: "active",
      category: "property",
      subcategory: "india_property",
      assignedCaller: "unassigned",
      notes: "",
    })

    onOpenChange(false)
    toast({ title: "Success!", description: "Lead has been added successfully" })
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCategoryChange = (category: LeadCategory) => {
    const subcategories = categorySubcategoryMap[category] || []
    setAvailableSubcategories(subcategories)
    setFormData((prev) => ({
      ...prev,
      category,
      subcategory: (subcategories[0] as LeadSubcategory) || "other",
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add New Lead</DialogTitle>
          <DialogDescription>Create a new lead account</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Enter city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => handleChange("projectName", e.target.value)}
                placeholder="Enter project name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Lead Value (₹)</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => handleChange("value", e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={formData.source} onValueChange={(val) => handleChange("source", val)}>
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(leadSourceLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select value={formData.stage} onValueChange={(val) => handleChange("stage", val)}>
                <SelectTrigger id="stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(val) => handleChange("priority", val)}>
                <SelectTrigger id="priority">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(val) => handleCategoryChange(val as LeadCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(leadCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select value={formData.subcategory} onValueChange={(val) => handleChange("subcategory", val)}>
                <SelectTrigger id="subcategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSubcategories.map((key) => (
                    <SelectItem key={key} value={key}>
                      {leadSubcategoryLabels[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedCaller">Assign to Caller</Label>
            <Select value={formData.assignedCaller} onValueChange={(val) => handleChange("assignedCaller", val)}>
              <SelectTrigger id="assignedCaller">
                <SelectValue placeholder="Select caller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {callers.map((caller) => (
                  <SelectItem key={caller.id} value={caller.id}>
                    {caller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-gradient-primary">
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
