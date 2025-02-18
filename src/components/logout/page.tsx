"use client"

import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useState } from "react"
import Cookies from "js-cookie"

const Logout: React.FC = () => {
  const [translations, setTranslations] = useState<Record<string, any>>({})
  const [language, setLanguage] = useState<string>(Cookies.get("language") || "en")
  const router = useRouter()

  useEffect(() => {
    fetch("/translations.json")
      .then((res) => res.json())
      .then((data) => setTranslations(data))
  }, [])

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/v1/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        // Clear all cookies
        Object.keys(Cookies.get()).forEach((cookieName) => {
          Cookies.remove(cookieName)
        })

        console.log("Cookies after logout:", document.cookie) // Should be empty

        router.push("/login")
      } else {
        alert(translations[language]?.logoutFailed || "Logout failed")
      }
    } catch (error) {
      console.error("Error:", error)
      alert(translations[language]?.somethingWentWrong || "Something went wrong")
    }
  }

  return (
    <div>
       <button onClick={handleLogout} className="hover:text-amber-300 text-orange-50 p-2 rounded-md bg-orange-800 transition duration-200">
      Logout
    </button>
    </div>
  )
}

export default Logout

