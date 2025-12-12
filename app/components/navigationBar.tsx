"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

const BottomNav = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/loginscreen");
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-20 flex w-full justify-around border-b bg-white py-2 shadow-md">
      <Link href="/about">
        <div className="flex cursor-pointer flex-col items-center text-gray-700">
          <div className="size-6 rounded-full bg-gray-500"></div>
          <span className="text-xs">About</span>
        </div>
      </Link>

      <Link href="/">
        <div className="flex cursor-pointer flex-col items-center text-gray-700">
          <div className="size-6 rounded-full bg-gray-500"></div>
          <span className="text-xs">Home</span>
        </div>
      </Link>

      <Link href="/previousImages">
        <div className="flex cursor-pointer flex-col items-center text-gray-700">
          <div className="size-6 rounded-full bg-gray-500"></div>
          <span className="text-xs">Search History</span>
        </div>
      </Link>

      <Link href="/profile">
        <div className="flex cursor-pointer flex-col items-center text-gray-700">
          <div className="size-6 rounded-full bg-gray-500"></div>
          <span className="text-xs">Profile</span>
        </div>
      </Link>

      {user && (
        <button
          onClick={handleLogout}
          className="flex cursor-pointer flex-col items-center text-gray-700 hover:text-red-600 transition-colors"
        >
          <div className="size-6 rounded-full bg-red-500"></div>
          <span className="text-xs">Logout</span>
        </button>
      )}
    </nav>
  );
};

export default BottomNav;
