"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { ThemeProvider } from "next-themes"
import { ToastProvider } from "@/components/ui/toast"
import { apiClient } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await apiClient("/api/auth/me")
        setUser(user as any)
      } catch {
        setUser(null)
      }
    }
    loadUser()
  }, [setUser, setLoading])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
        <ToastProvider>
          <AuthLoader>{children}</AuthLoader>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
