"use client"

import { useEffect, useState, useMemo } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminNav } from "@/components/admin-nav"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { adminApi, analyticsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  UserPlus,
  Loader2,
  MoreVertical,
  Ban,
  Trash2,
  CheckCircle2,
  Search,
} from "lucide-react"

interface Student {
  id: string
  matricNumber: string
  email: string
  createdAt: string
  lastLogin: string
}

interface PrivilegedUser {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl?: string
  role: string
  lastLogin: string
  dateJoined: string
}

export default function UsersPage() {
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [privilegedUsers, setPrivilegedUsers] = useState<PrivilegedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchStudent, setSearchStudent] = useState("")
  const [searchPrivileged, setSearchPrivileged] = useState("")
  const [filterRole, setFilterRole] = useState<"ALL" | "ADMIN" | "STAFF">("ALL")

  // Invitation dialog state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteLink, setInviteLink] = useState("")
  const [inviteForm, setInviteForm] = useState({ email: "", role: "STAFF" })
  const [inviteSentMessage, setInviteSentMessage] = useState("")

  // User action dialog
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    user: PrivilegedUser | null
    action: "suspend" | "deactivate" | "activate" | "delete" | null
  }>({ open: false, user: null, action: null })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [studentsRes, privilegedRes] = await Promise.all([
        analyticsApi.getAllStudents(),
        adminApi.getPrivilegedUsers(),
      ])
      setStudents(studentsRes.data || [])
      setPrivilegedUsers(privilegedRes.data || [])
    } catch (error: any) {
      toast({
        title: "Error fetching users",
        description: error.response?.data?.message || "Please try again later",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvite = async () => {
    if (!inviteForm.email) {
      toast({
        title: "Email required",
        description: "Please enter an email to send an invite.",
        variant: "destructive",
      })
      return
    }
    try {
      const res = await adminApi.createInvite(inviteForm)
      const backendUrl = res.data.invitationLink
      const tokenMatch = backendUrl.match(/token=([^&]+)/)
      const token = tokenMatch ? tokenMatch[1] : ""
      const frontendUrl = `${window.location.origin}/invite/register?token=${token}`
      setInviteLink(frontendUrl)
      toast({
        title: "Invite Created",
        description: `Invite sent to ${inviteForm.email}`,
      })
      setInviteSentMessage(`Invitation sent to ${inviteForm.email}`)
      setTimeout(() => setInviteSentMessage(""), 5000)
    } catch (error: any) {
      toast({
        title: "Failed to create invite",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUserAction = async () => {
    if (!actionDialog.user || !actionDialog.action) return
    try {
      if (actionDialog.action === "delete") {
        await adminApi.deleteUser(actionDialog.user.email)
        toast({ title: "User deleted", description: "User has been removed." })
      } else {
        const statusMap = {
          suspend: "SUSPENDED",
          deactivate: "DEACTIVATED",
          activate: "ACTIVE",
        }
        await adminApi.updateAccountStatus(
          actionDialog.user.email,
          statusMap[actionDialog.action]
        )
        toast({
          title: "Status updated",
          description: `User ${actionDialog.action}d successfully.`,
        })
      }
      fetchAll()
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionDialog({ open: false, user: null, action: null })
    }
  }

  // Helper for initials
  const getInitial = (u: PrivilegedUser) => {
    if (u.firstName && u.firstName.trim().length > 0)
      return u.firstName[0].toUpperCase()
    if (u.email && u.email.length > 0) return u.email[0].toUpperCase()
    return "?"
  }

  // 🧠 New helper: format date with "x days ago" logic
  const formatRelativeOrFull = (dateString?: string): string => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 1) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      return diffHours > 0 ? `${diffHours} hour${diffHours > 1 ? "s" : ""} ago` : "Just now"
    }
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.email?.toLowerCase().includes(searchStudent.toLowerCase()) ||
        s.matricNumber?.toLowerCase().includes(searchStudent.toLowerCase())
    )
  }, [students, searchStudent])

  const filteredPrivileged = useMemo(() => {
    return privilegedUsers.filter((u) => {
      const matchRole = filterRole === "ALL" || u.role === filterRole
      const matchSearch =
        u.email.toLowerCase().includes(searchPrivileged.toLowerCase()) ||
        `${u.firstName || ""} ${u.lastName || ""}`
          .toLowerCase()
          .includes(searchPrivileged.toLowerCase())
      return matchRole && matchSearch
    })
  }, [privilegedUsers, filterRole, searchPrivileged])

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background">
        <AdminNav />
        <main className="mx-auto max-w-7xl p-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">
                Manage students and privileged users
              </p>
            </div>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Invitation</DialogTitle>
                  <DialogDescription>Invite a staff or admin</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      placeholder="user@funaab.edu.ng"
                      value={inviteForm.email}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background p-2"
                      value={inviteForm.role}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, role: e.target.value })
                      }
                    >
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <Button onClick={handleCreateInvite} className="w-full">
                    Generate Link
                  </Button>
                  {inviteLink && (
                    <div className="mt-3">
                      <Label>Invitation Link</Label>
                      <div className="rounded-md border bg-muted p-2 break-all text-sm">
                        {inviteLink}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="students" className="w-full">
            <TabsList>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="privileged">Privileged Users</TabsTrigger>
            </TabsList>

            {/* Students */}
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>All registered students</CardDescription>
                  <div className="relative mt-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by matric number or email..."
                      className="pl-8"
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    <div className="space-y-2">
                      {filteredStudents.map((s) => (
                        <div
                          key={s.id}
                          className="flex justify-between items-center rounded-md border p-4 hover:bg-muted/50 transition"
                        >
                          <div>
                            <p className="font-medium">{s.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Matric: {s.matricNumber} | Joined:{" "}
                              <span
                                title={new Date(
                                  s.createdAt
                                ).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              >
                                {formatRelativeOrFull(s.createdAt)}
                              </span>{" "}
                              | Last Login:{" "}
                              <span
                                title={
                                  s.lastLogin
                                    ? new Date(
                                      s.lastLogin
                                    ).toLocaleString(undefined, {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })
                                    : "N/A"
                                }
                              >
                                {formatRelativeOrFull(s.lastLogin)}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">
                      No students found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privileged Users */}
            <TabsContent value="privileged">
              <Card>
                <CardHeader>
                  <CardTitle>Privileged Users</CardTitle>
                  <CardDescription>Admins and Staff</CardDescription>
                  <div className="mt-4 flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        className="pl-8"
                        value={searchPrivileged}
                        onChange={(e) => setSearchPrivileged(e.target.value)}
                      />
                    </div>
                    <select
                      className="w-40 rounded-md border border-input bg-background p-2 text-sm"
                      value={filterRole}
                      onChange={(e) =>
                        setFilterRole(
                          e.target.value as "ALL" | "ADMIN" | "STAFF"
                        )
                      }
                    >
                      <option value="ALL">All Roles</option>
                      <option value="ADMIN">Admin</option>
                      <option value="STAFF">Staff</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredPrivileged.length > 0 ? (
                    <div className="space-y-2">
                      {filteredPrivileged.map((u) => (
                        <div
                          key={u.id}
                          className="flex justify-between items-center rounded-md border p-4 hover:bg-muted/50 transition"
                        >
                          <div className="flex items-center gap-3">
                            {u.imageUrl ? (
                              <img
                                src={u.imageUrl}
                                alt="profile"
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                {getInitial(u)}
                              </div>
                            )}
                            <div>
                              <p className="font-medium">
                                {u.firstName || "Unknown"} {u.lastName || ""}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {u.email} | Role:{" "}
                                <Badge variant="outline">{u.role}</Badge>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Joined:{" "}
                                <span
                                  title={new Date(
                                    u.dateJoined
                                  ).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                >
                                  {formatRelativeOrFull(u.dateJoined)}
                                </span>{" "}
                                | Last Login:{" "}
                                <span
                                  title={
                                    u.lastLogin
                                      ? new Date(
                                        u.lastLogin
                                      ).toLocaleString(undefined, {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                      })
                                      : "N/A"
                                  }
                                >
                                  {formatRelativeOrFull(u.lastLogin)}
                                </span>
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    user: u,
                                    action: "suspend",
                                  })
                                }
                              >
                                <Ban className="mr-2 h-4 w-4" /> Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    user: u,
                                    action: "activate",
                                  })
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />{" "}
                                Activate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    user: u,
                                    action: "delete",
                                  })
                                }
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">
                      No privileged users found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Confirm Dialog */}
        <AlertDialog
          open={actionDialog.open}
          onOpenChange={(open) =>
            setActionDialog({ ...actionDialog, open })
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Action</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {actionDialog.action}{" "}
                {actionDialog.user?.email}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUserAction}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  )
}
