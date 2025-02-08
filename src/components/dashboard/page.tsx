"use client";

import React, { useEffect, useState } from "react";

const Dashboard = () => {
  const [username, setUsername] = useState<string>("");
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    // Retrieve the data from cookies
    const cookies: Record<string, string> = document.cookie.split(";").reduce<Record<string, string>>((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      acc[key] = value;
      return acc;
    }, {});

    setUsername(cookies.username || "Guest");
    setRole(cookies.role || "user");
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
     
      <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-center text-blue-600 mb-6">Profile</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-700">Username: {username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-700">Role: {role}</p>
          </div>
          <div>
            <a href="/logout" className="text-blue-600 hover:underline">Logout</a>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Dashboard;
