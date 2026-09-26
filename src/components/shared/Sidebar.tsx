"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Products",
    href: "/products",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: "Locations",
    href: "/locations",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: "Operations",
    href: "/operations",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, switchAccount } = useAuth();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  if (pathname === "/login") {
    return null;
  }

  const displayName = (!user?.name || user?.name === "Admin User") ? "Nasir Ahmad" : user.name;
  const displayRole = displayName === "Nasir Ahmad" ? "Warehouse Manager" : user?.role === "ADMIN" ? "Administrator" : user?.role === "OPERATOR" ? "Warehouse Operator" : "Warehouse Manager";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sticky top-0 z-40 h-screen w-[250px] shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between select-none px-4 py-5">
      {/* Top: Logo & Navigation */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Logo Section with 20px bottom spacing */}
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20 shrink-0">
            {/* 3D Isometric Cube Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight truncate">
              StockSense
            </h1>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              Inventory Management
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 h-[44px] text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <span className={cn("shrink-0", isActive ? "text-blue-600" : "text-slate-400")}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom section (User Profile & Account Switcher) */}
      <div className="relative pt-4 border-t border-slate-100 shrink-0">
        {/* Account Switcher Popup */}
        {showSwitchMenu && (
          <div className="absolute bottom-16 left-0 right-0 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-fade-in-up">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
              Switch Demo Account
            </p>
            {[
              { name: "Nasir Ahmad", email: "admin@stocksense.io", role: "Warehouse Manager" },
              { name: "Sarah Manager", email: "manager@stocksense.io", role: "Operations Lead" },
              { name: "John Operator", email: "operator@stocksense.io", role: "Stock Handler" },
            ].map((acc) => (
              <button
                key={acc.email}
                onClick={async () => {
                  await switchAccount(acc.email);
                  setShowSwitchMenu(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                  user?.email === acc.email
                    ? "bg-blue-50 text-blue-600 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{acc.name}</span>
                <span className="text-[10px] text-slate-400 ml-2">{acc.role}</span>
              </button>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={logout}
                className="w-full text-left px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded font-semibold cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowSwitchMenu(!showSwitchMenu)}
          className="w-full flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-blue-600">
              {displayName}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {displayRole}
            </p>
          </div>
          <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
