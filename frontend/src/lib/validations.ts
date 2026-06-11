import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
})

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères").max(128),
  full_name: z.string().min(1, "Nom requis").max(100),
})

export const onboardingSchema = z.object({
  weight_kg: z.number({ required_error: "Poids requis" }).min(20).max(500),
  height_cm: z.number({ required_error: "Taille requise" }).min(100).max(250),
  birth_date: z.string().min(1, "Date de naissance requise"),
  sex: z.enum(["male", "female"], { required_error: "Sexe requis" }),
  country: z.string().min(1, "Pays requis").max(100),
  city: z.string().max(100).optional(),
})

export const workoutSchema = z.object({
  title: z.string().min(1, "Titre requis").max(100),
  date: z.string().min(1, "Date requise"),
  duration_minutes: z.number({ required_error: "Durée requise" }).min(1).max(1440),
  notes: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>
