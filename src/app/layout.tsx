import type { Metadata } from "next";
import { Providers } from "./providers";
import { AppLayout } from "@/components/shared/AppLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockSense — Intelligent Inventory Management",
  description:
    "A modular, Odoo-style Inventory Management System powered by a double-entry stock ledger. Track products, locations, and operations with real-time stock visibility.",
  keywords: ["inventory", "management", "stock", "warehouse", "ERP", "ledger"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
