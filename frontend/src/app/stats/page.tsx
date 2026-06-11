"use client"

import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { BarChart3, Dumbbell, Flame, TrendingUp } from "lucide-react"
import { apiClient } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function StatsPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  const { data: overview } = useQuery({
    queryKey: ["stats-overview"],
    queryFn: () => apiClient("/api/stats/overview"),
    enabled: !!user,
  })

  const { data: volumeByMuscle } = useQuery({
    queryKey: ["stats-volume"],
    queryFn: () => apiClient("/api/stats/volume-by-muscle"),
    enabled: !!user,
  })

  const { data: weeklyData } = useQuery({
    queryKey: ["stats-weekly"],
    queryFn: () => apiClient("/api/stats/workouts-per-week?weeks=12"),
    enabled: !!user,
  })

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const overviewStats: any = overview || {}
  const muscleData: any[] = (volumeByMuscle as any[]) || []
  const weekly: any[] = (weeklyData as any[]) || []

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-sm text-muted-foreground">
          Analyse détaillée de ta progression
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Séances</p>
                <p className="text-2xl font-bold">
                  {overviewStats.total_workouts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 p-2.5 text-orange-400">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Calories</p>
                <p className="text-2xl font-bold">
                  {Math.round(overviewStats.total_calories || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Volume</p>
                <p className="text-2xl font-bold">
                  {muscleData.reduce((sum: number, m: any) => sum + m.total_reps, 0)}
                </p>
                <p className="text-xs text-muted-foreground">répétitions totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Séances par semaine</CardTitle>
          </CardHeader>
          <CardContent>
            {weekly.length > 0 ? (
              <div className="flex items-end gap-2 h-48">
                {weekly.map((w: any, i: number) => {
                  const maxCount = Math.max(...weekly.map((wd: any) => wd.count), 1)
                  const height = (w.count / maxCount) * 100
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-xs font-medium">{w.count}</span>
                      <div
                        className="w-full rounded-md bg-gradient-to-t from-primary/20 to-primary/40 transition-all"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Pas assez de données
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Volume par groupe musculaire</CardTitle>
          </CardHeader>
          <CardContent>
            {muscleData.length > 0 ? (
              <div className="space-y-3">
                {muscleData.slice(0, 8).map((m: any) => {
                  const maxReps = Math.max(...muscleData.map((md: any) => md.total_reps), 1)
                  const width = (m.total_reps / maxReps) * 100
                  return (
                    <div key={m.muscle_group}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{m.muscle_group}</span>
                        <span className="text-muted-foreground">
                          {m.total_reps} reps
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Pas assez de données
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
