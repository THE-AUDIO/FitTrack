"use client"

import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dumbbell,
  Plus,
  Check,
  Clock,
  Play,
  Pause,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Search,
  List,
  Flame,
} from "lucide-react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"

type Phase = "form" | "select" | "active" | "complete"

interface Exercise {
  id: string
  name: string
  category: string
  met_value: number
}

interface PlannedExercise {
  exercise: Exercise
  numSets: number
  restSeconds: number
  sets: { reps: number | null; completed: boolean }[]
}

const DEFAULT_REST = 45

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function NewWorkoutPage() {
  const { user, isLoading: authLoading } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [phase, setPhase] = useState<Phase>("form")
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [duration, setDuration] = useState(30)
  const [notes, setNotes] = useState("")

  const [plannedExercises, setPlannedExercises] = useState<PlannedExercise[]>([])
  const [currentExIndex, setCurrentExIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)

  const [timerValue, setTimerValue] = useState(DEFAULT_REST)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showRepInput, setShowRepInput] = useState(false)
  const [currentReps, setCurrentReps] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  const { data: allExercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => apiClient<Exercise[]>("/api/exercises"),
    enabled: !!user,
  })

  const userWeight = user?.weight_kg ?? 70

  const currentExercise = plannedExercises[currentExIndex]
  const totalSets = currentExercise?.numSets ?? 0
  const isLastSet = currentSet >= totalSets
  const isLastExercise = currentExIndex >= plannedExercises.length - 1

  const categories = allExercises
    ? Array.from(new Set(allExercises.map((e) => e.category)))
    : []

  const filteredExercises = allExercises?.filter((e) => {
    const matchName = e.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || e.category === categoryFilter
    const notAdded = !plannedExercises.some((p) => p.exercise.id === e.id)
    return matchName && matchCategory && notAdded
  })

  const startTimer = useCallback(() => {
    setShowRepInput(false)
    setTimerRunning(true)
  }, [])

  const pauseTimer = useCallback(() => {
    setTimerRunning(false)
  }, [])

  const skipTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerRunning(false)
    setShowRepInput(true)
    setCurrentReps(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const confirmReps = useCallback(() => {
    if (currentReps === null || currentReps < 0) return

    setPlannedExercises((prev) => {
      const updated = [...prev]
      const ex = { ...updated[currentExIndex] }
      const sets = [...ex.sets]
      sets[currentSet - 1] = { reps: currentReps, completed: true }
      ex.sets = sets
      updated[currentExIndex] = ex
      return updated
    })

    if (isLastSet) {
      if (isLastExercise) {
        setShowRepInput(false)
        setTimerRunning(false)
        setPhase("complete")
      } else {
        setCurrentExIndex((i) => i + 1)
        setCurrentSet(1)
        setTimerValue(DEFAULT_REST)
        setShowRepInput(false)
        setTimerRunning(false)
      }
    } else {
      setCurrentSet((s) => s + 1)
      setTimerValue(DEFAULT_REST)
      setShowRepInput(false)
      setTimerRunning(true)
    }

    setCurrentReps(null)
  }, [currentReps, currentExIndex, currentSet, isLastSet, isLastExercise])

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerValue((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            setTimerRunning(false)
            setShowRepInput(true)
            setCurrentReps(null)
            setTimeout(() => inputRef.current?.focus(), 100)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerRunning])

  const currentCalories = (() => {
    let total = 0
    for (const pe of plannedExercises) {
      const cadence = pe.exercise.category === "Cardio" ? 40 : pe.exercise.category === "HIIT" ? 30 : 20
      const totalReps = pe.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0)
      const numSets = pe.numSets
      const durationHours = (totalReps / cadence + numSets * pe.restSeconds / 60) / 60
      total += pe.exercise.met_value * userWeight * durationHours
    }
    return Math.round(total)
  })()

  const handleAddExercise = (ex: Exercise, numSets: number) => {
    const sets = Array.from({ length: numSets }, () => ({
      reps: null as number | null,
      completed: false,
    }))
    setPlannedExercises((prev) => [
      ...prev,
      { exercise: ex, numSets, restSeconds: DEFAULT_REST, sets },
    ])
  }

  const handleStartWorkout = () => {
    if (plannedExercises.length === 0) return
    setCurrentExIndex(0)
    setCurrentSet(1)
    setTimerValue(DEFAULT_REST)
    setPhase("active")
    startTimer()
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        title: title || `Séance du ${new Date(date).toLocaleDateString("fr-FR")}`,
        date,
        duration_minutes: duration,
        notes,
        exercises: plannedExercises.map((pe, i) => ({
          exercise_id: pe.exercise.id,
          order_index: i,
          rest_seconds: pe.restSeconds,
          sets: pe.sets.map((s, j) => ({
            set_number: j + 1,
            reps: s.reps ?? 0,
            weight_kg: null,
            duration_seconds: null,
            completed: s.completed,
          })),
        })),
      }

      const result = await apiClient<any>("/api/workouts", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      queryClient.invalidateQueries({ queryKey: ["workouts"] })
      showToast("Séance enregistrée !", "success")
      router.push(`/workouts/${result.id}`)
    } catch {
      showToast("Erreur lors de l'enregistrement", "error")
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {phase === "form" && (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h1 className="text-2xl font-bold tracking-tight mb-6">Nouvelle séance</h1>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Titre</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Par ex. Séance du matin"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Durée (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Notes (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <Button onClick={() => setPhase("select")} className="w-full mt-2">
                Ajouter des exercices
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "select" && (
          <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="mb-6 flex items-center gap-3">
              <button onClick={() => setPhase("form")} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold tracking-tight">Ajouter des exercices</h1>
            </div>

            {plannedExercises.length > 0 && (
              <div className="mb-6 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Dans votre séance ({plannedExercises.length}) :</p>
                {plannedExercises.map((pe, i) => (
                  <div key={pe.exercise.id} className="flex items-center justify-between rounded-lg bg-primary/5 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{pe.exercise.name}</span>
                      <Badge variant="secondary" className="text-xs">{pe.numSets} séries</Badge>
                    </div>
                    <button
                      onClick={() => setPlannedExercises((prev) => prev.filter((_, j) => j !== i))}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un exercice..."
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Tous</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {filteredExercises?.map((ex) => (
                <AddExerciseCard
                  key={ex.id}
                  exercise={ex}
                  onAdd={handleAddExercise}
                />
              ))}
              {filteredExercises?.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Aucun exercice disponible
                </p>
              )}
            </div>

            {plannedExercises.length > 0 && (
              <Button onClick={handleStartWorkout} className="w-full mt-6" size="lg">
                <Play className="mr-2 h-4 w-4" />
                Commencer l'entraînement
              </Button>
            )}
          </motion.div>
        )}

        {phase === "active" && currentExercise && (
          <motion.div key="active" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>Exercice {currentExIndex + 1}/{plannedExercises.length}</span>
              <span>Série {currentSet}/{totalSets}</span>
            </div>

            <div className="mb-6 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${((currentSet - 1) / totalSets) * 100}%` }}
              />
            </div>

            <div className="mb-6">
              <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-4 mb-4">
                <Dumbbell className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">{currentExercise.exercise.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                MET {currentExercise.exercise.met_value} — {currentExercise.exercise.category}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!showRepInput ? (
                <motion.div key="timer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Récupération</p>
                    <div className="text-7xl font-bold tracking-tighter tabular-nums mb-4">
                      {formatTime(timerValue)}
                    </div>
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <button
                        onClick={() => setTimerValue((v) => Math.max(5, v - 5))}
                        className="rounded-lg border border-border px-4 py-1.5 text-sm hover:bg-accent transition-colors"
                      >
                        -5s
                      </button>
                      <button
                        onClick={() => setTimerValue((v) => v + 5)}
                        className="rounded-lg border border-border px-4 py-1.5 text-sm hover:bg-accent transition-colors"
                      >
                        +5s
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    {timerRunning ? (
                      <Button onClick={pauseTimer} variant="outline" size="lg">
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                    ) : (
                      <Button onClick={startTimer} variant="outline" size="lg">
                        <Play className="mr-2 h-4 w-4" />
                        Reprendre
                      </Button>
                    )}
                    <Button onClick={skipTimer} size="lg">
                      <SkipForward className="mr-2 h-4 w-4" />
                      Passer
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="reps" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <p className="text-sm text-muted-foreground mb-2">
                    Série {currentSet} — Combien de répétitions ?
                  </p>
                  <input
                    ref={inputRef}
                    type="number"
                    min={0}
                    value={currentReps ?? ""}
                    onChange={(e) => setCurrentReps(e.target.value ? Number(e.target.value) : null)}
                    onKeyDown={(e) => { if (e.key === "Enter") confirmReps() }}
                    placeholder="0"
                    className="w-32 text-center text-5xl font-bold bg-transparent border-b-2 border-primary/50 focus:border-primary outline-none mx-auto mb-6 tabular-nums [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      onClick={confirmReps}
                      disabled={currentReps === null || currentReps < 0}
                      size="lg"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {isLastSet && isLastExercise ? "Terminer" : isLastSet ? "Exercice suivant" : "Série suivante"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {plannedExercises.length > 1 && (
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground mb-3">À venir :</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {plannedExercises.map((pe, i) => (
                    <Badge
                      key={pe.exercise.id}
                      variant={i === currentExIndex ? "default" : i < currentExIndex ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {i < currentExIndex && <Check className="mr-1 h-3 w-3" />}
                      {pe.exercise.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {phase === "complete" && (
          <motion.div key="complete" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Entraînement terminé !</h1>
              <p className="text-muted-foreground mt-1">Bravo, tu as terminé toutes tes séries.</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 mb-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exercices</span>
                <span className="font-medium">{plannedExercises.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Séries totales</span>
                <span className="font-medium">
                  {plannedExercises.reduce((sum, pe) => sum + pe.numSets, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Calories estimées</span>
                <span className="font-medium flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  {currentCalories} kcal
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {plannedExercises.map((pe, i) => (
                <div key={pe.exercise.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{pe.exercise.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{pe.numSets} séries</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pe.sets.map((s, j) => (
                      <span
                        key={j}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${
                          s.completed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        #{j + 1}
                        {s.reps !== null && <>({s.reps} rep{s.reps > 1 ? "s" : ""})</>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push("/workouts")} className="flex-1">
                <List className="mr-2 h-4 w-4" />
                Mes séances
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                {isSaving ? "Enregistrement..." : "Enregistrer la séance"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AddExerciseCard({
  exercise,
  onAdd,
}: {
  exercise: Exercise
  onAdd: (ex: Exercise, numSets: number) => void
}) {
  const [numSets, setNumSets] = useState(3)
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Dumbbell className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-medium">{exercise.name}</p>
            <p className="text-xs text-muted-foreground">
              {exercise.category} — MET {exercise.met_value}
            </p>
          </div>
        </div>
        {!showForm ? (
          <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setNumSets((n) => Math.max(1, n - 1))}
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-medium">{numSets}</span>
              <button
                onClick={() => setNumSets((n) => n + 1)}
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
              >
                +
              </button>
            </div>
            <span className="text-xs text-muted-foreground">séries</span>
            <Button
              size="sm"
              onClick={() => { onAdd(exercise, numSets); setShowForm(false); setNumSets(3) }}
            >
              OK
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
