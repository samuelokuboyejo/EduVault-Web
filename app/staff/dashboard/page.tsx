"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { StaffNav } from "@/components/staff-nav"
import { authApi } from "@/lib/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
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
import { Textarea } from "@/components/ui/textarea"
import { receiptApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Download,
} from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

interface Receipt {
  id: string
  studentEmail: string
  studentName?: string
  state?: "PENDING" | "APPROVED" | "REJECTED"
  uploadedAt: string
  fileName?: string
  pdfUrl?: string
}

const categories = [
  { key: "college-due", label: "College Due" },
  { key: "dept-due", label: "Department Due" },
  { key: "sch-fee", label: "School Fee" },
  { key: "remita-sch-fee", label: "Remita School Fee" },
  { key: "course-form", label: "Course Form" },
  { key: "invoice", label: "School Fee Invoice" },
]

export default function StaffDashboard() {
  const { toast } = useToast()
  const [user, setUser] = useState<{ firstName?: string }>({})
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [downloadLoading, setDownloadLoading] = useState<Record<string, boolean>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<{
    id: string
    category: string
    action: "approve" | "reject"
  } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState<{ url: string; fileName?: string; type?: string } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

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

  // 🔹 Fetch receipts
  const fetchReceipts = async (category: string) => {
    setLoading((prev) => ({ ...prev, [category]: true }))
    try {
      const response = await receiptApi.getAllReceipts(category)
      setReceipts((prev) => ({ ...prev, [category]: response.data }))
    } catch (error: any) {
      toast({
        title: "Failed to load receipts",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading((prev) => ({ ...prev, [category]: false }))
    }
  }




  // 🔹 Download all
  const handleDownloadAll = async (category: string) => {
    setDownloadLoading((prev) => ({ ...prev, [category]: true }))
    try {
      const response = await receiptApi.downloadAllReceipts(category)
      const blob = new Blob([response.data], { type: "application/zip" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${category}-receipts.zip`
      a.click()
      window.URL.revokeObjectURL(url)
      toast({ title: "Download started", description: `Downloading all ${category} receipts...` })
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.response?.data?.message || "Unable to download receipts.",
        variant: "destructive",
      })
    } finally {
      setDownloadLoading((prev) => ({ ...prev, [category]: false }))
    }
  }

  // 🔹 Approve / Reject prompt
  const handleAction = (receiptId: string, category: string, action: "approve" | "reject") => {
    setSelectedReceipt({ id: receiptId, category, action })
    setRejectReason("")
    setDialogOpen(true)
  }

  // 🔹 Confirm approve/reject
  const confirmAction = async () => {
    if (!selectedReceipt) return
    setActionLoading(selectedReceipt.id)
    try {
      if (selectedReceipt.action === "approve") {
        await receiptApi.approve(selectedReceipt.category, selectedReceipt.id)
        toast({ title: "Receipt approved" })
      } else {
        if (!rejectReason.trim()) {
          toast({
            title: "Reason required",
            description: "Please provide a reason for rejection.",
            variant: "destructive",
          })
          setActionLoading(null)
          return
        }
        await receiptApi.reject(selectedReceipt.category, selectedReceipt.id, rejectReason)
        toast({ title: "Receipt rejected" })
      }
      await fetchReceipts(selectedReceipt.category)
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.response?.data?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
      setDialogOpen(false)
      setSelectedReceipt(null)
      setRejectReason("")
    }
  }

  // 🔹 View PDF or Image preview
  const handlePreview = (receipt: Receipt) => {
    if (!receipt.pdfUrl) {
      toast({
        title: "Preview unavailable",
        description: "No file attached.",
        variant: "destructive",
      })
      return
    }

    setPreviewLoading(true)

    try {
      let fileUrl = receipt.pdfUrl
      const lower = fileUrl.toLowerCase()
      const isPdf = lower.endsWith(".pdf") || lower.includes("application/pdf")

      // Cloudinary PDFs are viewable directly — no transformation needed
      setViewingReceipt({
        url: fileUrl,
        fileName: receipt.fileName,
        type: isPdf ? "pdf" : "image",
      })
      setPreviewOpen(true)
    } catch {
      toast({
        title: "Preview failed",
        description: "Could not open this file.",
        variant: "destructive",
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setViewingReceipt(null)
  }

  useEffect(() => {
    categories.forEach((cat) => fetchReceipts(cat.key))
  }, [])

  const countByStatus = (status: "PENDING" | "APPROVED" | "REJECTED") =>
    Object.values(receipts).reduce((sum, arr) => sum + arr.filter((r) => r.state === status).length, 0)

  const getPendingCount = (category: string) =>
    receipts[category]?.filter((r) => r.state === "PENDING").length || 0

  return (
    <AuthGuard allowedRoles={["STAFF", "ADMIN"]}>
      <div className="min-h-screen bg-background">
        <StaffNav />

        <main className="mx-auto max-w-7xl p-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Approve Receipts</h1>
            <p className="text-muted-foreground">Review, preview, and manage student receipt submissions.</p>
          </div>

          {user?.firstName && (
            <h2 className="text-xl font-semibold text-primary">
              Welcome back, {user.firstName}!
            </h2>
          )}



          {/* Stats */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <Card><CardHeader><CardDescription>Pending</CardDescription><CardTitle className="text-3xl">{countByStatus("PENDING")}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Approved</CardDescription><CardTitle className="text-3xl">{countByStatus("APPROVED")}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Rejected</CardDescription><CardTitle className="text-3xl">{countByStatus("REJECTED")}</CardTitle></CardHeader></Card>
          </div>

          {/* Tabs per category */}
          <Tabs defaultValue={categories[0].key}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
              {categories.map((cat) => (
                <TabsTrigger key={cat.key} value={cat.key}>
                  {cat.label}
                  {getPendingCount(cat.key) > 0 && (
                    <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                      {getPendingCount(cat.key)}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.key} value={cat.key}>
                <Card>
                  <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>{cat.label} Receipts</CardTitle>
                      <CardDescription>Manage and review all {cat.label.toLowerCase()} uploads.</CardDescription>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleDownloadAll(cat.key)}
                      disabled={downloadLoading[cat.key]}
                      className="mt-2 md:mt-0 bg-primary text-white hover:bg-primary/90"
                    >
                      {downloadLoading[cat.key] ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download All
                    </Button>
                  </CardHeader>

                  <CardContent>
                    {loading[cat.key] ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : receipts[cat.key]?.length ? (
                      <div className="space-y-3">
                        {receipts[cat.key].map((receipt) => (
                          <div
                            key={receipt.id}
                            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{receipt.studentName || receipt.studentEmail}</p>
                                <p className="text-sm text-muted-foreground">
                                  Uploaded {format(new Date(receipt.uploadedAt), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <StatusBadge status={receipt.state ?? "PENDING"} />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePreview(receipt)}
                                className="border-blue-500/20 text-blue-500 hover:bg-blue-500/10"
                              >
                                <Eye className="mr-1 h-4 w-4" />View
                              </Button>
                              {receipt.state === "PENDING" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(receipt.id, cat.key, "approve")}
                                    disabled={actionLoading === receipt.id}
                                    className="border-green-500/20 text-green-500 hover:bg-green-500/10"
                                  >
                                    {actionLoading === receipt.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <><CheckCircle2 className="mr-1 h-4 w-4" />Approve</>
                                    )}
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(receipt.id, cat.key, "reject")}
                                    disabled={actionLoading === receipt.id}
                                    className="border-destructive/20 text-destructive hover:bg-destructive/10"
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <FileText className="mx-auto mb-2 h-12 w-12 opacity-20" />
                        <p>No receipts to review</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </main>

        {/* Confirmation Dialog */}
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedReceipt?.action === "approve" ? "Approve Receipt" : "Reject Receipt"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedReceipt?.action === "approve"
                  ? "Are you sure you want to approve this receipt?"
                  : "Provide a reason for rejecting this receipt."}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {selectedReceipt?.action === "reject" && (
              <Textarea
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-3"
              />
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmAction}>
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 🔹 Animated Preview Modal */}
        <AnimatePresence>
          {viewingReceipt && previewOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-5xl h-[85vh] bg-white rounded-lg shadow-xl overflow-hidden"
              >
                <button
                  onClick={handleClosePreview}
                  className="absolute top-3 right-3 z-50 flex items-center gap-1 rounded-md bg-gray-200 px-3 py-1 text-sm font-semibold hover:bg-gray-300 transition"
                >
                  <X className="w-4 h-4" /> Close
                </button>

                {previewLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
                  </div>
                ) : viewingReceipt?.type === "image" ? (
                  <img src={viewingReceipt.url} alt={viewingReceipt.fileName || "Receipt"} className="object-contain w-full h-full" />
                ) : (
                  <iframe
                    src={viewingReceipt.url}
                    title={viewingReceipt.fileName || "Receipt Preview"}
                    className="w-full h-full border-none"
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthGuard>
  )
}
