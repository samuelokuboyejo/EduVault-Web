"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { GraduationCap, Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const token = searchParams.get("token") || ""

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [countdown, setCountdown] = useState(3)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!token) {
            toast({
                title: "Invalid link",
                description: "Reset token missing or invalid.",
                variant: "destructive",
            })
            return
        }

        if (password !== confirmPassword) {
            toast({
                title: "Passwords do not match",
                description: "Please make sure both fields are identical.",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)
        try {
            await authApi.resetPassword(token, password)
            toast({
                title: "Password reset successful",
                description: "You will be redirected to login shortly.",
            })
            setIsSuccess(true)
        } catch (error: any) {
            toast({
                title: "Reset failed",
                description: error.response?.data?.message || "Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        let timer: NodeJS.Timeout
        if (isSuccess) {
            timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        router.push("/login")
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => clearInterval(timer)
    }, [isSuccess, router])

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                        <GraduationCap className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        {isSuccess
                            ? "Your password has been successfully reset!"
                            : "Enter your new password below."}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {!isSuccess ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Re-enter new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <p className="text-muted-foreground">
                                Redirecting to login in <strong>{countdown}</strong> seconds...
                            </p>
                            <Button
                                onClick={() => router.push("/login")}
                                variant="outline"
                                className="mt-2"
                            >
                                Go to Login Now
                            </Button>
                        </div>
                    )}

                    {!isSuccess && (
                        <div className="mt-4 text-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
