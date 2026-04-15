import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: false,
      error: null,

      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) throw error
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()
          set({ user: data.user, profile, loading: false })
          return { success: true }
        } catch (err) {
          set({ error: err.message, loading: false })
          return { success: false, error: err.message }
        }
      },

      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, profile: null })
      },

      fetchProfile: async (userId) => {
        const { data } = await supabase.from('users').select('*').eq('id', userId).single()
        if (data) set({ profile: data })
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, profile: s.profile }) }
  )
)
