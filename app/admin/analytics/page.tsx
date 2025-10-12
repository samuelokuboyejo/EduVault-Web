"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { analyticsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2, FileText, BarChart3, Users2 } from "lucide-react"
import Image from "next/image"

interface ApprovedReceipt {
  id: string
  receiptName: string
  uploadedBy: string
  approvedBy: string
  uploadedAt: string
}

interface StaffActivity {
  staffName: string
  imageUrl?: string
  approvalsThisMonth: number
}

interface ApproverStat {
  staffName: string
  imageUrl?: string
  totalApproved: number
}

export default function AdminAnalyticsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [approvedReceipts, setApprovedReceipts] = useState<
    { category: string; receipts: ApprovedReceipt[] }[]
  >([])
  const [staffActivity, setStaffActivity] = useState<StaffActivity[]>([])
  const [approverStats, setApproverStats] = useState<ApproverStat[]>([])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [receiptsRes, staffActivityRes, approverStatsRes] = await Promise.all([
          analyticsApi.getApprovedReceipts(),
          analyticsApi.getStaffActivity(),
          analyticsApi.getApprovers(),
        ])

        const data = receiptsRes.data
        const formattedReceipts = Object.entries(data).map(([category, receipts]) => ({
          category,
          receipts: receipts as ApprovedReceipt[],
        }))

        setApprovedReceipts(formattedReceipts)
        setStaffActivity(staffActivityRes.data)
        setApproverStats(approverStatsRes.data)
      } catch (error: any) {
        toast({
          title: "Failed to load analytics",
          description: error.response?.data?.message || "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [toast])

  return (
    <AuthGuard allowedRoles={["ADMIN", "STAFF"]}>
      <div className="min-h-screen bg-background">
        <AdminNav />
        <main className="mx-auto max-w-7xl p-4 py-8 space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Detailed system insights and performance reports
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Approved Receipts Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Approved Receipts Overview</CardTitle>
                  <CardDescription>
                    All approved receipts grouped by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {approvedReceipts.length > 0 ? (
                    <div className="space-y-6">
                      {approvedReceipts.map(({ category, receipts }) => (
                        <div
                          key={category}
                          className="rounded-lg border border-border p-4"
                        >
                          <h3 className="font-semibold mb-2">{category}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {receipts.length} approved receipt
                            {receipts.length > 1 ? "s" : ""}
                          </p>

                          <div className="space-y-2">
                            {receipts.map((receipt) => (
                              <div
                                key={receipt.id}
                                className="flex items-center gap-3 rounded-md border border-border bg-card p-3"
                              >
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{receipt.receiptName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Uploaded by {receipt.uploadedBy} • Approved by{" "}
                                    {receipt.approvedBy}
                                  </p>
                                </div>
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

              {/* Staff Activity This Month */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Staff Activity (This Month)
                  </CardTitle>
                  <CardDescription>
                    Overview of staff approval activity for the current month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {staffActivity.length > 0 ? (
                    <div className="space-y-3">
                      {staffActivity.map((staff) => (
                        <div
                          key={staff.staffName}
                          className="flex items-center justify-between rounded-md border border-border bg-card p-3"
                        >
                          <div className="flex items-center gap-3">
                            {staff.imageUrl ? (
                              <Image
                                src={staff.imageUrl}
                                alt={staff.staffName}
                                width={32}
                                height={32}
                                className="rounded-full object-cover border border-border"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                {staff.staffName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium">{staff.staffName}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {staff.approvalsThisMonth} approvals
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-muted-foreground">
                      No staff activity recorded this month
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Approver Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users2 className="h-5 w-5 text-primary" />
                    Approver Statistics (All-Time)
                  </CardTitle>
                  <CardDescription>
                    Total number of receipts approved by each staff member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {approverStats.length > 0 ? (
                    <div className="space-y-3">
                      {approverStats.map((staff) => (
                        <div
                          key={staff.staffName}
                          className="flex items-center justify-between rounded-md border border-border bg-card p-3"
                        >
                          <div className="flex items-center gap-3">
                            {staff.imageUrl ? (
                              <Image
                                src={staff.imageUrl}
                                alt={staff.staffName}
                                width={32}
                                height={32}
                                className="rounded-full object-cover border border-border"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                {staff.staffName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium">{staff.staffName}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {staff.totalApproved} approvals
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-muted-foreground">
                      No approver statistics available
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
