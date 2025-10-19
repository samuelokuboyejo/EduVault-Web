"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AdminNav } from "@/components/admin-nav"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // mock: simulate loading stored settings later (for now, we’ll just default to false)
  useEffect(() => {
    const storedValue = localStorage.getItem("autoApprovalEnabled")
    if (storedValue !== null) {
      setAutoApprovalEnabled(storedValue === "true")
    }
  }, [])

  const handleToggleChange = (checked: boolean) => {
    setAutoApprovalEnabled(checked)
    setIsDirty(true)
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // TO DO - connect with endpoint
      // mock save — I’ll replace this with a backend call later
      localStorage.setItem("autoApprovalEnabled", String(autoApprovalEnabled))

      toast({
        title: "Settings saved",
        description: "Your system configuration has been updated.",
      })
      setIsDirty(false)
    } catch (error) {
      toast({
        title: "Save failed",
        description: "An error occurred while saving settings.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background">
        <AdminNav />
        <main className="mx-auto max-w-7xl p-4 py-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              System configuration and preferences
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>
                Configure automatic receipt approval and rejection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                  <Label htmlFor="autoApproval" className="text-base font-medium">
                    Automate Receipt Approval/Rejection
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve valid receipts or reject invalid ones.
                  </p>
                </div>
                <Switch
                  id="autoApproval"
                  checked={autoApprovalEnabled}
                  onCheckedChange={handleToggleChange}
                />
              </div>

              {/* Additional settings can be added here later */}
            </CardContent>

            {isDirty && (
              <CardFooter className="flex justify-end border-t pt-4">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Save className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}
