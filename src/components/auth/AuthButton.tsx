"use client";

import { signIn, signOut, useSession } from "next-auth/react";

interface AuthButtonProps {
  className?: string;
}

export default function AuthButton({ className = "" }: AuthButtonProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div
        className={`animate-pulse bg-gray-300 rounded h-8 w-20 ${className}`}
      />
    );
  }

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors ${className}`}
      >
        Sign Out
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors ${className}`}
    >
      Sign In
    </button>
  );
}
