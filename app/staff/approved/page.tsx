"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { StaffNav } from "@/components/staff-nav"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { analyticsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { FileText, Loader2 } from "lucide-react"
import { format } from "date-fns"

interface ApprovedReceipt {
  id: string
  receiptName: string
  uploadedBy: string
  approvedBy: string
  uploadedAt: string
}

export default function ApprovedHistoryPage() {
  const { toast } = useToast()
  const [approvedReceipts, setApprovedReceipts] = useState<
    { category: string; receipts: ApprovedReceipt[] }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApprovedReceipts = async () => {
      try {
        const response = await analyticsApi.getApprovedReceipts()
        const data = response.data

        // data is in the form: { "College Due": [...], "School Fee Receipt": [...] }
        const formattedData = Object.entries(data).map(([category, receipts]) => ({
          category,
          receipts: receipts as ApprovedReceipt[],
        }))

        setApprovedReceipts(formattedData)
      } catch (error: any) {
        toast({
          title: "Failed to load approved receipts",
          description:
            error.response?.data?.message || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchApprovedReceipts()
  }, [toast])

  return (
    <AuthGuard allowedRoles={["STAFF", "ADMIN"]}>
      <div className="min-h-screen bg-background">
        <StaffNav />
        <main className="mx-auto max-w-7xl p-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Approved History</h1>
            <p className="text-muted-foreground">
              View all approved receipts categorized by type
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Approved Receipts</CardTitle>
              <CardDescription>
                All approved receipts grouped by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : approvedReceipts.length > 0 ? (
                <div className="space-y-6">
                  {approvedReceipts.map(({ category, receipts }) => (
                    <div key={category}>
                      <h2 className="mb-2 text-lg font-semibold">{category}</h2>
                      <div className="space-y-3">
                        {receipts.map((receipt) => (
                          <div
                            key={receipt.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{receipt.receiptName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Uploaded by {receipt.uploadedBy} • Approved by{" "}
                                  {receipt.approvedBy} •{" "}
                                  {format(new Date(receipt.uploadedAt), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                            <StatusBadge status="APPROVED" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-12 w-12 opacity-20" />
                  <p>No approved receipts found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
