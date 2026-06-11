"use client"

import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Dumbbell,
  Flame,
  Clock,
  Zap,
  TrendingUp,
  Plus,
  ChevronRight,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Overview {
  total_workouts: number
  total_hours: number
  total_calories: number
  current_streak: number
}

export default function DashboardPage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const { data: overview } = useQuery<Overview>({
    queryKey: ["stats-overview"],
    queryFn: () => apiClient("/api/stats/overview"),
    enabled: !!user,
  })

  const { data: weeklyData } = useQuery({
    queryKey: ["stats-weekly"],
    queryFn: () => apiClient("/api/stats/workouts-per-week?weeks=8"),
    enabled: !!user,
  })

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const stats = [
    {
      label: "Séances totales",
      value: overview?.total_workouts ?? 0,
      icon: Dumbbell,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Calories brûlées",
      value: `${overview?.total_calories ?? 0}`,
      icon: Flame,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      suffix: " kcal",
    },
    {
      label: "Heures d'entraînement",
      value: overview?.total_hours ?? 0,
      icon: Clock,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      suffix: "h",
    },
    {
      label: "Série actuelle",
      value: `${overview?.current_streak ?? 0}`,
      icon: Zap,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      suffix: " jours",
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, {user.full_name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Voici ton résumé d&apos;entraînement
          </p>
        </div>
        <Link href="/workouts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle séance
          </Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="card-hover overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-2xl font-bold">
                        {stat.value}
                        <span className="text-sm font-normal text-muted-foreground">
                          {stat.suffix}
                        </span>
                      </p>
                    </div>
                    <div className={`rounded-lg ${stat.bg} p-2.5 ${stat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  {overview && overview.current_streak > 0 && stat.label === "Série actuelle" && (
                    <Badge variant="default" className="mt-3">
                      <Zap className="mr-1 h-3 w-3" />
                      En forme !
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Séances par semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData && Array.isArray(weeklyData) && weeklyData.length > 0 ? (
              <div className="flex items-end gap-2 h-32">
                {weeklyData.slice(-8).map((w: any, i: number) => {
                  const maxCount = Math.max(
                    ...weeklyData.map((wd: any) => wd.count),
                    1
                  )
                  const height = (w.count / maxCount) * 100
                  return (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <span className="text-xs font-medium">{w.count}</span>
                      <div
                        className="w-full rounded-md bg-primary/20 transition-all duration-500 hover:bg-primary/40"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Dumbbell className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Pas encore de séances enregistrées
                </p>
                <Link href="/workouts/new">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="mr-1 h-3 w-3" />
                    Créer ma première séance
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4 text-primary" />
              Dernière activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Dumbbell className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {overview?.total_workouts
                  ? "Continue comme ça !"
                  : "Prêt à commencer ton premier entraînement ?"}
              </p>
              {overview?.total_workouts ? (
                <Link href="/workouts">
                  <Button variant="outline" size="sm" className="mt-3">
                    Voir l&apos;historique
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              ) : (
                <Link href="/workouts/new">
                  <Button size="sm" className="mt-3">
                    <Plus className="mr-1 h-3 w-3" />
                    Commencer
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
