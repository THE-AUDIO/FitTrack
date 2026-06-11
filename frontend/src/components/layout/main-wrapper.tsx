"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

export function MainWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isMarketing = pathname === "/"
  const isAuth = pathname === "/login" || pathname === "/register"

  if (isMarketing || isAuth) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <main className="min-h-screen pt-16 pb-20 lg:pb-0 lg:pl-64">
      {children}
    </main>
  )
}
