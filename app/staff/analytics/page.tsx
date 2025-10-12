"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { StaffNav } from "@/components/staff-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { analyticsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { FileCheck, TrendingUp, Users, Calendar, Loader2 } from "lucide-react"

export default function StaffAnalyticsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    approvedCount: 0,
    uploadsThisMonth: 0,
    approvedThisWeek: 0,
    newStudents: 0,
  })

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [approved, uploads, weekly, students] = await Promise.all([
          analyticsApi.getApprovedCount(),
          analyticsApi.getUploadsThisMonth(),
          analyticsApi.getApprovedThisWeek(),
          analyticsApi.getNewStudents(),
        ])

        setStats({
          approvedCount: approved.data.count || 0,
          uploadsThisMonth: uploads.data.count || 0,
          approvedThisWeek: weekly.data.count || 0,
          newStudents: students.data.count || 0,
        })
      } catch (error: any) {
        toast({
          title: "Failed to load analytics",
          description: error.response?.data?.message || "Please try again",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [toast])

  const statCards = [
    {
      title: "Total Approved",
      value: stats.approvedCount,
      icon: FileCheck,
      description: "All time approved receipts",
    },
    {
      title: "Uploads This Month",
      value: stats.uploadsThisMonth,
      icon: TrendingUp,
      description: "Receipts uploaded this month",
    },
    {
      title: "Approved This Week",
      value: stats.approvedThisWeek,
      icon: Calendar,
      description: "Receipts approved this week",
    },
    {
      title: "New Students",
      value: stats.newStudents,
      icon: Users,
      description: "Registered this month",
    },
  ]

  return (
    <AuthGuard allowedRoles={["STAFF", "ADMIN"]}>
      <div className="min-h-screen bg-background">
        <StaffNav />
        <main className="mx-auto max-w-7xl p-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">View receipt statistics and insights</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
