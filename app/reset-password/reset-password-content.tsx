"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import axios from "axios"
import {
    Loader2,
    CheckCircle,
    GraduationCap,
    Eye,
    EyeOff,
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

export default function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [countdown, setCountdown] = useState(5)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const passwordStrength = useMemo(() => {
        let score = 0
        if (password.length >= 8) score += 1
        if (/[A-Z]/.test(password)) score += 1
        if (/[0-9]/.test(password)) score += 1
        if (/[^A-Za-z0-9]/.test(password)) score += 1
        return score
    }, [password])

    const strengthLabel = ["Too weak", "Weak", "Good", "Strong"]
    const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!token) {
            toast.error("Reset token is missing or invalid.")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.")
            return
        }

        if (passwordStrength < 2) {
            toast.error("Password is too weak. Use a mix of letters, numbers, and symbols.")
            return
        }

        setIsLoading(true)
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/reset-password`, {
                token,
                newPassword: password,
            })
            toast.success("Password reset successful!")
            setSuccess(true)
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || "Failed to reset password. Please try again."
            )
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (success) {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        router.push("/login")
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [success, router])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-2">
                    <div className="flex items-center justify-center mb-2">
                        <GraduationCap className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>
                        {success
                            ? "Your password has been reset successfully!"
                            : "Enter a new strong password below."}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {success ? (
                        <div className="flex flex-col items-center space-y-4">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <p>
                                Redirecting to login in <strong>{countdown}</strong> seconds...
                            </p>
                            <Button onClick={() => router.push("/login")}>Go to Login</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {password && (
                                <div>
                                    <Progress
                                        value={(passwordStrength / 4) * 100}
                                        className={`h-2 mb-1 ${strengthColors[passwordStrength - 1] || "bg-gray-300"}`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Strength: {strengthLabel[passwordStrength - 1] || "Too weak"}
                                    </p>
                                </div>
                            )}

                            <div className="relative">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || !password || !confirmPassword}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>

                            <div className="text-center text-sm">
                                <Button
                                    type="button"
                                    variant="link"
                                    onClick={() => router.push("/login")}
                                >
                                    Back to Login
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
