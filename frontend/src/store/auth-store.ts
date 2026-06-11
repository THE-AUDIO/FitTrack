"use client"

import { create } from "zustand"

interface User {
  id: string
  email: string
  full_name: string
  weight_kg: number | null
  height_cm: number | null
  birth_date: string | null
  sex: string | null
  country: string | null
  city: string | null
  role: string
  created_at: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    sessionStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    set({ user: null, isLoading: false })
  },
}))
