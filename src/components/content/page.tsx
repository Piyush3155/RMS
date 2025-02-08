"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Content = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // Default role selection
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to the respective page based on role
        router.push(data.redirectUrl);
      } else {
        alert("Invalid Credentials");
        setError(data.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-md border border-blue-300 w-96 p-8 flex-col shadow-lg">
      <div>
        <h1 className="text-2xl text-blue-800 font-bold text-center">LOGIN</h1>
        <p className="text-blue-900 text-sm">Welcome! Enter your credentials</p>
      </div>
      <form className="flex flex-col gap-2 mt-4" onSubmit={handleSubmit}>
        {/* Username Input */}
        <label htmlFor="username" className="text-sm text-black">
          Username
        </label>
        <input
          type="text"
          id="username"
          placeholder="Username"
          required
          className="rounded-md text-black border border-blue-300 p-1"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* Password Input */}
        <label htmlFor="password" className="text-sm text-black">
          Password
        </label>
        <input
          type="password"
          id="password"
          placeholder="Password"
          required
          className="rounded-md text-black border border-blue-300 p-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-gray-800 text-sm text-end">
          Forgot Password? <a className="underline text-blue-800" href="/">Click here</a>
        </p>
        {/* Role Selection Dropdown */}
        <label htmlFor="role" className="text-sm text-black">
          Select Role
        </label>
        <select
          id="role"
          className="rounded-md text-black border border-blue-300 p-1 bg-white"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600 transition"
        >
          Submit
        </button>


<p className="text-gray-800 text-sm text-end">
  Dont have an account?{" "}
  <Link href="/reg" className="underline text-blue-800">
    Click here
  </Link>
</p>

      </form>
    </div>
  );
};

export default Content;
