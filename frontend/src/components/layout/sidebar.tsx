"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Dumbbell,
  CalendarPlus,
  List,
  Target,
  BarChart3,
  Settings,
  ChefHat,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/workouts", label: "Mes séances", icon: List },
  { href: "/workouts/new", label: "Nouvelle séance", icon: CalendarPlus },
  { href: "/exercises", label: "Exercices", icon: Dumbbell },
  { href: "/stats", label: "Statistiques", icon: BarChart3 },
  { href: "/goals", label: "Objectifs", icon: Target },
  { href: "/settings", label: "Paramètres", icon: Settings },
]

const mobileNavItems = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/workouts", label: "Séances", icon: List },
  { href: "/workouts/new", label: "Nouveau", icon: CalendarPlus },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Profil", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  if (pathname === "/" || pathname === "/login" || pathname === "/register") return null

  return (
    <>
      <aside className="fixed left-0 top-16 bottom-0 z-30 hidden w-64 border-r border-border bg-background lg:block">
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
