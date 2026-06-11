"use client"

import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Search, Dumbbell, Trash2, Edit3 } from "lucide-react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"

export default function ExercisesPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const router = useRouter()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "Musculation",
    muscle_groups: "",
    met_value: 3.5,
  })

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  const { data: exercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => apiClient("/api/exercises"),
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient("/api/exercises", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] })
      showToast("Exercice créé", "success")
      setShowForm(false)
      setFormData({ name: "", category: "Musculation", muscle_groups: "", met_value: 3.5 })
    },
    onError: (err: any) => showToast(err.message, "error"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/api/exercises/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] })
      showToast("Exercice supprimé", "success")
    },
    onError: (err: any) => showToast(err.message, "error"),
  })

  const filtered = (Array.isArray(exercises) ? exercises : []).filter((ex: any) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exercices</h1>
          <p className="text-sm text-muted-foreground">
            Bibliothèque d&apos;exercices avec valeurs MET
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? "Annuler" : "Nouvel exercice"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardContent className="p-5">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium">Nom</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Exercice"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option>Musculation</option>
                  <option>Cardio</option>
                  <option>HIIT</option>
                  <option>Stretching</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  Groupes musculaires
                </label>
                <Input
                  value={formData.muscle_groups}
                  onChange={(e) =>
                    setFormData({ ...formData, muscle_groups: e.target.value })
                  }
                  placeholder="Pectoraux, Triceps"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">MET</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.met_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      met_value: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <Button
              className="mt-4"
              onClick={() =>
                createMutation.mutate({
                  ...formData,
                  muscle_groups: formData.muscle_groups
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              disabled={!formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? "Création..." : "Créer l'exercice"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ex: any, i: number) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
          >
            <Card className="card-hover">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Dumbbell className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{ex.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        MET {ex.met_value} • {ex.category}
                      </p>
                      {ex.muscle_groups?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {ex.muscle_groups.map((mg: string) => (
                            <Badge key={mg} variant="secondary" className="text-xs">
                              {mg}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {!ex.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(ex.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
