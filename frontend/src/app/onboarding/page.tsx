"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Dumbbell, ArrowRight, Save } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { apiClient } from "@/lib/api"
import { onboardingSchema, type OnboardingInput } from "@/lib/validations"
import { useAuthStore } from "@/store/auth-store"

const steps = [
  { title: "Biométrie", desc: "Poids, taille, âge" },
  { title: "Localisation", desc: "Pour les suggestions IA" },
  { title: "Finalisation", desc: "Prêt à commencer" },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()
  const { setUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
  })

  const watchSex = watch("sex")

  const onSubmit = async (data: OnboardingInput) => {
    if (step < 2) {
      setStep(step + 1)
      return
    }
    setIsLoading(true)
    try {
      const user = await apiClient("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify(data),
      })
      setUser(user as any)
      showToast("Profil complété ! Bienvenue sur FitTrack", "success")
      router.push("/dashboard")
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la sauvegarde", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (step < 2) setStep(step + 1)
    else handleSubmit(onSubmit)()
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Finalise ton profil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ces informations permettront des calculs précis
          </p>
        </div>

        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 w-8 transition-colors ${
                    i < step ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="weight_kg">Poids (kg)</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  placeholder="75"
                  {...register("weight_kg", { valueAsNumber: true })}
                />
                {errors.weight_kg && (
                  <p className="text-xs text-red-400">{errors.weight_kg.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_cm">Taille (cm)</Label>
                <Input
                  id="height_cm"
                  type="number"
                  placeholder="175"
                  {...register("height_cm", { valueAsNumber: true })}
                />
                {errors.height_cm && (
                  <p className="text-xs text-red-400">{errors.height_cm.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input
                  id="birth_date"
                  type="date"
                  {...register("birth_date")}
                />
                {errors.birth_date && (
                  <p className="text-xs text-red-400">{errors.birth_date.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Sexe</Label>
                <Select
                  value={watchSex || ""}
                  onValueChange={(v) => setValue("sex", v as "male" | "female")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionne ton sexe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Homme</SelectItem>
                    <SelectItem value="female">Femme</SelectItem>
                  </SelectContent>
                </Select>
                {errors.sex && (
                  <p className="text-xs text-red-400">{errors.sex.message}</p>
                )}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  placeholder="France"
                  {...register("country")}
                />
                {errors.country && (
                  <p className="text-xs text-red-400">{errors.country.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville (optionnel)</Label>
                <Input
                  id="city"
                  placeholder="Paris"
                  {...register("city")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ces données permettent à l&apos;IA de suggérer des aliments locaux.
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 text-center"
            >
              <div className="rounded-xl bg-primary/5 p-6">
                <Dumbbell className="mx-auto mb-3 h-12 w-12 text-primary" />
                <h3 className="text-lg font-semibold">Prêt à commencer !</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ton profil est configuré pour des calculs précis.
                </p>
              </div>
            </motion.div>
          )}

          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Retour
              </Button>
            )}
            <Button
              type={step < 2 ? "button" : "submit"}
              onClick={step < 2 ? handleNext : undefined}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                "Sauvegarde..."
              ) : step < 2 ? (
                <>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Terminer
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
