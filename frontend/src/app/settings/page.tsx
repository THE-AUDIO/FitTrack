"use client"

import { useAuthStore } from "@/store/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Save, User, MapPin, Ruler, Weight } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { apiClient } from "@/lib/api"

export default function SettingsPage() {
  const { user, isLoading: authLoading, setUser } = useAuthStore()
  const router = useRouter()
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: "",
    weight_kg: "",
    height_cm: "",
    country: "",
    city: "",
    sex: "",
  })

  useEffect(() => {
    if (!authLoading && !user) router.push("/login")
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        weight_kg: user.weight_kg?.toString() || "",
        height_cm: user.height_cm?.toString() || "",
        country: user.country || "",
        city: user.city || "",
        sex: user.sex || "",
      })
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload: any = { full_name: form.full_name }
      if (form.weight_kg) payload.weight_kg = parseFloat(form.weight_kg)
      if (form.height_cm) payload.height_cm = parseInt(form.height_cm)
      if (form.country) payload.country = form.country
      if (form.city) payload.city = form.city
      if (form.sex) payload.sex = form.sex

      const updated = await apiClient("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      setUser(updated as any)
      showToast("Profil mis à jour", "success")
    } catch (err: any) {
      showToast(err.message || "Erreur", "error")
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Modifie ton profil et tes données biométriques
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Weight className="h-3.5 w-3.5 text-muted-foreground" />
                Poids (kg)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                Taille (cm)
              </Label>
              <Input
                type="number"
                value={form.height_cm}
                onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sexe</Label>
            <Select
              value={form.sex}
              onValueChange={(v) => setForm({ ...form, sex: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Non défini" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Homme</SelectItem>
                <SelectItem value="female">Femme</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Pays
              </Label>
              <Input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
