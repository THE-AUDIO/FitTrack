import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/layout/providers"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  title: "FitTrack - Suivi d'entraînement intelligent",
  description: "Planifiez, enregistrez et suivez vos séances d'entraînement avec calcul MET calories et IA nutrition.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <Sidebar />
          <main className="min-h-screen pt-16 pb-20 lg:pb-0 lg:pl-64">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
