// src/app/layout.tsx
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthContextProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"   // follow system preference
          enableSystem={true}     // allow auto-switching
        >
          <AuthContextProvider>
            <Layout>{children}</Layout>
          </AuthContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
