"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 antialiased">
      {/* Fixed-width sidebar (250px), flex-shrink: 0 */}
      <Sidebar />

      {/* Main Content Area: flex: 1, min-width: 0 */}
      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-[1560px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
