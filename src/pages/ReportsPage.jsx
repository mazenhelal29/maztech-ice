import React, { useState, useEffect } from 'react'
import { PageHeader } from '../components/UI'
import { accountingService } from '../services/accountingService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']
const fmt = (n) => Number(n || 0).toLocaleString('ar-EG') + ' ج.م'

export function ReportsPage() {
  const [period, setPeriod] = useState('daily')
  const [salesData, setSalesData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [stats, setStats] = useState(null)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [s, p, st, inv] = await Promise.all([
        accountingService.getSalesByPeriod(period),
        accountingService.getTopProducts(),
        accountingService.getDashboardStats(),
        supabase.from('raw_materials').select('*').order('quantity'),
      ])
      setSalesData(s)
      setTopProducts(p)
      setStats(st)
      setInventory(inv.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [period])

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <PageHeader title="التقارير" subtitle="تحليل شامل لأداء المصنع" />

      {/* Period Selector */}
      <div className="period-selector">
        {['daily', 'monthly', 'yearly'].map(p => (
          <button
            key={p}
            className={`btn ${period === p ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => setPeriod(p)}
          >
            {p === 'daily' ? 'يومي' : p === 'monthly' ? 'شهري' : 'سنوي'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="stats-grid stats-grid--4">
        <div className="stat-card stat-card--green">
          <p className="stat-card__label">إجمالي المبيعات</p>
          <p className="stat-card__value">{fmt(stats?.totalSales)}</p>
        </div>
        <div className="stat-card stat-card--red">
          <p className="stat-card__label">المصروفات</p>
          <p className="stat-card__value">{fmt(stats?.totalExpenses)}</p>
        </div>
        <div className="stat-card stat-card--blue">
          <p className="stat-card__label">تكلفة الإنتاج</p>
          <p className="stat-card__value">{fmt(stats?.totalProductionCost)}</p>
        </div>
        <div className="stat-card stat-card--emerald">
          <p className="stat-card__label">صافي الربح</p>
          <p className="stat-card__value">{fmt(stats?.netProfit)}</p>
        </div>
      </div>

      <div className="reports-grid">
        {/* Sales Chart */}
        <div className="card card--full">
          <div className="card__header"><h3>📈 مخطط المبيعات</h3></div>
          <div className="card__body">
            {salesData.length === 0 ? (
              <p className="text-muted text-center">لا توجد بيانات</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    formatter={(v) => [v.toLocaleString('ar-EG') + ' ج.م', 'المبيعات']}
                  />
                  <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Products Pie */}
        <div className="card">
          <div className="card__header"><h3>🏆 أكثر المنتجات مبيعاً</h3></div>
          <div className="card__body">
            {topProducts.length === 0 ? (
              <p className="text-muted text-center">لا توجد بيانات</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={topProducts} dataKey="qty" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                    {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v + ' وحدة', 'الكمية']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Inventory Report */}
        <div className="card">
          <div className="card__header"><h3>📦 تقرير المخزون</h3></div>
          <div className="card__body">
            <div className="table-wrapper table-wrapper--compact">
              <table className="table table--sm">
                <thead>
                  <tr>
                    <th>المادة</th>
                    <th>الكمية</th>
                    <th>الحد الأدنى</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(m => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>{m.quantity} {m.unit}</td>
                      <td>{m.min_quantity}</td>
                      <td>
                        <span className={`badge ${Number(m.quantity) <= Number(m.min_quantity) ? 'badge--danger' : 'badge--success'}`}>
                          {Number(m.quantity) <= Number(m.min_quantity) ? 'منخفض' : 'طبيعي'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
