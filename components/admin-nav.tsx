"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { GraduationCap, LayoutDashboard, Users, BarChart3, Bell, Settings, LogOut, Menu } from "lucide-react"
import { clearAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { NotificationBadge } from "@/components/notification-badge"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, showBadge: true },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    clearAuth()
    router.push("/login")
  }

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">EduVault Admin</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn("gap-2", pathname === item.href && "bg-accent text-accent-foreground")}
                >
                  {item.showBadge ? <NotificationBadge /> : <Icon className="h-4 w-4" />}
                  {item.label}
                </Button>
              </Link>
            )
          })}
          <Button variant="ghost" onClick={handleLogout} className="gap-2 text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-4 pt-8">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-2",
                        pathname === item.href && "bg-accent text-accent-foreground",
                      )}
                    >
                      {item.showBadge ? <NotificationBadge /> : <Icon className="h-4 w-4" />}
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
              <Button
                variant="ghost"
                onClick={() => {
                  handleLogout()
                  setOpen(false)
                }}
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
