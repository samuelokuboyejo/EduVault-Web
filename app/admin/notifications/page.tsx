"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminNav } from "@/components/admin-nav"
import { NotificationList } from "@/components/notification-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notificationsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Send, Loader2, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function AdminNotificationsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "" })
  const [customForm, setCustomForm] = useState({ recipients: "", title: "", message: "" })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMessage, setDialogMessage] = useState("")
  const [activeTab, setActiveTab] = useState("broadcast")

  const handleBroadcast = async (target: "students" | "staff") => {
    setLoading(true)
    try {
      if (target === "students") {
        await notificationsApi.broadcastToStudents(broadcastForm)
      } else {
        await notificationsApi.broadcastToStaff(broadcastForm)
      }

      const message =
        target === "students"
          ? "Broadcast notification has been sent to all students."
          : "Broadcast notification has been sent to all staff and admin."

      setDialogMessage(message)
      setDialogOpen(true)

      toast({
        title: "Broadcast sent",
        description: `Notification sent to all ${target}`,
      })

      setBroadcastForm({ title: "", message: "" })
    } catch (error: any) {
      toast({
        title: "Broadcast failed",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCustomNotification = async () => {
    setLoading(true)
    try {
      const recipients = customForm.recipients
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email)

      await notificationsApi.sendCustom({
        recipients,
        title: customForm.title,
        message: customForm.message,
      })

      setDialogMessage("Custom notification has been sent to all specified recipients.")
      setDialogOpen(true)

      toast({
        title: "Notification sent",
        description: `Sent to ${recipients.length} recipient(s)`,
      })

      setCustomForm({ recipients: "", title: "", message: "" })
    } catch (error: any) {
      toast({
        title: "Failed to send notification",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard allowedRoles={["ADMIN", "STAFF"]}>
      <div className="min-h-screen bg-background">
        <AdminNav />
        <main className="mx-auto max-w-7xl p-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {`${activeTab === "view"
                  ? "View notifications sent by admins"
                  : "Send notifications to users"
                }`}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="broadcast" disabled={false}>Broadcast</TabsTrigger>
              <TabsTrigger value="custom" disabled={false}>Custom</TabsTrigger>
              <TabsTrigger value="view">View Notifications</TabsTrigger>
            </TabsList>

            {/* ========== BROADCAST TAB (Admins Only) ========== */}
            <TabsContent value="broadcast">
              <Card>
                <CardHeader>
                  <CardTitle>Broadcast Notification</CardTitle>
                  <CardDescription>
                    Send a notification to all students or staff
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="broadcast-title">Title</Label>
                    <Input
                      id="broadcast-title"
                      placeholder="Notification title"
                      value={broadcastForm.title}
                      onChange={(e) =>
                        setBroadcastForm({ ...broadcastForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="broadcast-message">Message</Label>
                    <Textarea
                      id="broadcast-message"
                      placeholder="Notification message"
                      rows={4}
                      value={broadcastForm.message}
                      onChange={(e) =>
                        setBroadcastForm({ ...broadcastForm, message: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleBroadcast("students")}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send to Students
                    </Button>
                    <Button
                      onClick={() => handleBroadcast("staff")}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Send to Staff
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Notification</CardTitle>
                  <CardDescription>
                    Send a notification to specific users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
                    <Input
                      id="recipients"
                      placeholder="user1@funaab.edu.ng, user2@funaab.edu.ng"
                      value={customForm.recipients}
                      onChange={(e) =>
                        setCustomForm({ ...customForm, recipients: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-title">Title</Label>
                    <Input
                      id="custom-title"
                      placeholder="Notification title"
                      value={customForm.title}
                      onChange={(e) =>
                        setCustomForm({ ...customForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-message">Message</Label>
                    <Textarea
                      id="custom-message"
                      placeholder="Notification message"
                      rows={4}
                      value={customForm.message}
                      onChange={(e) =>
                        setCustomForm({ ...customForm, message: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    onClick={handleCustomNotification}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Send Notification
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="view">
              <Card>
                <CardHeader>
                  <CardTitle>All Notifications</CardTitle>
                  <CardDescription>
                    View all notifications sent by admins
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationList />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md text-center">
              <DialogHeader>
                <div className="flex justify-center mb-2">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <DialogTitle className="text-lg font-bold">Notification Sent</DialogTitle>
                <DialogDescription>{dialogMessage}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setDialogOpen(false)} className="w-full">
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AuthGuard>
  )
}
