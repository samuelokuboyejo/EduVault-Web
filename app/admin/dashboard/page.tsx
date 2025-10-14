"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminNav } from "@/components/admin-nav"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import { receiptApi, analyticsApi, authApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { FileCheck, TrendingUp, Users, Calendar, Download, Loader2, FileText, Eye, CheckCircle2, XCircle, X } from "lucide-react"
import { format } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"

type CategoryKey = "college-due" | "dept-due" | "sch-fee" | "remita-sch-fee" | "course-form" | "invoice"

interface Receipt {
  id: string
  studentEmail: string
  studentName?: string
  state?: "PENDING" | "APPROVED" | "REJECTED"
  uploadedAt: string
  fileName?: string
  pdfUrl?: string
}

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "college-due", label: "College Due" },
  { key: "dept-due", label: "Department Due" },
  { key: "sch-fee", label: "School Fee" },
  { key: "remita-sch-fee", label: "Remita School Fee" },
  { key: "course-form", label: "Course Form" },
  { key: "invoice", label: "School Fee Invoice" },
]

export default function AdminDashboard() {
  const { toast } = useToast()

  const [user, setUser] = useState<{ firstName?: string }>({})


  // analytics
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [stats, setStats] = useState({
    approvedCount: 0,
    uploadsThisMonth: 0,
    approvedThisWeek: 0,
    newStudents: 0,
  })

  // receipts management
  const [receiptsMap, setReceiptsMap] = useState<Record<string, Receipt[]>>({})
  const [loadingReceipts, setLoadingReceipts] = useState<Record<string, boolean>>({})
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("college-due")
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReceiptAction, setSelectedReceiptAction] = useState<{ id: string; category: string; action: "approve" | "reject" } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState<{ url: string; fileName?: string; type?: "pdf" | "image" } | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoadingAnalytics(true)
      try {
        const [approved, uploads, weekly, students] = await Promise.all([
          analyticsApi.getApprovedCount(),
          analyticsApi.getUploadsThisMonth(),
          analyticsApi.getApprovedThisWeek(),
          analyticsApi.getNewStudents(),
        ])

        const parseCount = (data: any): number => {
          if (!data) return 0
          if (typeof data === "number") return data
          return data.count ?? data.receiptCount ?? data.total ?? 0
        }

        setStats({
          approvedCount: parseCount(approved.data),
          uploadsThisMonth: parseCount(uploads.data),
          approvedThisWeek: parseCount(weekly.data),
          newStudents: parseCount(students.data),
        })
      } catch (err: any) {
        toast({
          title: "Failed to load analytics",
          description: err?.response?.data?.message || "Please try again",
          variant: "destructive",
        })
      } finally {
        setLoadingAnalytics(false)
      }
    }

    fetchAnalytics()
  }, [toast])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authApi.getCurrentUser()
        setUser(res.data)
        toast({
          title: `Welcome${res.data.firstName ? `, ${res.data.firstName}` : ""}! 👋`,
          description: "Glad to have you back.",
        })
      } catch (err) {
        console.error("Failed to fetch user:", err)
      }
    }
    fetchUser()
  }, [toast])


  const fetchReceipts = async (category: CategoryKey) => {
    setLoadingReceipts((p) => ({ ...p, [category]: true }))
    try {
      const res = await receiptApi.getAllReceipts(category)
      setReceiptsMap((p) => ({ ...p, [category]: res.data }))
    } catch (err: any) {
      toast({
        title: "Failed to load receipts",
        description: err?.response?.data?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoadingReceipts((p) => ({ ...p, [category]: false }))
    }
  }

  useEffect(() => {
    CATEGORIES.forEach((c) => fetchReceipts(c.key))
  }, [])

  const getPendingCount = (category: string) =>
    receiptsMap[category]?.filter((r) => r.state === "PENDING").length || 0

  const countByStatus = (status: "PENDING" | "APPROVED" | "REJECTED") =>
    Object.values(receiptsMap).reduce((sum, arr) => sum + arr.filter((r) => r.state === status).length, 0)

  const openActionDialog = (receiptId: string, category: string, action: "approve" | "reject") => {
    setSelectedReceiptAction({ id: receiptId, category, action })
    setRejectReason("")
    setDialogOpen(true)
  }

  const confirmAction = async () => {
    if (!selectedReceiptAction) return
    setActionLoadingId(selectedReceiptAction.id)
    try {
      if (selectedReceiptAction.action === "approve") {
        await receiptApi.approve(selectedReceiptAction.category, selectedReceiptAction.id)
        toast({ title: "Receipt approved", description: "Receipt approved successfully." })
      } else {
        if (!rejectReason.trim()) {
          toast({ title: "Reason required", description: "Please provide a reason for rejection.", variant: "destructive" })
          setActionLoadingId(null)
          return
        }
        await receiptApi.reject(selectedReceiptAction.category, selectedReceiptAction.id, rejectReason)
        toast({ title: "Receipt rejected", description: "Receipt rejected." })
      }

      await Promise.all([
        fetchReceipts(selectedReceiptAction.category as CategoryKey),
        (async () => {
          try {
            const [approved, uploads, weekly, students] = await Promise.all([
              analyticsApi.getApprovedCount(),
              analyticsApi.getUploadsThisMonth(),
              analyticsApi.getApprovedThisWeek(),
              analyticsApi.getNewStudents(),
            ])
            const parseCount = (data: any): number => {
              if (!data) return 0
              if (typeof data === "number") return data
              return data.count ?? data.receiptCount ?? data.total ?? 0
            }
            setStats({
              approvedCount: parseCount(approved.data),
              uploadsThisMonth: parseCount(uploads.data),
              approvedThisWeek: parseCount(weekly.data),
              newStudents: parseCount(students.data),
            })
          } catch (_) {
          }
        })(),
      ])
    } catch (err: any) {
      toast({
        title: "Action failed",
        description: err?.response?.data?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setActionLoadingId(null)
      setDialogOpen(false)
      setSelectedReceiptAction(null)
      setRejectReason("")
    }
  }

  const handlePreview = (receipt: Receipt) => {
    if (!receipt.pdfUrl) {
      toast({ title: "Preview not available", description: "This receipt has no previewable file", variant: "destructive" })
      return
    }
    setPreviewLoading(true)
    try {
      let url = receipt.pdfUrl
      if (url.includes("/upload/")) {
        url = url.replace("/upload/", "/upload/fl_attachment:false/")
      }
      const isPdf = url.toLowerCase().endsWith(".pdf")
      setViewingReceipt({ url, fileName: receipt.fileName, type: isPdf ? "pdf" : "image" })
      setPreviewOpen(true)
    } catch (err) {
      toast({ title: "Preview failed", description: "Unable to load preview", variant: "destructive" })
    } finally {
      setPreviewLoading(false)
    }
  }

  const closePreview = () => {
    setViewingReceipt(null)
    setPreviewOpen(false)
  }

  const handleDownloadAll = async () => {
    setDownloading(true)
    try {
      const res = await analyticsApi.downloadAllReceipts()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement("a")
      a.href = url
      a.setAttribute("download", "approved_receipts.zip")
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast({ title: "Download started", description: "All approved receipts are being downloaded" })
    } catch (err: any) {
      toast({ title: "Download failed", description: err?.response?.data?.message || "Please try again", variant: "destructive" })
    } finally {
      setDownloading(false)
    }
  }

  const selectedReceipts = receiptsMap[selectedCategory] ?? []
  const pendingCountTotal = countByStatus("PENDING")
  const approvedCountTotal = countByStatus("APPROVED")
  const rejectedCountTotal = countByStatus("REJECTED")

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background">
        <AdminNav />
        <main className="mx-auto max-w-7xl p-4 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Overview & receipts management</p>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleDownloadAll} disabled={downloading}>
                {downloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download All Receipts
                  </>
                )}
              </Button>
            </div>
          </div>

          {user?.firstName && (
            <h2 className="text-xl font-semibold text-primary">
              Welcome back, {user.firstName}!
            </h2>
          )}


          {/* Analytics summary cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex items-center justify-between pb-1">
                <CardTitle className="text-sm">Total Approved</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <div className="py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.approvedCount}</div>
                    <div className="text-xs text-muted-foreground">All-time approved receipts</div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between pb-1">
                <CardTitle className="text-sm">Uploads This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <div className="py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.uploadsThisMonth}</div>
                    <div className="text-xs text-muted-foreground">New uploads this month</div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between pb-1">
                <CardTitle className="text-sm">Approved This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <div className="py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.approvedThisWeek}</div>
                    <div className="text-xs text-muted-foreground">Approvals this week</div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between pb-1">
                <CardTitle className="text-sm">New Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <div className="py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.newStudents}</div>
                    <div className="text-xs text-muted-foreground">Registered this month</div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle>Receipts Management</CardTitle>
                    <CardDescription>Approve, reject, or preview student receipts</CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Pending: <span className="font-semibold">{pendingCountTotal}</span> • Approved: <span className="font-semibold">{approvedCountTotal}</span> • Rejected: <span className="font-semibold">{rejectedCountTotal}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold">Receipts Management</h2>
                        <p className="text-sm text-muted-foreground">
                          Approve, reject, or preview student receipts
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c.key}
                            onClick={() => setSelectedCategory(c.key)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${selectedCategory === c.key
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground hover:bg-muted/70"
                              }`}
                          >
                            {c.label}
                            {getPendingCount(c.key) > 0 && (
                              <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/90 px-1.5 text-[10px] text-primary-foreground">
                                {getPendingCount(c.key)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-lg font-semibold">
                          {CATEGORIES.find((c) => c.key === selectedCategory)?.label}
                        </h4>
                        <Button size="sm" onClick={() => fetchReceipts(selectedCategory)}>
                          Refresh
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {loadingReceipts[selectedCategory] ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : receiptsMap[selectedCategory]?.length ? (
                          receiptsMap[selectedCategory].map((r) => (
                            <div
                              key={r.id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-border bg-card p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">{r.studentName || r.studentEmail}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Uploaded {format(new Date(r.uploadedAt), "MMM d, yyyy 'at' h:mm a")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center flex-wrap gap-2">
                                <StatusBadge status={r.state ?? "PENDING"} />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePreview(r)}
                                  disabled={previewLoading}
                                  className="border-blue-500/20 text-blue-500"
                                >
                                  <Eye className="mr-1 h-4 w-4" /> View
                                </Button>

                                {r.state === "PENDING" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openActionDialog(r.id, selectedCategory, "approve")}
                                      disabled={actionLoadingId === r.id}
                                      className="border-green-500/20 text-green-500"
                                    >
                                      {actionLoadingId === r.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openActionDialog(r.id, selectedCategory, "reject")}
                                      disabled={actionLoadingId === r.id}
                                      className="border-destructive/20 text-destructive"
                                    >
                                      <XCircle className="mr-1 h-4 w-4" /> Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-8 text-center text-muted-foreground">
                            <FileText className="mx-auto mb-2 h-12 w-12 opacity-20" />
                            <p>No receipts to show</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>

              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Snapshot from receipts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                        <div className="text-lg font-bold">{pendingCountTotal}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Approved</div>
                        <div className="text-lg font-bold">{approvedCountTotal}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Rejected</div>
                        <div className="text-lg font-bold">{rejectedCountTotal}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


              <Card>
                <CardHeader>
                  <CardTitle>Approver Snapshot</CardTitle>
                  <CardDescription>Top approvers & monthly activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    For detailed approver statistics and staff activity, visit the Analytics page.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {selectedReceiptAction?.action === "approve" ? "Approve Receipt" : "Reject Receipt"}
                </AlertDialogTitle>
              </AlertDialogHeader>

              {selectedReceiptAction?.action === "reject" && (
                <div className="p-4">
                  <Textarea placeholder="Enter reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                </div>
              )}

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAction}>
                  {actionLoadingId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AnimatePresence>
            {viewingReceipt && previewOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} exit={{ scale: 0.98 }} className="relative w-full max-w-4xl h-[85vh] bg-white rounded-lg shadow-xl overflow-hidden">
                  <button onClick={closePreview} className="absolute top-3 right-3 z-50 flex items-center gap-1 rounded-md bg-gray-200 px-3 py-1 text-sm font-semibold hover:bg-gray-300 transition">
                    <X className="w-4 h-4" /> Close
                  </button>

                  {previewLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
                    </div>
                  ) : viewingReceipt.type === "image" ? (
                    <img src={viewingReceipt.url} alt={viewingReceipt.fileName || "Receipt"} className="object-contain w-full h-full" />
                  ) : (
                    <iframe src={viewingReceipt.url} className="w-full h-full border-none" title={viewingReceipt.fileName || "Receipt Preview"} />
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </AuthGuard>
  )
}
