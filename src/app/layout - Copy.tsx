"use client";

import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthContextProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login"; // 👈 check current route

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthContextProvider>
            {/* ✅ Don’t wrap login page in Layout */}
            {isLoginPage ? children : <Layout>{children}</Layout>}
          </AuthContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
