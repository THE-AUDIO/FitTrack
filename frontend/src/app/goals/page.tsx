"use client"

import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Target, Plus, Trash2, Flame, Dumbbell, Calendar, Weight, TrendingUp } from "lucide-react"
import { apiClient } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"

interface Goal {
  id: string
  title: string
  description: string | null
  goal_type: string
  target_value: number
  current_value: number
  unit: string
  deadline: string | null
  status: string
  created_at: string
}

const typeMeta: Record<string, { icon: any; color: string; defaultUnit: string }> = {
  frequency: { icon: Calendar, color: "text-blue-400", defaultUnit: "séances/sem" },
  volume: { icon: Dumbbell, color: "text-emerald-400", defaultUnit: "reps" },
  weight: { icon: Weight, color: "text-purple-400", defaultUnit: "kg" },
  calories: { icon: Flame, color: "text-orange-400", defaultUnit: "kcal" },
}

export default function GoalsPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const router = useRouter()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: "", goal_type: "frequency", target_value: "", unit: "séances/sem", deadline: "",
  })

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  const { data: goals } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: () => apiClient("/api/goals"),
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient("/api/goals", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] })
      showToast("Objectif créé", "success")
      setShowForm(false)
      setForm({ title: "", goal_type: "frequency", target_value: "", unit: "séances/sem", deadline: "" })
    },
    onError: (err: any) => showToast(err.message, "error"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/api/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] })
      showToast("Objectif supprimé", "success")
    },
    onError: (err: any) => showToast(err.message, "error"),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/api/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "completed" }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] })
      showToast("Objectif atteint ! 🎉", "success")
    },
    onError: (err: any) => showToast(err.message, "error"),
  })

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const activeGoals = (goals || []).filter((g) => g.status !== "archived")

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Objectifs</h1>
          <p className="text-sm text-muted-foreground">Fixe et suis tes objectifs personnels</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? "Annuler" : "Nouvel objectif"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardContent className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: 3 séances par semaine" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.goal_type}
                  onValueChange={(v) => {
                    const meta = typeMeta[v]
                    setForm({ ...form, goal_type: v, unit: meta?.defaultUnit || "" })
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frequency">Fréquence</SelectItem>
                    <SelectItem value="volume">Volume (répétitions)</SelectItem>
                    <SelectItem value="weight">Poids</SelectItem>
                    <SelectItem value="calories">Calories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Objectif</Label>
                <Input type="number" step="0.1" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Unité</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date limite (optionnelle)</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>
            <Button
              className="mt-4"
              disabled={!form.title || !form.target_value || createMutation.isPending}
              onClick={() => {
                createMutation.mutate({
                  title: form.title,
                  goal_type: form.goal_type,
                  target_value: parseFloat(form.target_value),
                  unit: form.unit,
                  deadline: form.deadline || undefined,
                })
              }}
            >
              {createMutation.isPending ? "Création..." : "Créer l'objectif"}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeGoals.length > 0 ? (
        <div className="space-y-4">
          {activeGoals.map((goal: Goal, i: number) => {
            const meta = typeMeta[goal.goal_type] || { icon: Target, color: "text-primary", defaultUnit: "" }
            const Icon = meta.icon
            const pct = Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100)
            const isCompleted = goal.status === "completed"

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`card-hover ${isCompleted ? "border-emerald-500/30" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg bg-secondary p-2.5 ${meta.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {goal.title}
                            {isCompleted && (
                              <Badge variant="default" className="text-xs bg-emerald-500">Atteint</Badge>
                            )}
                          </h3>
                          <p className="text-xs text-muted-foreground capitalize">
                            {goal.goal_type} • {goal.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isCompleted && (
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-emerald-400 hover:text-emerald-300"
                            onClick={() => completeMutation.mutate(goal.id)}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteMutation.mutate(goal.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium">
                        {goal.current_value} / {goal.target_value} {goal.unit}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isCompleted ? "bg-emerald-500" : "bg-primary"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{pct}% atteint</span>
                      {goal.deadline && (
                        <span>Échéance : {new Date(goal.deadline).toLocaleDateString("fr-FR")}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">Aucun objectif</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Fixe ton premier objectif pour suivre ta progression
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Créer un objectif
          </Button>
        </div>
      )}
    </div>
  )
}
