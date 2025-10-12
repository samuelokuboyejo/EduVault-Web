"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { StudentNav } from "@/components/student-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { receiptApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"

const categories = [
  { key: "college-due", label: "College Due" },
  { key: "dept-due", label: "Department Due" },
  { key: "sch-fee", label: "School Fee" },
  { key: "remita-sch-fee", label: "Remita School Fee" },
  { key: "course-form", label: "Course Form" },
  { key: "invoice", label: "School Fee Invoice" },
]

const levels = [
  "LEVEL_100",
  "LEVEL_200",
  "LEVEL_300",
  "LEVEL_400",
  "LEVEL_500",
  "LEVEL_600",
]

function formatLevel(level: string): string {
  return level.replace("LEVEL_", "") + " Level"
}

export default function UploadPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [success, setSuccess] = useState<Record<string, boolean>>({})
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [studentLevel, setStudentLevel] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [blocked, setBlocked] = useState<Record<string, boolean>>({})
  const [blockedMessage, setBlockedMessage] = useState<Record<string, string>>({})

  const handleFileChange = (category: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [category]: file }))
    setSuccess((prev) => ({ ...prev, [category]: false }))
    setProgress((prev) => ({ ...prev, [category]: 0 }))
  }

  const handleLevelChange = (category: string, level: string) => {
    setStudentLevel((prev) => ({ ...prev, [category]: level }))
    setBlocked((prev) => ({ ...prev, [category]: false }))
    setBlockedMessage((prev) => ({ ...prev, [category]: "" }))
  }

  const handleUpload = async (category: string) => {
    const file = files[category]
    const level = studentLevel[category]

    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      })
      return
    }

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      })
      return
    }

    if (!level) {
      toast({
        title: "Student Level Required",
        description: "Please select your student level",
        variant: "destructive",
      })
      return
    }

    if (blocked[category]) {
      toast({
        title: "Duplicate Upload",
        description: blockedMessage[category] || "You cannot upload another receipt for this level.",
        variant: "destructive",
      })
      return
    }

    setUploading((prev) => ({ ...prev, [category]: true }))

    try {
      const uploadData = new FormData()
      uploadData.append("file", file)
      uploadData.append("data", JSON.stringify({ studentLevel: level }))

      await receiptApi.upload(category, uploadData, {
        onUploadProgress: (event: ProgressEvent) => {
          const percentCompleted = Math.round((event.loaded * 100) / event.total)
          setProgress((prev) => ({ ...prev, [category]: percentCompleted }))
        },
      })

      setSuccess((prev) => ({ ...prev, [category]: true }))
      setFiles((prev) => ({ ...prev, [category]: null }))
      setStudentLevel((prev) => ({ ...prev, [category]: "" }))
      setProgress((prev) => ({ ...prev, [category]: 100 }))

      toast({
        title: "Upload successful",
        description: "Your receipt has been submitted for approval",
      })

      setTimeout(() => {
        router.push("/student/dashboard")
      }, 1500)
    } catch (error: any) {
      const backendMessage = error.response?.data?.message || ""

      if (backendMessage.includes("already uploaded a receipt")) {
        toast({
          title: "Duplicate Upload",
          description: backendMessage,
          variant: "destructive",
        })
        setBlocked((prev) => ({ ...prev, [category]: true }))
        setBlockedMessage((prev) => ({ ...prev, [category]: backendMessage }))
      } else if (backendMessage.toLowerCase().includes("user not found")) {
        toast({
          title: "User Not Found",
          description: "We couldn’t find your student record. Please log in again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Upload failed",
          description: backendMessage || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }

      setProgress((prev) => ({ ...prev, [category]: 0 }))
    } finally {
      setUploading((prev) => ({ ...prev, [category]: false }))
    }
  }

  return (
    <AuthGuard allowedRoles={["STUDENT"]}>
      <div className="min-h-screen bg-background">
        <StudentNav />
        <main className="mx-auto max-w-7xl p-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Upload Receipts</h1>
            <p className="text-muted-foreground">Submit your receipts for approval</p>
          </div>

          <Tabs defaultValue={categories[0].key} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
              {categories.map((cat) => (
                <TabsTrigger key={cat.key} value={cat.key} className="text-xs lg:text-sm">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.key} value={cat.key}>
                <Card>
                  <CardHeader>
                    <CardTitle>Upload {cat.label}</CardTitle>
                    <CardDescription>
                      Upload your {cat.label.toLowerCase()} receipt as a PDF file
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {blocked[cat.key] && (
                      <div className="flex items-center gap-2 bg-red-100 text-red-800 p-3 rounded-md border border-red-300">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">{blockedMessage[cat.key]}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor={`${cat.key}-level`}>Student Level</Label>
                      <select
                        id={`${cat.key}-level`}
                        className="w-full border rounded px-3 py-2"
                        value={studentLevel[cat.key] || ""}
                        onChange={(e) => handleLevelChange(cat.key, e.target.value)}
                      >
                        <option value="">Select Level</option>
                        {levels.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {formatLevel(lvl)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${cat.key}-file`}>Receipt File (PDF)</Label>
                      <Input
                        id={`${cat.key}-file`}
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(cat.key, e.target.files?.[0] || null)}
                      />
                    </div>

                    {uploading[cat.key] && (
                      <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
                        <div
                          className="h-3 bg-primary transition-all"
                          style={{ width: `${progress[cat.key] || 0}%` }}
                        />
                      </div>
                    )}

                    <Button
                      onClick={() => handleUpload(cat.key)}
                      disabled={uploading[cat.key] || success[cat.key] || blocked[cat.key]}
                      className="w-full"
                    >
                      {uploading[cat.key] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : success[cat.key] ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Uploaded Successfully
                        </>
                      ) : blocked[cat.key] ? (
                        <>
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Already Uploaded
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Receipt
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  )
}
