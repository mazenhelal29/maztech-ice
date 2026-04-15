import { supabase } from '../lib/supabase'

export const accountingService = {
  async getDashboardStats() {
    const [salesRes, expensesRes, productionsRes, materialsRes] = await Promise.all([
      supabase.from('sales').select('total, created_at'),
      supabase.from('expenses').select('amount, date'),
      supabase.from('productions').select('total_cost, created_at'),
      supabase.from('raw_materials').select('*'),
    ])

    const totalSales = (salesRes.data || []).reduce((s, r) => s + Number(r.total), 0)
    const totalExpenses = (expensesRes.data || []).reduce((s, r) => s + Number(r.amount), 0)
    const totalProductionCost = (productionsRes.data || []).reduce((s, r) => s + Number(r.total_cost), 0)
    const netProfit = totalSales - totalExpenses - totalProductionCost

    const lowStockMaterials = (materialsRes.data || []).filter(
      (m) => Number(m.quantity) <= Number(m.min_quantity)
    )

    return {
      totalSales,
      totalExpenses,
      totalProductionCost,
      netProfit,
      lowStockMaterials,
      salesCount: (salesRes.data || []).length,
    }
  },

  async getTopProducts() {
    const { data } = await supabase
      .from('sale_items')
      .select('product_id, quantity, products(name)')
    if (!data) return []
    const map = {}
    for (const item of data) {
      const name = item.products?.name || 'غير معروف'
      map[name] = (map[name] || 0) + Number(item.quantity)
    }
    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  },

  async getSalesByPeriod(period = 'daily') {
    const { data } = await supabase.from('sales').select('total, created_at').order('created_at')
    if (!data) return []
    const map = {}
    for (const sale of data) {
      let key
      const d = new Date(sale.created_at)
      if (period === 'daily') key = d.toLocaleDateString('ar-EG')
      else if (period === 'monthly') key = `${d.getMonth() + 1}/${d.getFullYear()}`
      else key = `${d.getFullYear()}`
      map[key] = (map[key] || 0) + Number(sale.total)
    }
    return Object.entries(map).map(([date, total]) => ({ date, total }))
  },
}
