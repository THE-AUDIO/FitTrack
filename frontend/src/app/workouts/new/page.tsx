"use client"

import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Plus,
  Trash2,
  Dumbbell,
  Save,
  Search,
  Flame,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { workoutSchema } from "@/lib/validations"

interface Exercise {
  id: string
  name: string
  category: string
  muscle_groups: string[]
  met_value: number
}

interface SetRow {
  set_number: number
  reps: number | null
  weight_kg: number | null
  duration_seconds: number | null
  completed: boolean
}

interface ExerciseEntry {
  exercise_id: string
  exercise_name: string
  met_value: number
  category: string
  order_index: number
  rest_seconds: number
  sets: SetRow[]
}

export default function NewWorkoutPage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()
  const { showToast } = useToast()
  const [exercises, setExercises] = useState<ExerciseEntry[]>([])
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isSaving, setIsSaving] = useState(false)

  const { data: allExercises } = useQuery<Exercise[]>({
    queryKey: ["exercises"],
    queryFn: () => apiClient("/api/exercises"),
    enabled: !!user,
  })

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [user, isLoading, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().split("T")[0],
      duration_minutes: 30,
      notes: "",
    },
  })

  const filteredExercises = (allExercises || []).filter((ex) => {
    const matchesSearch = ex.name
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" || ex.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ["all", ...Array.from(new Set((allExercises || []).map((e: any) => e.category)))]

  const addExercise = (ex: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exercise_id: ex.id,
        exercise_name: ex.name,
        met_value: ex.met_value,
        category: ex.category,
        order_index: prev.length,
        rest_seconds: 60,
        sets: [{ set_number: 1, reps: null, weight_kg: null, duration_seconds: null, completed: true }],
      },
    ])
  }

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  const addSet = (exIndex: number) => {
    setExercises((prev) => {
      const updated = [...prev]
      const currentSets = updated[exIndex].sets
      updated[exIndex] = {
        ...updated[exIndex],
        sets: [
          ...currentSets,
          {
            set_number: currentSets.length + 1,
            reps: null,
            weight_kg: null,
            duration_seconds: null,
            completed: true,
          },
        ],
      }
      return updated
    })
  }

  const removeSet = (exIndex: number, setIndex: number) => {
    setExercises((prev) => {
      const updated = [...prev]
      updated[exIndex] = {
        ...updated[exIndex],
        sets: updated[exIndex].sets.filter((_, i) => i !== setIndex),
      }
      return updated
    })
  }

  const updateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof SetRow,
    value: any
  ) => {
    setExercises((prev) => {
      const updated = [...prev]
      updated[exIndex] = {
        ...updated[exIndex],
        sets: updated[exIndex].sets.map((s, i) =>
          i === setIndex ? { ...s, [field]: value } : s
        ),
      }
      return updated
    })
  }

  const calculateLiveCalories = (): number => {
    const userWeight = user?.weight_kg || 70
    return exercises.reduce((total, ex) => {
      const totalReps = ex.sets.reduce((sum, s) => sum + (s.reps || 0), 0)
      const numSets = ex.sets.length
      const cadence = ex.category === "Cardio" ? 40 : ex.category === "HIIT" ? 30 : 20
      const durationHours =
        (totalReps / cadence + numSets * (ex.rest_seconds || 60) / 60) / 60
      return total + ex.met_value * userWeight * durationHours
    }, 0)
  }

  const onSubmit = async (formData: any) => {
    if (exercises.length === 0) {
      showToast("Ajoute au moins un exercice", "error")
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        ...formData,
        duration_minutes: Number(formData.duration_minutes),
        exercises: exercises.map((ex, i) => ({
          exercise_id: ex.exercise_id,
          order_index: i,
          rest_seconds: ex.rest_seconds,
          sets: ex.sets.map((s) => ({
            set_number: s.set_number,
            reps: s.reps ? Number(s.reps) : null,
            weight_kg: s.weight_kg ? Number(s.weight_kg) : null,
            duration_seconds: s.duration_seconds ? Number(s.duration_seconds) : null,
            completed: s.completed,
          })),
        })),
      }
      const workout = await apiClient("/api/workouts", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      showToast("Séance créée avec succès", "success")
      router.push(`/workouts/${(workout as any).id}`)
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la création", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const liveCalories = calculateLiveCalories()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Nouvelle séance
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure ta séance et enregistre chaque série
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la séance</Label>
            <Input
              id="title"
              placeholder="Pectoraux & Triceps"
              {...register("title")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register("date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Durée (minutes)</Label>
            <Input
              id="duration_minutes"
              type="number"
              {...register("duration_minutes", { valueAsNumber: true })}
            />
          </div>
        </div>

        {liveCalories > 0 && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg bg-orange-500/10 px-4 py-2 text-sm text-orange-400">
            <Flame className="h-4 w-4" />
            Estimation calories live : {Math.round(liveCalories)} kcal
          </div>
        )}

        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold">
              Ajouter un exercice
            </h2>
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un exercice..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1 overflow-x-auto">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="whitespace-nowrap"
                  >
                    {cat === "all" ? "Tous" : cat}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredExercises.map((ex) => (
                <Button
                  key={ex.id}
                  variant="outline"
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => addExercise(ex)}
                  type="button"
                >
                  <Plus className="h-4 w-4 shrink-0 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">
                      MET {ex.met_value} • {ex.category}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {exercises.map((ex, exIndex) => (
          <Card key={exIndex} className="mb-4 card-hover">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{ex.exercise_name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    MET {ex.met_value}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Label className="text-xs">Repos</Label>
                    <Input
                      type="number"
                      value={ex.rest_seconds}
                      onChange={(e) =>
                        setExercises((prev) => {
                          const updated = [...prev]
                          updated[exIndex].rest_seconds = Number(e.target.value)
                          return updated
                        })
                      }
                      className="h-8 w-16 text-xs"
                    />
                    <span>s</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExercise(exIndex)}
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 pr-4 text-left text-xs font-medium text-muted-foreground">
                        Série
                      </th>
                      <th className="py-2 pr-4 text-left text-xs font-medium text-muted-foreground">
                        Répétitions
                      </th>
                      <th className="py-2 pr-4 text-left text-xs font-medium text-muted-foreground">
                        Poids (kg)
                      </th>
                      <th className="py-2 pr-4 text-left text-xs font-medium text-muted-foreground">
                        Durée (s)
                      </th>
                      <th className="py-2 text-left text-xs font-medium text-muted-foreground">
                        Fait
                      </th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {ex.sets.map((set, setIndex) => (
                      <tr key={setIndex} className="border-b border-border/50">
                        <td className="py-2 pr-4">
                          <span className="font-medium">{set.set_number}</span>
                        </td>
                        <td className="py-2 pr-4">
                          <Input
                            type="number"
                            value={set.reps ?? ""}
                            onChange={(e) =>
                              updateSet(
                                exIndex,
                                setIndex,
                                "reps",
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="h-8 w-20 text-xs"
                            placeholder="-"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <Input
                            type="number"
                            step="0.5"
                            value={set.weight_kg ?? ""}
                            onChange={(e) =>
                              updateSet(
                                exIndex,
                                setIndex,
                                "weight_kg",
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="h-8 w-20 text-xs"
                            placeholder="-"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <Input
                            type="number"
                            value={set.duration_seconds ?? ""}
                            onChange={(e) =>
                              updateSet(
                                exIndex,
                                setIndex,
                                "duration_seconds",
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="h-8 w-20 text-xs"
                            placeholder="-"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="checkbox"
                            checked={set.completed}
                            onChange={(e) =>
                              updateSet(
                                exIndex,
                                setIndex,
                                "completed",
                                e.target.checked
                              )
                            }
                            className="h-4 w-4 rounded border-border accent-primary"
                          />
                        </td>
                        <td className="py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSet(exIndex, setIndex)}
                            type="button"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => addSet(exIndex)}
                type="button"
                className="mt-3"
              >
                <Plus className="mr-1 h-3 w-3" />
                Ajouter une série
              </Button>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              "Création..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer la séance
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
