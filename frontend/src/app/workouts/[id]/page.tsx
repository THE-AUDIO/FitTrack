"use client"

import { useAuthStore } from "@/store/auth-store"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Dumbbell,
  Clock,
  Flame,
  ChefHat,
  Brain,
  Loader2,
  Trash2,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ui/dialog"

export default function WorkoutDetailPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  const handleDelete = async () => {
    try {
      await apiClient(`/api/workouts/${params.id}`, { method: "DELETE" })
      queryClient.invalidateQueries({ queryKey: ["workouts"] })
      router.push("/workouts")
    } catch {
      showToast("Erreur lors de la suppression", "error")
    }
  }

  const { data: workout, isLoading } = useQuery({
    queryKey: ["workout", params.id],
    queryFn: () => apiClient(`/api/workouts/${params.id}`),
    enabled: !!user,
  })

  const nutritionMutation = useMutation({
    mutationFn: () =>
      apiClient("/api/nutrition/suggest", {
        method: "POST",
        body: JSON.stringify({
          session_id: params.id,
          context: "both",
        }),
      }),
    onSuccess: (data: any) => {
      showToast("Suggestion nutritionnelle générée", "success")
      setSuggestion(data)
    },
    onError: (err: any) => {
      showToast(err.message || "Erreur IA", "error")
    },
  })

  const [suggestion, setSuggestion] = useState<any>(null)

  if (authLoading || isLoading || !workout) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const w: any = workout
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/workouts")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Button variant="ghost" onClick={() => setShowDeleteDialog(true)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{w.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            {w.duration_minutes} min
          </Badge>
          <Badge variant="secondary">
            {formatDate(w.date)}
          </Badge>
          {w.total_calories && (
            <Badge variant="outline" className="text-orange-400 border-orange-500/30">
              <Flame className="mr-1 h-3 w-3" />
              {w.total_calories} kcal
            </Badge>
          )}
        </div>
      </div>

      <div className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold">Exercices</h2>
        {w.exercises?.map((ex: any, i: number) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">{ex.exercise_name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {ex.exercise_category}
                    </Badge>
                  </div>
                  {ex.calories_burned && (
                    <Badge variant="outline" className="text-xs">
                      <Flame className="mr-1 h-3 w-3 text-orange-400" />
                      {ex.calories_burned} kcal
                    </Badge>
                  )}
                </div>
                {ex.sets?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-1 pr-4 text-left text-xs text-muted-foreground">Série</th>
                          <th className="py-1 pr-4 text-left text-xs text-muted-foreground">Reps</th>
                          <th className="py-1 pr-4 text-left text-xs text-muted-foreground">Poids</th>
                          <th className="py-1 text-left text-xs text-muted-foreground">Durée</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.sets.map((s: any) => (
                          <tr key={s.id} className="border-b border-border/50">
                            <td className="py-1.5 pr-4 font-medium">{s.set_number}</td>
                            <td className="py-1.5 pr-4">{s.reps ?? "-"}</td>
                            <td className="py-1.5 pr-4">
                              {s.weight_kg ? `${s.weight_kg} kg` : "-"}
                            </td>
                            <td className="py-1.5">
                              {s.duration_seconds ? `${s.duration_seconds}s` : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Nutrition IA post-séance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestion ? (
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-medium flex items-center gap-1">
                  <ChefHat className="h-3.5 w-3.5 text-primary" />
                  Aliments recommandés
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {suggestion.suggestion_json?.recovery_foods?.map(
                    (food: any, i: number) => (
                      <div key={i} className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">{food.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {food.reason}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
              {suggestion.suggestion_json?.meal_plan && (
                <div className="rounded-lg bg-primary/5 p-4">
                  <p className="text-sm font-medium">
                    Plan de repas : {suggestion.suggestion_json.meal_plan.timing}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Snack : {suggestion.suggestion_json.meal_plan.snack}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Repas : {suggestion.suggestion_json.meal_plan.meal}
                  </p>
                </div>
              )}
              {suggestion.suggestion_json?.hydration_tip && (
                <p className="text-sm text-blue-400">
                  💧 {suggestion.suggestion_json.hydration_tip}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <ChefHat className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-3">
                Génère des suggestions nutritionnelles personnalisées
              </p>
              <Button
                onClick={() => nutritionMutation.mutate()}
                disabled={nutritionMutation.isPending}
              >
                {nutritionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Suggestion IA
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
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
