"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

// Import the Menu component with dynamic import to prevent server-side rendering
const Menu = dynamic(() => import("@/components/menu/page"), {
  ssr: false, // This ensures the component only renders on the client
  loading: () => <div className="p-8 text-center">Loading menu...</div>,
})

export default function OrdersPage() {
  return (
    <div className="p-0 m-0">
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <Menu />
      </Suspense>
    </div>
  )
}
