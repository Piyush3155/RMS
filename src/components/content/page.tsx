"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";

const Content = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [language, setLanguage] = useState(Cookies.get("language") || "en");
  const router = useRouter();

  useEffect(() => {
    fetch("/translations.json")
      .then((res) => res.json())
      .then((data) => setTranslations(data));
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (response.ok) {
        // ✅ Store username & token in cookies securely
        Cookies.set("username", username, {
          expires: 7,
          secure: true,
          sameSite: "lax",
        });

        if (data.token) {
          Cookies.set("auth_token", data.token, {
            expires: 7,
            secure: true,
            sameSite: "lax",
          });
        }

        // Redirect to dashboard after successful login
        router.push(data.redirectUrl || "/dash");
      } else {
        setError(data.error || translations[language]?.invalidCredentials || "Invalid Credentials");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(translations[language]?.somethingWentWrong || "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md border border-blue-300 w-96 p-8 flex-col shadow-lg">
      <div>
        <h1 className="text-2xl text-blue-800 font-bold text-center">
          {translations[language]?.login || "Login"}
        </h1>
        <p className="text-blue-900 text-sm">{translations[language]?.welcomeMessage}</p>
      </div>

      {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}

      <form className="flex flex-col gap-2 mt-4" onSubmit={handleSubmit}>
        <label htmlFor="username" className="text-sm text-black">
          {translations[language]?.username || "Username"}
        </label>
        <input
          type="text"
          id="username"
          placeholder={translations[language]?.usernamePlaceholder || "Enter your username"}
          required
          className="rounded-md text-black border border-blue-300 p-1"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label htmlFor="password" className="text-sm text-black">
          {translations[language]?.password || "Password"}
        </label>
        <input
          type="password"
          id="password"
          placeholder={translations[language]?.passwordPlaceholder || "Enter your password"}
          required
          className="rounded-md text-black border border-blue-300 p-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <p className="text-gray-800 text-sm text-end">
          {translations[language]?.forgotPassword || "Forgot Password?"}{" "}
          <a className="underline text-blue-800" href="/">
            {translations[language]?.clickHere || "Click here"}
          </a>
        </p>

        <button
          type="submit"
          className="bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600 transition"
        >
          {translations[language]?.submit || "Submit"}
        </button>

        <p className="text-gray-800 text-sm text-end">
          {translations[language]?.dontHaveAccount || "Don't have an account?"}{" "}
          <Link href="/reg" className="hover:underline text-blue-800">
            {translations[language]?.clickHere || "Click here"}
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Content;
