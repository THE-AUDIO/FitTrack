"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Dumbbell, BarChart3, Brain, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Dumbbell,
    title: "Suivi par série",
    desc: "Enregistrez chaque série avec répétitions et poids.",
  },
  {
    icon: Zap,
    title: "Calcul MET calories",
    desc: "Calories automatiques basées sur votre poids et l'intensité.",
  },
  {
    icon: BarChart3,
    title: "Dashboard & Stats",
    desc: "Visualisez votre progression avec des graphiques clairs.",
  },
  {
    icon: Brain,
    title: "IA Nutrition",
    desc: "Recommandations alimentaires localisées post-séance.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-4xl text-center"
      >
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Dumbbell className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
          Suivez votre progression
          <br />
          <span className="gradient-text">atteignez vos objectifs</span>
        </h1>
        <p className="mb-8 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
          L&apos;application intelligente de suivi d&apos;entraînement à domicile.
          Calcul MET calories, analyses détaillées et recommandations nutritionnelles IA.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="text-base">
              Commencer gratuitement
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="text-base">
              Se connecter
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl"
      >
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className="glass rounded-xl p-6 card-hover"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
