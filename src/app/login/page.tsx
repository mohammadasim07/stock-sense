"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const DEMO_ACCOUNTS = [
  {
    name: "Alex Morgan",
    email: "admin@stocksense.io",
    role: "ADMIN",
    desc: "Warehouse Manager (Full System Access)",
  },
  {
    name: "Sarah Manager",
    email: "manager@stocksense.io",
    role: "MANAGER",
    desc: "Operations Lead (Approvals & Transfers)",
  },
  {
    name: "John Operator",
    email: "operator@stocksense.io",
    role: "OPERATOR",
    desc: "Stock Handler (Pick & Validate)",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("admin@stocksense.io");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStep("otp");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send OTP code");
      }
    } catch {
      setError("Failed to connect to authentication service");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await login(email, otp);
    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Invalid OTP code. Use 123456 for demo.");
      setLoading(false);
    }
  };

  const handleQuickLogin = async (accountEmail: string) => {
    setLoading(true);
    setError("");
    setEmail(accountEmail);
    const res = await login(accountEmail, "123456");
    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Quick login failed");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 overflow-y-auto py-10 px-4">
      {/* Background Soft Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-100/50 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto my-auto">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            StockSense
          </h1>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-1">
            Intelligent Inventory Management
          </p>
        </div>

        {/* Already logged in indicator */}
        {user && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between animate-fade-in-up">
            <div className="min-w-0">
              <p className="text-xs text-slate-400 font-medium">Currently active session:</p>
              <p className="text-sm font-bold text-slate-800 truncate">
                {user.name} ({user.role})
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shrink-0 cursor-pointer shadow-sm"
            >
              Go to Dashboard →
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl backdrop-blur-xl animate-fade-in-up-delay-1">
          {step === "email" ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Sign In with OTP</h2>
                <p className="text-sm text-slate-500">
                  Enter your email to receive a login verification code
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="you@example.com"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 text-white py-3 text-sm font-bold shadow-md hover:bg-blue-700 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Sending Code..." : "Send OTP"}
              </button>

              {/* 1-Click Quick Demo Login Section */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
                  Or 1-Click Demo Login
                </p>
                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickLogin(acc.email)}
                      className="w-full flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                          {acc.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{acc.desc}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 shrink-0">
                        {acc.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Verify OTP</h2>
                <p className="text-sm text-slate-500">
                  Enter the 6-digit code sent to <span className="text-slate-800 font-semibold underline">{email}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-slate-900 text-center font-mono tracking-[0.5em] text-lg focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="● ● ● ● ● ●"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 text-white py-3 text-sm font-bold shadow-md hover:bg-blue-700 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Verifying..." : "Sign In"}
              </button>

              <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="hover:text-slate-800 transition-colors cursor-pointer"
                >
                  ← Change Email
                </button>
                <button
                  type="button"
                  onClick={() => setOtp("123456")}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  Auto-fill Demo OTP (123456)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
