"use client"

import { GoogleOAuthProvider } from "@react-oauth/google"

export default function Providers({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!
    
    console.log("Google Client ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)


    return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>
}
