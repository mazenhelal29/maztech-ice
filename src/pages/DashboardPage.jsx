import React, { useEffect, useState } from 'react'
import { PageHeader, StatCard, EmptyState } from '../components/UI'
import { accountingService } from '../services/accountingService'
import { useRealtime } from '../hooks/useRealtime'
import {
  TrendingUp, TrendingDown, DollarSign, Factory,
  AlertTriangle, ShoppingCart
} from 'lucide-react'

function fmt(n) {
  return Number(n || 0).toLocaleString('ar-EG', { minimumFractionDigits: 0 }) + ' ج.م'
}

export function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([
        accountingService.getDashboardStats(),
        accountingService.getTopProducts(),
      ])
      setStats(s)
      setTopProducts(p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useRealtime('sales', load)
  useRealtime('expenses', load)
  useRealtime('productions', load)

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <PageHeader title="لوحة التحكم" subtitle="نظرة عامة على المصنع" />

      <div className="stats-grid">
        <StatCard
          icon={<DollarSign size={24} />}
          label="إجمالي المبيعات"
          value={fmt(stats?.totalSales)}
          color="green"
        />
        <StatCard
          icon={<TrendingDown size={24} />}
          label="إجمالي المصروفات"
          value={fmt(stats?.totalExpenses)}
          color="red"
        />
        <StatCard
          icon={<Factory size={24} />}
          label="تكلفة الإنتاج"
          value={fmt(stats?.totalProductionCost)}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="صافي الربح"
          value={fmt(stats?.netProfit)}
          color={stats?.netProfit >= 0 ? 'emerald' : 'red'}
        />
      </div>

      <div className="dashboard-grid">
        {/* Low Stock Alert */}
        <div className="card">
          <div className="card__header">
            <AlertTriangle size={20} className="icon-warning" />
            <h3>تحذير: مخزون منخفض</h3>
          </div>
          <div className="card__body">
            {stats?.lowStockMaterials?.length === 0 ? (
              <p className="text-success">✓ كل المواد متوفرة</p>
            ) : (
              <div className="alert-list">
                {stats?.lowStockMaterials?.map((m) => (
                  <div key={m.id} className="alert-item alert-item--warning">
                    <span>{m.name}</span>
                    <span>{m.quantity} {m.unit} / الحد الأدنى: {m.min_quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card__header">
            <ShoppingCart size={20} />
            <h3>أكثر المنتجات مبيعاً</h3>
          </div>
          <div className="card__body">
            {topProducts.length === 0 ? (
              <EmptyState icon="📦" title="لا توجد مبيعات بعد" />
            ) : (
              <div className="top-list">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="top-item">
                    <span className="top-item__rank">#{i + 1}</span>
                    <span className="top-item__name">{p.name}</span>
                    <span className="top-item__qty">{p.qty} وحدة</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
