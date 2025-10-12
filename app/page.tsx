"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getStoredUser, isAuthenticated } from "@/lib/auth"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    const user = getStoredUser()
    if (user) {
      switch (user.role) {
        case "STUDENT":
          router.push("/student/dashboard")
          break
        case "STAFF":
          router.push("/staff/dashboard")
          break
        case "ADMIN":
          router.push("/admin/dashboard")
          break
        default:
          router.push("/login")
      }
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
