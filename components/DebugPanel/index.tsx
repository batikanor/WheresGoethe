"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function DebugPanel() {
  const [user, setUser] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>("");
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (res.ok) setUser(data.user);
      } catch (e) {
        // no-op
      }
    })();
  }, []);

  const testAuth = async () => {
    try {
      setIsTesting(true);
      const res = await fetch("/api/test", { credentials: "include" });
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
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-3">
      {user && (
        <div className="flex flex-col items-center space-y-2">
          <Image
            src={user.pfp_url}
            alt="Profile"
            className="w-16 h-16 rounded-full"
            width={64}
            height={64}
          />
          <div className="text-center">
            <p className="font-semibold">{user.display_name}</p>
            <p className="text-sm text-gray-600">@{user.username}</p>
          </div>
        </div>
      )}

      <button
        onClick={testAuth}
        disabled={isTesting}
        className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 disabled:opacity-50"
      >
        {isTesting ? "Testing..." : "Test Authentication"}
      </button>

      {testResult && (
        <div className="p-3 rounded-lg bg-gray-100 text-gray-900 text-xs">
          {testResult}
        </div>
      )}
    </div>
  );
}
