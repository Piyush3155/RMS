"use client"

import React, { Suspense, useState, useEffect } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

function LoginPageComponent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Show toast if redirected with access denied
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "access-denied") {
      toast.error("You do not have access to this page.", {
        position: "bottom-right",
        autoClose: 3000,
      })
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok) throw new Error(data.error || "Login failed")

      if (data.role === "manager") {
        router.push("/manager")
      } else if (data.role === "chef") {
        router.push("/kitchen")
      } else {
        setError("Unauthorized role")
      }
    } catch (err: unknown) {
      setLoading(false)
      if (err instanceof Error) {
        setError(err.message)
        toast.error(err.message, { position: "bottom-right", autoClose: 3000 })
      } else {
        setError("An unknown error occurred.")
        toast.error("An unknown error occurred.", { position: "bottom-right", autoClose: 3000 })
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      <ToastContainer />

      {/* Left Side Image */}
      <div className="relative w-full md:w-3/5 h-64 md:h-auto overflow-hidden">
        <Image src="/food.png" alt="Delicious food" fill className="object-cover object-center" priority />
      </div>

      {/* Right Side Login */}
      <div className="w-full md:w-2/5 flex flex-col justify-center p-8 md:p-12 bg-white">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center mb-4">
              <Image src="/biteandco.png" alt="Bites & Co Logo" width={150} height={50} priority />
            </div>
            <p className="text-gray-600">Welcome back! Please log in to your account.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 text-red-700 animate-fadeIn">
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-amber-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              Need assistance?{" "}
              <a href="tel:7019450720" className="font-medium text-amber-700 hover:text-amber-800 hover:underline">
                Contact Support Team
              </a>
            </p>
          </div>

          <div className="mt-12 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Bites & Co. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageComponent />
    </Suspense>
  )
}
