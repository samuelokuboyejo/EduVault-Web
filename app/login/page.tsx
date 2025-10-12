"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authApi } from "@/lib/api"
import { setStoredUser } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { GraduationCap, Loader2 } from "lucide-react"
import { GoogleLogin } from "@react-oauth/google"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({ identifier: "", password: "" })
  const formRef = useRef<HTMLFormElement>(null)

  const handleError = (error: any, defaultMessage: string) => {
    console.error("Login error:", error)
    const message = error.response?.data?.message || error.message || defaultMessage

    setErrorMessage(message)

    toast({
      title: "Login Failed ❌",
      description: message.includes("User not found") ? (
        <span>
          No EduVault account is linked to this Google account.&nbsp;
          <Link
            href="/register"
            className="underline text-primary font-medium hover:text-primary/80"
          >
            Click here to sign up.
          </Link>
        </span>
      ) : message,
      variant: "destructive",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const credentials = {
        identifier: formData.identifier.trim(),
        password: formData.password,
      }

      const response = await authApi.login(credentials)
      const { accessToken, refreshToken, user } = response.data

      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      setStoredUser(user)

      toast({
        title: "Login Successful 🎉",
        description: `Welcome back, ${user.email}`,
      })

      setIsRedirecting(true)

      setTimeout(() => redirectByRole(user.role, router), 1500)
    } catch (error: any) {
      if (formRef.current) {
        formRef.current.classList.remove("shake")
        void formRef.current.offsetWidth
        formRef.current.classList.add("shake")
      }

      handleError(error, "Invalid email or password. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async (credentialResponse: any) => {
    const credential = credentialResponse?.credential
    if (!credential) {
      toast({
        title: "Google Login Failed ❌",
        description: "No credential returned from Google. Please try again.",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Authenticating with Google...",
        description: "Please wait a moment while we verify your account.",
      })

      const response = await authApi.googleLogin({ idToken: credential })
      const { accessToken, refreshToken, user } = response.data

      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      setStoredUser(user)

      toast({
        title: "Google Login Successful 🎉",
        description: "Redirecting to your dashboard...",
      })

      setIsRedirecting(true)
      setTimeout(() => redirectByRole(user.role, router), 1500)
    } catch (error: any) {
      handleError(error, "Something went wrong while authenticating with Google.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative">
      {/* Signing in overlay */}
      {isRedirecting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-lg font-medium">Signing in...</p>
        </div>
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">EduVault</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>

        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 transition-all duration-300">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or Matric Number</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Enter your email or matric number"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {errorMessage && (
              <p className="text-red-500 text-sm font-medium text-center">{errorMessage}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || isRedirecting}>
              {(isLoading || isRedirecting) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center space-y-2">
            <p className="text-muted-foreground text-sm">or</p>
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() =>
                toast({
                  title: "Google Login Failed ❌",
                  description: "Could not authenticate with Google",
                  variant: "destructive",
                })
              }
            />
          </div>

          <div className="mt-4 space-y-2 text-center text-sm">
            <Link href="/forgot-password" className="text-muted-foreground hover:text-primary">
              Forgot your password?
            </Link>
            <div className="text-muted-foreground">
              New student?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Create an account
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function redirectByRole(role: string, router: any) {
  switch (role) {
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
      router.push("/")
  }
}
