import { create } from 'zustand'

export const useAppStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  materials: [],
  setMaterials: (materials) => set({ materials }),

  products: [],
  setProducts: (products) => set({ products }),

  customers: [],
  setCustomers: (customers) => set({ customers }),

  expenses: [],
  setExpenses: (expenses) => set({ expenses }),

  productions: [],
  setProductions: (productions) => set({ productions }),

  sales: [],
  setSales: (sales) => set({ sales }),
}))
