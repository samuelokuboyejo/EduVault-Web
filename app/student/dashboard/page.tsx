"use client"

import { getStoredUser } from "@/lib/auth"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AuthGuard } from "@/components/auth-guard"
import { StudentNav } from "@/components/student-nav"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-colors duration-700 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#334155]">
        <StudentNav />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <motion.div
            className="mb-10 text-center md:text-left"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {greeting}, {user?.matricNumber || "Student"} 
            </h1>
            <p className="text-muted-foreground">
              Welcome back! Here’s an overview of your uploaded receipts.
            </p>
          </motion.div>

          <Tabs defaultValue={categories[0].key} className="space-y-6">
            {/* ✅ Responsive + Scrollable TabsList */}
            <div className="overflow-x-auto">
              <TabsList className="flex gap-2 min-w-max sm:grid sm:grid-cols-3 lg:grid-cols-6 rounded-xl bg-muted/40 p-1">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.key}
                    value={cat.key}
                    className="whitespace-nowrap rounded-lg text-xs sm:text-sm py-2 px-3 transition-all 
                               data-[state=active]:bg-primary data-[state=active]:text-primary-foreground 
                               dark:data-[state=active]:bg-[#3b82f6] dark:data-[state=active]:text-white"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {categories.map((cat) => (
              <TabsContent key={cat.key} value={cat.key}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition dark:bg-[#1e293b] dark:text-gray-100 dark:border-gray-700">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <CardTitle>{cat.label}</CardTitle>
                        <CardDescription>
                          Your uploaded {cat.label.toLowerCase()} receipts
                        </CardDescription>
                      </div>
                      {receipts[cat.key]?.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadAll(cat.key)}
                          disabled={downloading[cat.key]}
                          className="flex items-center gap-2 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          {downloading[cat.key] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          Download All
                        </Button>
                      )}
                    </CardHeader>

                    <CardContent>
                      {loading[cat.key] ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : receipts[cat.key]?.length > 0 ? (
                        <motion.div
                          layout
                          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        >
                          <AnimatePresence>
                            {receipts[cat.key].map((receipt) => (
                              <motion.div
                                key={receipt.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div
                                  onClick={() => handleDownloadSingle(receipt)}
                                  className="cursor-pointer flex flex-col rounded-xl border border-border bg-card p-4 
                                             hover:bg-muted/50 dark:hover:bg-gray-800 transition-all hover:shadow-sm"
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted dark:bg-gray-700">
                                      <FileText className="h-5 w-5 text-muted-foreground dark:text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">
                                        {receipt.pdfUrl.split("/").pop() || "Receipt"}
                                      </p>
                                      <p className="text-xs text-muted-foreground truncate dark:text-gray-400">
                                        {receipt.department || receipt.academicSession || "Uploaded File"}
                                      </p>
                                    </div>
                                    <StatusBadge status={receipt.state || "PENDING"} />
                                  </div>

                                  <div className="space-y-1 text-xs text-muted-foreground dark:text-gray-400">
                                    {receipt.amount && <p>💰 Amount: {receipt.amount}</p>}
                                    {receipt.matricNumber && <p>🎓 Matric No: {receipt.matricNumber}</p>}
                                    {receipt.level && <p>📘 Level: {receipt.level}</p>}
                                    {receipt.RRR && <p>🧾 RRR: {receipt.RRR}</p>}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      ) : (
                        <div className="py-10 text-center text-muted-foreground dark:text-gray-400">
                          <FileText className="mx-auto mb-3 h-12 w-12 opacity-20" />
                          <p>No receipts uploaded yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  )
}
