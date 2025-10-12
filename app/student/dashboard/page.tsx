"use client"

import { getStoredUser } from "@/lib/auth"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AuthGuard } from "@/components/auth-guard"
import { StudentNav } from "@/components/student-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { receiptApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { FileText, Loader2, Download } from "lucide-react"

interface Receipt {
  id: string
  name?: string
  email?: string
  matricNumber?: string
  department?: string
  programme?: string
  college?: string
  academicSession?: string
  level?: string
  studentLevel?: string
  transactionReference?: string
  status?: "PENDING" | "APPROVED" | "REJECTED"
  state?: "PENDING" | "APPROVED" | "REJECTED"
  amount?: string
  RRR?: string
  BalanceDue?: string
  authorizationRef?: string
  invoiceNumber?: string
  receiptNumber?: string
  Bank?: string
  description?: string
  pdfUrl: string
  uploadedBy: string
  uploadedAt: string
}

const categories = [
  { key: "college-due", label: "College Due" },
  { key: "dept-due", label: "Department Due" },
  { key: "sch-fee", label: "School Fee" },
  { key: "remita-sch-fee", label: "Remita School Fee" },
  { key: "course-form", label: "Course Form" },
  { key: "invoice", label: "School Fee Invoice" },
]

export default function StudentDashboard() {
  const { toast } = useToast()
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [downloading, setDownloading] = useState<Record<string, boolean>>({})
  const user = getStoredUser()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const greeting = getGreeting()

  const fetchReceipts = async (category: string) => {
    setLoading((prev) => ({ ...prev, [category]: true }))
    try {
      const response = await receiptApi.getUserReceipts(category)
      setReceipts((prev) => ({ ...prev, [category]: response.data }))
    } catch (error: any) {
      toast({
        title: "Failed to load receipts",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setLoading((prev) => ({ ...prev, [category]: false }))
    }
  }

  const handleDownloadAll = async (category: string) => {
    setDownloading((prev) => ({ ...prev, [category]: true }))
    try {
      const response = await receiptApi.downloadUserReceipts(category)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${category}-receipts.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast({
        title: "Download started",
        description: "Your receipts are being downloaded",
      })
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      })
    } finally {
      setDownloading((prev) => ({ ...prev, [category]: false }))
    }
  }

  const handleDownloadSingle = (receipt: Receipt) => {
    const url = receipt.pdfUrl
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", url.split("/").pop() || "receipt.pdf")
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  useEffect(() => {
    categories.forEach((cat) => fetchReceipts(cat.key))
  }, [])

  return (
    <AuthGuard allowedRoles={["STUDENT"]}>
      <div className="min-h-screen bg-background">
        <StudentNav />
        <main className="mx-auto max-w-7xl p-4 py-8">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="text-3xl font-bold">
              {greeting}, {user?.matricNumber || "Student"}
            </h1>
            <p className="text-muted-foreground">Welcome back to your dashboard</p>
          </motion.div>

          <Tabs defaultValue={categories[0].key} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
              {categories.map((cat) => (
                <TabsTrigger key={cat.key} value={cat.key} className="text-xs lg:text-sm">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.key} value={cat.key}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{cat.label}</CardTitle>
                        <CardDescription>Your uploaded {cat.label.toLowerCase()} receipts</CardDescription>
                      </div>
                      {receipts[cat.key]?.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadAll(cat.key)}
                          disabled={downloading[cat.key]}
                        >
                          {downloading[cat.key] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Download All
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading[cat.key] ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : receipts[cat.key]?.length > 0 ? (
                      <div className="space-y-3">
                        {receipts[cat.key].map((receipt) => (
                          <div
                            key={receipt.id}
                            onClick={() => handleDownloadSingle(receipt)}
                            className="cursor-pointer flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-muted/30 transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {receipt.pdfUrl.split("/").pop() || "Receipt"}
                                </p>
                                {receipt.level && receipt.academicSession && (
                                  <p className="text-sm text-muted-foreground">
                                    Level: {receipt.level} | Session: {receipt.academicSession}
                                  </p>
                                )}
                                {receipt.department && (
                                  <p className="text-sm text-muted-foreground">
                                    Dept: {receipt.department}
                                  </p>
                                )}
                                {receipt.amount && (
                                  <p className="text-sm text-muted-foreground">
                                    Amount: {receipt.amount}
                                  </p>
                                )}
                                {receipt.matricNumber && (
                                  <p className="text-sm text-muted-foreground">
                                    Matric No: {receipt.matricNumber}
                                  </p>
                                )}
                                {receipt.RRR && (
                                  <p className="text-sm text-muted-foreground">RRR: {receipt.RRR}</p>
                                )}
                                {receipt.invoiceNumber && (
                                  <p className="text-sm text-muted-foreground">
                                    Invoice: {receipt.invoiceNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                            <StatusBadge status={receipt.state || receipt.state || "PENDING"} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <FileText className="mx-auto mb-2 h-12 w-12 opacity-20" />
                        <p>No receipts uploaded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  )
}
