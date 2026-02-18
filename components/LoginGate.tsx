"use client";

import { useState, useEffect } from "react";
import { Lock } from "lucide-react";

export function LoginGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  // Access password from env or default
  const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD || "123456";

  useEffect(() => {
    setMounted(true);
    const auth = sessionStorage.getItem("is_authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem("is_authenticated", "true");
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("비밀번호가 올바르지 않습니다.");
    }
  };

  // Prevent flash of login screen if already authenticated
  if (!mounted) return null;

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mb-4">
            <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            접속 제한 구역
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            인가된 사용자만 접속할 수 있습니다.<br/>
            6자리 비밀번호를 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="sr-only">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              maxLength={6}
              className="block w-full rounded-md border-0 py-3 text-center text-2xl tracking-[0.5em] text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-700"
              placeholder="••••••"
              value={password}
              onChange={(e) => {
                // Ensure only numbers and max 6 chars
                const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                setPassword(val);
                setError("");
              }}
            />
          </div>

          {error && (
            <div className="text-center text-sm text-red-600 animate-pulse bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={password.length !== 6}
            className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            접속하기
          </button>
        </form>
        <p className="text-xs text-center text-gray-400 mt-4">
          보안을 위해 접속 정보는 브라우저를 닫으면 초기화됩니다.
        </p>
      </div>
    </div>
  );
}
