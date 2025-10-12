"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authApi } from "@/lib/api"
import { setStoredUser } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { GraduationCap, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({
    matricNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [formData, setFormData] = useState({
    matricNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateField = (name: string, value: string) => {
    let error = ""

    switch (name) {
      case "matricNumber":
        if (!value.trim()) error = "Matric number is required"
        break
      case "email":
        if (!value.trim()) error = "Email is required"
        else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value))
          error = "Invalid email format"
        else if (!value.endsWith("@student.funaab.edu.ng"))
          error = "Please use your FUNAAB email address"
        break
      case "password":
        if (!value.trim()) error = "Password is required"
        else if (value.length < 6) error = "Password must be at least 6 characters"
        break
      case "confirmPassword":
        if (!value.trim()) error = "Please confirm your password"
        else if (value !== formData.password) error = "Passwords do not match"
        break
    }

    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    validateField(id, value)
  }

  const isFormValid =
    Object.values(errors).every((err) => !err) &&
    formData.matricNumber.trim() &&
    formData.email.trim() &&
    formData.password.trim() &&
    formData.confirmPassword.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    Object.entries(formData).forEach(([key, value]) => validateField(key, value))
    if (!isFormValid) return

    setIsLoading(true)

    try {
      const response = await authApi.registerStudent({
        matricNumber: formData.matricNumber,
        email: formData.email,
        password: formData.password,
      })

      const { accessToken, refreshToken, user } = response.data
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      setStoredUser(user)

      toast({
        title: "Registration successful",
        description: "Welcome to EduVault!",
      })

      console.log(" Registration success, showing success animation...")
      setSuccess(true)

      setTimeout(() => {
        router.push("/student/dashboard")
      }, 2000)
    } catch (error: any) {
      const message = error.response?.data?.message
      toast({
        title: "Registration failed",
        description: message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
        <h2 className="mt-4 text-2xl font-semibold text-foreground">Account Created!</h2>
        <p className="text-muted-foreground mt-2">Redirecting to your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Register as a new student</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matricNumber">Matric Number</Label>
              <Input
                id="matricNumber"
                type="text"
                placeholder="12345"
                value={formData.matricNumber}
                onChange={handleChange}
                className={errors.matricNumber ? "border-red-500" : ""}
                required
              />
              {errors.matricNumber && <p className="text-sm text-red-500">{errors.matricNumber}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">FUNAAB Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="@student.funaab.edu.ng"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "border-red-500" : ""}
                required
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-2 flex items-center px-1 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                  required
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute inset-y-0 right-2 flex items-center px-1 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !isFormValid}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
