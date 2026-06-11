"use client"

import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Dumbbell, Flame, Clock, Zap, TrendingUp, Plus, ChevronRight, Target, Calendar,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts"
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

interface WeeklyData {
  week: string
  count: number
}

interface Goal {
  id: string
  title: string
  goal_type: string
  target_value: number
  current_value: number
  unit: string
  status: string
  deadline: string | null
}

export default function DashboardPage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [user, isLoading, router])

  const { data: overview } = useQuery<Overview>({
    queryKey: ["stats-overview"],
    queryFn: () => apiClient("/api/stats/overview"),
    enabled: !!user,
  })

  const { data: weeklyData } = useQuery<WeeklyData[]>({
    queryKey: ["stats-weekly"],
    queryFn: () => apiClient("/api/stats/workouts-per-week?weeks=8"),
    enabled: !!user,
  })

  const { data: caloriesHistory } = useQuery({
    queryKey: ["stats-calories-history"],
    queryFn: () => apiClient("/api/stats/calories-history"),
    enabled: !!user,
  })

  const { data: goals } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: () => apiClient("/api/goals"),
    enabled: !!user,
  })

  const chartData = useMemo(() => {
    if (!weeklyData) return []
    return weeklyData.map((w: WeeklyData) => ({
      name: new Date(w.week).toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
      séances: w.count,
    }))
  }, [weeklyData])

  const caloriesData = useMemo(() => {
    if (!caloriesHistory) return []
    return (caloriesHistory as any[]).slice(-14).map((c: any) => ({
      name: new Date(c.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      calories: Math.round(c.calories),
    }))
  }, [caloriesHistory])

  const activeGoals = useMemo(() => {
    if (!goals) return []
    return goals.filter((g: Goal) => g.status === "active").slice(0, 3)
  }, [goals])

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
      icon: Dumbbell, color: "text-emerald-400", bg: "bg-emerald-500/10",
      suffix: "",
    },
    {
      label: "Calories brûlées",
      value: `${Math.round(overview?.total_calories ?? 0)}`,
      icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10",
      suffix: " kcal",
    },
    {
      label: "Heures d'entraînement",
      value: overview?.total_hours ?? 0,
      icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10",
      suffix: "h",
    },
    {
      label: "Série actuelle",
      value: `${overview?.current_streak ?? 0}`,
      icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10",
      suffix: " jours",
    },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-bold">{payload[0].value} séances</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, {user.full_name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">Voici ton résumé d&apos;entraînement</p>
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
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold">
                        {stat.value}
                        <span className="text-sm font-normal text-muted-foreground">{stat.suffix}</span>
                      </p>
                    </div>
                    <div className={`rounded-lg ${stat.bg} p-2.5 ${stat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  {stat.label === "Série actuelle" && (overview?.current_streak ?? 0) > 0 && (
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

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Séances par semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="séances" fill="hsl(142, 76%, 45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Dumbbell className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Pas encore de séances enregistrées</p>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4 text-primary" />
              Calories brûlées
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caloriesData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={caloriesData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="calories" stroke="hsl(142, 76%, 45%)" fill="hsl(142, 76%, 45%, 0.1)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Flame className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Aucune donnée calorique</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Objectifs actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeGoals.length > 0 ? (
              <div className="space-y-4">
                {activeGoals.map((goal: Goal) => {
                  const pct = Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100)
                  return (
                    <div key={goal.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{goal.title}</span>
                        <span className="text-muted-foreground">
                          {goal.current_value}/{goal.target_value} {goal.unit}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{pct}% atteint</p>
                    </div>
                  )
                })}
                <Link href="/goals">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Voir tous les objectifs
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Target className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Aucun objectif actif</p>
                <Link href="/goals">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="mr-1 h-3 w-3" />
                    Créer un objectif
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Dernière activité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Dumbbell className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {overview?.total_workouts
                  ? "Continue sur ta lancée !"
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
