/* eslint-disable tailwindcss/classnames-order */

/* app/profile/page.tsx
 * User profile page with real authentication data
 */

"use client";

import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";

function ProfilePageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/loginscreen");
  };

  if (!user) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 pt-24">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>

      <div className="w-full max-w-md rounded-lg border p-6 shadow-md">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Name</h2>
          <p className="text-gray-900">{user.name}</p>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Email</h2>
          <p className="text-gray-900">{user.email}</p>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Member Since</h2>
          <p className="text-gray-900">
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-lg bg-red-500 py-2 text-white hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
