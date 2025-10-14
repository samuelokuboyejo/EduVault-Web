"use client"

import { Suspense } from "react"
import ResetPasswordContent from "./reset-password-content"

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    )
}
