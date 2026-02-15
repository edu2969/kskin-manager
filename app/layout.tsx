import type { Metadata } from 'next';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from '@/components/providers/ClientProviders';
import { UserProvider } from '@/components/providers/UserProvider';
import { authOptions } from "@/app/utils/authOptions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KSking Manager",
  description: "Gestión de pacientes y recursos para KSkin",
  manifest: "/manifest.json"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) { 
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <ClientProviders>
            {children}
          </ClientProviders>
        </UserProvider>
      </body>
    </html>
  );
}
