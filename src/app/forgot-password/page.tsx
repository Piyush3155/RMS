"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")

    try {
      const res = await fetch("/api/v1/forgotpassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to process request")
      }

      setStatus("success")
      setMessage("Password has been sent to your email address.")
    } catch (err: unknown) {
      setStatus("error")
      if (err instanceof Error) {
        setMessage(err.message)
      } else {
        setMessage("An unknown error occurred.")
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Side Image with Overlay */}
      <div className="relative w-full md:w-3/5 h-64 md:h-auto overflow-hidden">
        <div className="absolute inset-0  z-10" />
        <Image src="/food.png" alt="Delicious food" fill className="object-cover object-center" priority />
      </div>

      {/* Right Side Content */}
      <div className="w-full md:w-2/5 flex flex-col justify-center p-8 md:p-12 bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Logo and Welcome */}
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center mb-4">
              <Image src="/biteandco.png" alt="Bites & Co Logo" width={150} height={50} priority />
            </div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Forgot Password</h1>
            <p className="text-gray-600">Enter your email to receive your password</p>
          </div>

          {/* Form */}
          {status === "success" ? (
            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500 text-green-700 animate-fadeIn">
              <h3 className="font-medium text-lg mb-2">Email Sent!</h3>
              <p>{message}</p>
              <button
                onClick={() => router.push("/login")}
                className="mt-4 w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === "error" && (
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 text-red-700 animate-fadeIn">
                  <span className="font-medium">{message}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
                    placeholder="your@email.com"
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Sending..." : "Send Password"}
              </button>

              {/* Back to Login */}
              <Link
                href="/"
                className="flex items-center justify-center text-amber-700 hover:text-amber-800 hover:underline mt-4"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Login
              </Link>
            </form>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Bites & Co. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
