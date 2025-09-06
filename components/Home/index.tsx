"use client";

import GlobeGame from "@/components/GlobeGame";
import { useSignIn } from "@/hooks/use-sign-in";
import { env } from "@/lib/env";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const { signIn, mockSignIn, isLoading, isSignedIn, user } = useSignIn({
    autoSignIn: false,
  });
  const [testResult, setTestResult] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);

  const testAuth = async () => {
    try {
      const res = await fetch("/api/test", {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        setTestResult(`Auth test failed: ${data.error}`);
        return;
      }

      setTestResult(`Auth test succeeded! Server response: ${data.message}`);
    } catch (error) {
      setTestResult(
        "Auth test failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  return (
    <div className="bg-white text-black flex min-h-screen flex-col items-center justify-center p-4">
      {/* Small debug toggle - top-left */}
      <button
        onClick={() => setShowDebug((v) => !v)}
        className="fixed top-3 left-3 z-20 rounded-lg px-3 py-2 text-xs font-semibold text-white bg-gray-800 hover:bg-gray-900 shadow"
      >
        Debug
      </button>

      <div className="text-center space-y-4">
        {!isSignedIn ? (
          <AuthButtons
            onSignIn={signIn}
            onMockSignIn={mockSignIn}
            isLoading={isLoading}
          />
        ) : (
          <div className="space-y-4">
            {user && showDebug && (
              <div className="flex flex-col items-center space-y-2">
                <Image
                  src={user.pfp_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full"
                  width={80}
                  height={80}
                />
                <div className="text-center">
                  <p className="font-semibold">{user.display_name}</p>
                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </div>
            )}
            {showDebug && (
              <button
                onClick={testAuth}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200"
              >
                Test Authentication
              </button>
            )}

            {/* Globe game below the Test Authentication button */}
            <div className="mt-4">
              <GlobeGame />
            </div>

            {showDebug && testResult && (
              <div className="mt-4 p-4 rounded-lg bg-gray-100 text-black text-sm">
                {testResult}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AuthButtons({
  onSignIn,
  onMockSignIn,
  isLoading,
}: {
  onSignIn: () => Promise<any>;
  onMockSignIn: () => Promise<any>;
  isLoading: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={onSignIn}
        disabled={isLoading}
        className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
      {env.NEXT_PUBLIC_IS_LOCAL_DEVELOPMENT === "true" && (
        <button
          onClick={onMockSignIn}
          disabled={isLoading}
          className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Mock Context
        </button>
      )}
    </div>
  );
}
