"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { URLEncryption } from "@/lib/encryption"
import { Shield, AlertCircle, Loader2 } from 'lucide-react'

// Import the Menu component with dynamic import to prevent server-side rendering
const Menu = dynamic(() => import("@/components/menu/page"), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center">
      <div className="w-16 h-16 border-amber-600 rounded border-2xl animate-pulse"></div>
    </div>
  ),
})

function OrdersPageContent() {
  const searchParams = useSearchParams()
  const [decryptionStatus, setDecryptionStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [, setTableNumber] = useState<string | null>(null)

  useEffect(() => {
    // Check for encrypted token first
    const token = searchParams.get("token")
    const directTable = searchParams.get("table")

    if (token) {
      // Handle encrypted access
      try {
        const decryptedData = URLEncryption.decryptURL(token)

        if (!decryptedData) {
          setDecryptionStatus("error")
          setErrorMessage("Invalid or expired security token")
          return
        }

        // Extract table number from decrypted data
        const table = decryptedData.params.table
        if (table) {
          setTableNumber(table)
          // Store in localStorage for the Menu component
          localStorage.setItem("tableNumber", table)
          setDecryptionStatus("success")
        } else {
          setDecryptionStatus("error")
          setErrorMessage("No table information found in token")
        }
      } catch (error) {
        console.error("Decryption error:", error)
        setDecryptionStatus("error")
        setErrorMessage("Failed to decrypt security token")
      }
    } else if (directTable) {
      // Handle direct access (legacy support)
      setTableNumber(directTable)
      localStorage.setItem("tableNumber", directTable)
      setDecryptionStatus("success")
    } else {
      setDecryptionStatus("error")
      setErrorMessage("No table information or security token provided")
    }
  }, [searchParams])

  if (decryptionStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <Shield className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Secure Access</h1>
            <p className="text-gray-600">Verifying your access...</p>
          </div>

          <div className="space-y-4">
            <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Processing request...</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (decryptionStatus === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
            <p className="text-gray-600">Unable to verify your access</p>
          </div>

          <div className="space-y-4">
            <AlertCircle className="mx-auto text-red-500" size={32} />
            <div className="text-red-600 font-medium">Access Denied</div>
            <div className="text-sm text-gray-600">{errorMessage}</div>
            <button
              onClick={() => window.location.href = "/"}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go to Homepage
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-xs text-gray-500 space-y-1">
              <div>🔒 Your connection is secure</div>
              <div>🕒 Tokens expire after 24 hours</div>
              <div>🛡️ End-to-end encryption enabled</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-0 m-0">
      {/* Success indicator for encrypted access */}

      
      <Suspense fallback={<div className="p-8 text-center">Loading menu...</div>}>
        <Menu />
      </Suspense>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <OrdersPageContent />
    </Suspense>
  )
}
