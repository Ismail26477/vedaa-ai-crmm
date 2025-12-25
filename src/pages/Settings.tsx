"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Mail, Users, Bell, Save, Loader2 } from "lucide-react"
import { fetchSettings, updateEmailSettings, updateLeadAssignmentSettings } from "@/lib/api"

const Settings = () => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [isSavingLead, setIsSavingLead] = useState(false)

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpServer: "smtp.gmail.com",
    smtpPort: "587",
    senderEmail: "",
    senderPassword: "",
    enableNotifications: false,
    notifyOnAssignment: false,
    notifyOnStageChange: false,
  })

  // Lead assignment settings
  const [leadSettings, setLeadSettings] = useState({
    autoAssign: false,
    roundRobin: false,
    defaultStage: "new",
    defaultCallType: "outbound",
    defaultFollowUpHours: 24,
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await fetchSettings()

        if (settings.emailConfig) {
          setEmailSettings({
            smtpServer: settings.emailConfig.smtpServer || "smtp.gmail.com",
            smtpPort: settings.emailConfig.smtpPort || "587",
            senderEmail: settings.emailConfig.senderEmail || "",
            senderPassword: settings.emailConfig.senderPassword || "",
            enableNotifications: settings.emailConfig.enableNotifications || false,
            notifyOnAssignment: settings.emailConfig.notifyOnAssignment || false,
            notifyOnStageChange: settings.emailConfig.notifyOnStageChange || false,
          })
        }

        if (settings.leadAssignment) {
          setLeadSettings({
            autoAssign: settings.leadAssignment.autoAssign || false,
            roundRobin: settings.leadAssignment.roundRobin || false,
            defaultStage: settings.leadAssignment.defaultStage || "new",
            defaultCallType: settings.leadAssignment.defaultCallType || "outbound",
            defaultFollowUpHours: settings.leadAssignment.defaultFollowUpHours || 24,
          })
        }
      } catch (error) {
        console.error("[v0] Error loading settings:", error)
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [toast])

  const handleSaveEmailSettings = async () => {
    setIsSavingEmail(true)
    try {
      await updateEmailSettings(emailSettings)
      toast({
        title: "Settings saved",
        description: "Email notification settings have been updated successfully",
      })
    } catch (error) {
      console.error("[v0] Error saving email settings:", error)
      toast({
        title: "Error",
        description: "Failed to save email settings",
        variant: "destructive",
      })
    } finally {
      setIsSavingEmail(false)
    }
  }

  const handleSaveLeadSettings = async () => {
    setIsSavingLead(true)
    try {
      await updateLeadAssignmentSettings(leadSettings)
      toast({
        title: "Settings saved",
        description: "Lead assignment settings have been updated successfully",
      })
    } catch (error) {
      console.error("[v0] Error saving lead settings:", error)
      toast({
        title: "Error",
        description: "Failed to save lead assignment settings",
        variant: "destructive",
      })
    } finally {
      setIsSavingLead(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your CRM preferences</p>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Users className="w-4 h-4" />
            Lead Assignment
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Email Configuration
              </CardTitle>
              <CardDescription>Configure SMTP settings for sending email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">SMTP Server</Label>
                  <Input
                    id="smtp-server"
                    value={emailSettings.smtpServer}
                    onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpServer: e.target.value }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings((prev) => ({ ...prev, smtpPort: e.target.value }))}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-email">Sender Email</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    value={emailSettings.senderEmail}
                    onChange={(e) => setEmailSettings((prev) => ({ ...prev, senderEmail: e.target.value }))}
                    placeholder="noreply@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender-password">Sender Password</Label>
                  <Input
                    id="sender-password"
                    type="password"
                    value={emailSettings.senderPassword}
                    onChange={(e) => setEmailSettings((prev) => ({ ...prev, senderPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Email Triggers</h4>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Enable Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Send automated emails for important events</p>
                  </div>
                  <Switch
                    checked={emailSettings.enableNotifications}
                    onCheckedChange={(checked) =>
                      setEmailSettings((prev) => ({ ...prev, enableNotifications: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Notify on Lead Assignment</p>
                    <p className="text-sm text-muted-foreground">Email caller when a new lead is assigned</p>
                  </div>
                  <Switch
                    checked={emailSettings.notifyOnAssignment}
                    onCheckedChange={(checked) =>
                      setEmailSettings((prev) => ({ ...prev, notifyOnAssignment: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Notify on Stage Change</p>
                    <p className="text-sm text-muted-foreground">Email when lead stage is updated</p>
                  </div>
                  <Switch
                    checked={emailSettings.notifyOnStageChange}
                    onCheckedChange={(checked) =>
                      setEmailSettings((prev) => ({ ...prev, notifyOnStageChange: checked }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="btn-gradient-primary gap-2"
                  onClick={handleSaveEmailSettings}
                  disabled={isSavingEmail}
                >
                  {isSavingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Email Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Assignment Settings */}
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Lead Assignment Rules
              </CardTitle>
              <CardDescription>Configure how new leads are distributed to your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Auto-assign New Leads</p>
                    <p className="text-sm text-muted-foreground">Automatically assign incoming leads to callers</p>
                  </div>
                  <Switch
                    checked={leadSettings.autoAssign}
                    onCheckedChange={(checked) => setLeadSettings((prev) => ({ ...prev, autoAssign: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">Round-robin Assignment</p>
                    <p className="text-sm text-muted-foreground">Distribute leads evenly among active callers</p>
                  </div>
                  <Switch
                    checked={leadSettings.roundRobin}
                    onCheckedChange={(checked) => setLeadSettings((prev) => ({ ...prev, roundRobin: checked }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default Lead Stage</Label>
                  <Select
                    value={leadSettings.defaultStage}
                    onValueChange={(value) => setLeadSettings((prev) => ({ ...prev, defaultStage: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New Lead</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Call Type</Label>
                  <Select
                    value={leadSettings.defaultCallType}
                    onValueChange={(value) => setLeadSettings((prev) => ({ ...prev, defaultCallType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound">Inbound</SelectItem>
                      <SelectItem value="outbound">Outbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Follow-up Time (hours)</Label>
                  <Input
                    type="number"
                    value={leadSettings.defaultFollowUpHours}
                    onChange={(e) =>
                      setLeadSettings((prev) => ({
                        ...prev,
                        defaultFollowUpHours: Number.parseInt(e.target.value) || 24,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="btn-gradient-primary gap-2" onClick={handleSaveLeadSettings} disabled={isSavingLead}>
                  {isSavingLead ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Lead Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Manage your in-app notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">Browser Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive push notifications in your browser</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">Follow-up Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified before scheduled follow-ups</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">New Lead Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when new leads arrive</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-foreground">Deal Won Celebrations</p>
                  <p className="text-sm text-muted-foreground">Celebrate when deals are closed</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Settings
