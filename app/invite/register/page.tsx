"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { GraduationCap, Loader2, Upload, X } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

export default function InviteRegisterPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const [loading, setLoading] = useState(false)
    const [signingIn, setSigningIn] = useState(false)
    const [token, setToken] = useState<string | null>(null)
    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
    })

    useEffect(() => {
        const tokenParam = searchParams.get("token")
        if (!tokenParam) {
            toast({
                title: "Invalid invitation",
                description: "No invitation token found",
                variant: "destructive",
            })
            router.push("/login")
        } else {
            setToken(tokenParam)
        }
    }, [searchParams, router, toast])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Profile picture must be less than 5MB",
                    variant: "destructive",
                })
                return
            }
            setProfileImage(file)
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleRemoveImage = () => {
        setProfileImage(null)
        setImagePreview(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!token) {
            toast({
                title: "Invalid invitation",
                description: "No invitation token found",
                variant: "destructive",
            })
            return
        }

        if (formData.password !== formData.confirmPassword) {
            toast({
                title: "Passwords don’t match",
                description: "Please ensure both passwords are the same",
                variant: "destructive",
            })
            return
        }

        if (!profileImage) {
            toast({
                title: "Profile picture required",
                description: "Please upload a profile picture",
                variant: "destructive",
            })
            return
        }

        setLoading(true)
        try {
            const formDataToSend = new FormData()
            formDataToSend.append("file", profileImage)

            const jsonBlob = new Blob(
                [
                    JSON.stringify({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        password: formData.password,
                    }),
                ],
                { type: "application/json" }
            )
            formDataToSend.append("data", jsonBlob)

            const response = await authApi.registerWithInvite(token, formDataToSend, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
            })

            localStorage.setItem("accessToken", response.data.accessToken)
            localStorage.setItem("refreshToken", response.data.refreshToken)
            localStorage.setItem("user", JSON.stringify(response.data.user))

            const userRole = response.data.user.role
            const welcomeMsg =
                userRole === "ADMIN"
                    ? "Welcome, Admin! You now have full access to EduVault’s control panel."
                    : userRole === "STAFF"
                        ? "Welcome aboard! You now have privileged access to manage and review student submissions."
                        : "Welcome to EduVault!"

            toast({
                title: "Registration successful 🎉",
                description: welcomeMsg,
            })

            // Signing-in overlay
            setSigningIn(true)

            setTimeout(() => {
                if (userRole === "ADMIN") router.push("/admin/dashboard")
                else if (userRole === "STAFF") router.push("/staff/dashboard")
                else router.push("/login")
            }, 1500)
        } catch (error: any) {
            console.error("Registration error:", error)
            toast({
                title: "Registration failed",
                description: error.response?.data?.message || "Invalid or expired invitation",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4"
        >
            {/* --- EduVault Logo + Welcome Message --- */}
            <div className="mb-6 flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-md">
                        <GraduationCap className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-2xl font-semibold">EduVault</span>
                </div>
                <p className="text-sm text-muted-foreground">
                    Welcome! You’ve been invited to join the EduVault team.
                    Complete your registration below to get started.
                </p>
            </div>

            {/* Registration Form */}
            <Card className="w-full max-w-md shadow-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
                    <CardDescription>Create your account to access EduVault’s platform</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                type="text"
                                placeholder="John"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                type="text"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    setFormData({ ...formData, confirmPassword: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="profilePicture">Profile Picture</Label>
                            {imagePreview ? (
                                <div className="relative">
                                    <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-border">
                                        <Image
                                            src={imagePreview || "/placeholder.svg"}
                                            alt="Profile preview"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -right-2 -top-2 h-6 w-6"
                                        onClick={handleRemoveImage}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="profilePicture"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <Label
                                        htmlFor="profilePicture"
                                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-accent"
                                    >
                                        <Upload className="h-4 w-4" />
                                        Upload Photo
                                    </Label>
                                    <span className="text-sm text-muted-foreground">Max 5MB</span>
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Signing In Overlay */}
            {signingIn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="flex items-center gap-3 rounded-lg bg-white p-6 shadow-lg">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="font-medium">Signing you in...</span>
                    </div>
                </div>
            )}
        </motion.div>
    )
}
