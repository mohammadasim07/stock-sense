"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "OPERATOR";
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchAccount: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth from localStorage or cookie
  useEffect(() => {
    try {
      const stored = localStorage.getItem("stocksense_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name === "Nasir Ahmad") {
          parsed.name = "Alex Morgan";
          localStorage.setItem("stocksense_user", JSON.stringify(parsed));
        }
        setUser(parsed);
      } else {
        // Default demo session for immediate exploration
        const defaultUser: AuthUser = {
          id: "u-00000000-0001",
          name: "Alex Morgan",
          email: "admin@stocksense.io",
          role: "ADMIN",
        };
        setUser(defaultUser);
        localStorage.setItem("stocksense_user", JSON.stringify(defaultUser));
      }
    } catch {
      // Ignore parse errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Verification failed" };
      }

      setUser(data.user);
      localStorage.setItem("stocksense_user", JSON.stringify(data.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to verify code" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
    setUser(null);
    localStorage.removeItem("stocksense_user");
    router.push("/login");
  };

  const switchAccount = async (email: string) => {
    const res = await login(email, "123456");
    if (res.success) {
      router.push("/dashboard");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
