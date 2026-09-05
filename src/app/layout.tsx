import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expenser",
  description: "Track expenses, budgets, and spending trends",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-mono">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
