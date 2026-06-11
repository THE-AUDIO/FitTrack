"use client"

import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Dumbbell, Calendar, Clock, Flame, Trash2 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/dialog"

export default function WorkoutsPage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [user, isLoading, router])

  const { data: workouts } = useQuery({
    queryKey: ["workouts"],
    queryFn: () => apiClient("/api/workouts?limit=50"),
    enabled: !!user,
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    const id = deleteTarget
    setDeleteTarget(null)
    setDeletingId(id)
    try {
      await apiClient(`/api/workouts/${id}`, { method: "DELETE" })
      queryClient.invalidateQueries({ queryKey: ["workouts"] })
    } catch {
      setDeletingId(null)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes séances</h1>
          <p className="text-sm text-muted-foreground">
            Historique complet de tes entraînements
          </p>
        </div>
        <Link href="/workouts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle séance
          </Button>
        </Link>
      </div>

      {workouts && Array.isArray(workouts) && workouts.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2">
          {workouts.map((w: any, i: number) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link href={`/workouts/${w.id}`}>
                <Card className="card-hover group relative h-full cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="flex h-full flex-col justify-between p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold">{w.title}</h3>
                        <Badge variant="secondary" className="mt-2 text-sm">
                          <Calendar className="mr-1.5 h-3.5 w-3.5" />
                          {formatDate(w.date)}
                        </Badge>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {w.total_calories && (
                          <Badge variant="outline" className="shrink-0 border-orange-500/30 px-2.5 py-1 text-sm text-orange-400">
                            <Flame className="mr-1 h-3.5 w-3.5" />
                            {w.total_calories} kcal
                          </Badge>
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(w.id) }}
                          disabled={deletingId === w.id}
                          className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:text-red-400 hover:bg-red-500/10 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {w.duration_minutes} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Dumbbell className="h-4 w-4" />
                        {w.exercise_count} exercices
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Dumbbell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">Aucune séance</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Commence par enregistrer ton premier entraînement
          </p>
          <Link href="/workouts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Créer une séance
            </Button>
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la séance"
        description="Cette action est irréversible. Tous les exercices et séries associés seront supprimés."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />
    </div>
  )
}
