import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { JobProvider } from "@/lib/job-context";


const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Site Buddy | Intelligent Construction Workflow Management",
  description: "AI-powered construction workflow platform with voice notes, document processing, and real-time collaboration for field teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable} suppressHydrationWarning>
        <AuthProvider>
          <JobProvider>
            {children}
          </JobProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

