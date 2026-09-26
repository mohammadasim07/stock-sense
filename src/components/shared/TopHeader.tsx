"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { CommandPalette } from "./CommandPalette";

export function TopHeader({ placeholder = "Search products, locations, or operations..." }: { placeholder?: string }) {
  const { user } = useAuth();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const userName = (!user?.name || user?.name === "Admin User") ? "Nasir Ahmad" : user.name;
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="h-[68px] px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-20 shrink-0">
        {/* Search Bar (450–550px wide, 42px height, 10px radius) */}
        <div
          onClick={() => setIsCommandOpen(true)}
          className="relative w-full max-w-[480px] cursor-pointer group"
        >
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-hover:text-blue-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            readOnly
            placeholder={placeholder}
            className="w-full h-[42px] pl-10 pr-16 bg-slate-50 group-hover:bg-slate-100/70 text-sm text-slate-900 placeholder:text-slate-400 rounded-[10px] border border-slate-200 transition-colors cursor-pointer"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs group-hover:border-slate-300">
              Ctrl K
            </span>
          </div>
        </div>

        {/* Right Controls: notification → 16px → profile */}
        <div className="flex items-center gap-4">
          {/* Notifications Button (40x40) */}
          <button
            type="button"
            title="Notifications"
            className="relative h-10 w-10 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

          {/* User Profile Pill */}
          <div className="h-10 flex items-center gap-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-default">
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
              {userInitials}
            </div>
            <span className="text-xs font-semibold text-slate-800 hidden sm:inline-block">
              {userName}
            </span>
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
