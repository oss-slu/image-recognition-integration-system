/* eslint-disable tailwindcss/classnames-order */

/* app/profile/page.tsx
 * very small “template profile” page
 * – shows a name and e-mail pulled from hard-coded vars for now –
 * replace these with real user data or props later.
 */

import React from "react";

export default function ProfilePage() {
  // placeholder data – swap with real user info or fetch logic later
  const user = {
    name: "Firstname Lastname",
    email: "firstnamelastname@example.com",
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>

      <div className="w-full max-w-md rounded-lg border p-6 shadow-md">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Name</h2>
          <p className="text-gray-900">{user.name}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-700">Email</h2>
          <p className="text-gray-900">{user.email}</p>
        </div>
      </div>
    </main>
  );
}
