import React, { useState } from 'react'
import { PageHeader, EmptyState } from '../components/UI'
import { Modal } from '../components/Modal'
import { productionService } from '../services/productionService'
import { productsService } from '../services/productsService'
import { useFetch, useRealtime } from '../hooks/useRealtime'
import { Plus, Factory } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import toast from 'react-hot-toast'

export function ProductionPage() {
  const { data: productions, loading, refetch } = useFetch(productionService.getAll)
  const { data: products } = useFetch(productsService.getAll)
  useRealtime('productions', refetch)

  const [modal, setModal] = useState(false)
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!productId || !quantity) return toast.error('اختر منتجاً وأدخل الكمية')
    setSubmitting(true)
    try {
      await productionService.create(productId, Number(quantity))
      toast.success('تمت عملية الإنتاج بنجاح')
      refetch()
      setModal(false)
      setProductId(''); setQuantity('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <PageHeader
        title="الإنتاج"
        subtitle={`${productions.length} دفعة إنتاجية`}
        action={
          <button className="btn btn--primary" onClick={() => setModal(true)}>
            <Plus size={18} /> تسجيل إنتاج
          </button>
        }
      />

      {productions.length === 0 ? (
        <EmptyState icon="🏭" title="لا توجد سجلات إنتاج" description="سجّل أول دفعة إنتاجية" />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>المنتج</th>
                <th>الكمية المنتجة</th>
                <th>تكلفة الإنتاج</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {productions.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="cell-with-icon">
                      <Factory size={16} className="icon-blue" />
                      {p.products?.name}
                    </div>
                  </td>
                  <td><strong>{p.quantity}</strong> وحدة</td>
                  <td>{Number(p.total_cost).toLocaleString('ar-EG')} ج.م</td>
                  <td>{p.created_at ? format(new Date(p.created_at), 'dd MMM yyyy', { locale: ar }) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} title="تسجيل دفعة إنتاج" onClose={() => setModal(false)}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label className="form-label">المنتج *</label>
            <select className="form-input" value={productId} onChange={e => setProductId(e.target.value)} required>
              <option value="">-- اختر منتجاً --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">الكمية المراد إنتاجها *</label>
            <input type="number" min="1" className="form-input" value={quantity} onChange={e => setQuantity(e.target.value)} required />
          </div>
          <div className="info-box">
            <p>⚠️ سيتم خصم المواد الخام تلقائياً بناءً على الوصفة وزيادة مخزون المنتج</p>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setModal(false)}>إلغاء</button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'جاري الإنتاج...' : 'تأكيد الإنتاج'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
