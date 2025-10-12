"use client"

import { AuthGuard } from "@/components/auth-guard"
import { StaffNav } from "@/components/staff-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NotificationList } from "@/components/notification-list"

export default function StaffNotificationsPage() {
  return (
    <AuthGuard allowedRoles={["STAFF", "ADMIN"]}>
      <div className="min-h-screen bg-background">
        <StaffNav />
        <main className="mx-auto max-w-7xl p-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with system notifications</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>Your recent notifications and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationList />
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
