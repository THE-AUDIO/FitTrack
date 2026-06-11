"use client"

import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ShieldAlert } from "lucide-react"

export default function AdminPage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-bold">Accès refusé</h1>
        <p className="text-sm text-muted-foreground">Rôle administrateur requis</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
      <p className="text-sm text-muted-foreground">Panel d&apos;administration</p>
    </div>
  )
}
