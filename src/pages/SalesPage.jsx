import React, { useState } from 'react'
import { PageHeader, ConfirmDialog, EmptyState } from '../components/UI'
import { Modal } from '../components/Modal'
import { salesService } from '../services/salesService'
import { customersService } from '../services/salesService'
import { productsService } from '../services/productsService'
import { useFetch, useRealtime } from '../hooks/useRealtime'
import { Plus, Trash2, ShoppingCart } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import toast from 'react-hot-toast'

export function SalesPage() {
  const { data: sales, loading, refetch } = useFetch(salesService.getAll)
  const { data: customers } = useFetch(customersService.getAll)
  const { data: products } = useFetch(productsService.getAll)
  useRealtime('sales', refetch)

  const [modal, setModal] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1, price: '' }])
  const [deleteId, setDeleteId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, price: '' }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i, field, val) => {
    const next = [...items]
    next[i][field] = val
    if (field === 'product_id') {
      const prod = products.find(p => p.id === val)
      if (prod) next[i].price = prod.selling_price
    }
    setItems(next)
  }

  const total = items.reduce((s, i) => s + (Number(i.price) * Number(i.quantity) || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validItems = items.filter(i => i.product_id && i.quantity && i.price)
    if (!customerId || validItems.length === 0) return toast.error('اختر عميلاً وأضف منتجاً')
    setSubmitting(true)
    try {
      await salesService.create(customerId, validItems)
      toast.success('تم تسجيل البيع بنجاح')
      refetch(); setModal(false)
      setCustomerId(''); setItems([{ product_id: '', quantity: 1, price: '' }])
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    try {
      await salesService.delete(deleteId)
      toast.success('تم حذف الفاتورة')
      refetch()
    } catch (err) { toast.error(err.message) }
    setDeleteId(null)
  }

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <PageHeader
        title="المبيعات"
        subtitle={`${sales.length} فاتورة`}
        action={
          <button className="btn btn--primary" onClick={() => setModal(true)}>
            <Plus size={18} /> فاتورة جديدة
          </button>
        }
      />

      {sales.length === 0 ? (
        <EmptyState icon="🛒" title="لا توجد مبيعات بعد" description="أنشئ أول فاتورة بيع" />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>العميل</th>
                <th>المنتجات</th>
                <th>الإجمالي</th>
                <th>التاريخ</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>
                    <div><strong>{s.customers?.name}</strong></div>
                    <small>{s.customers?.phone}</small>
                  </td>
                  <td>
                    {s.sale_items?.map(item => (
                      <span key={item.id} className="product-tag">
                        {item.products?.name} ×{item.quantity}
                      </span>
                    ))}
                  </td>
                  <td><strong className="text-success">{Number(s.total).toLocaleString('ar-EG')} ج.م</strong></td>
                  <td>{s.created_at ? format(new Date(s.created_at), 'dd MMM yyyy', { locale: ar }) : '-'}</td>
                  <td>
                    <button className="btn btn--icon btn--ghost-danger" onClick={() => setDeleteId(s.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} title="إنشاء فاتورة بيع" onClose={() => setModal(false)} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">العميل *</label>
            <select className="form-input" value={customerId} onChange={e => setCustomerId(e.target.value)} required>
              <option value="">-- اختر عميلاً --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="sale-items-header">
            <h4>المنتجات</h4>
            <button type="button" className="btn btn--sm btn--outline" onClick={addItem}>
              <Plus size={14} /> إضافة منتج
            </button>
          </div>

          {items.map((item, i) => (
            <div key={i} className="sale-item-row">
              <select className="form-input" value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                <option value="">-- المنتج --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (متاح: {p.quantity})</option>)}
              </select>
              <input type="number" min="1" className="form-input input--sm" placeholder="الكمية" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
              <input type="number" min="0" step="0.01" className="form-input input--sm" placeholder="السعر" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} />
              {items.length > 1 && (
                <button type="button" className="btn btn--icon btn--ghost-danger" onClick={() => removeItem(i)}><Trash2 size={14} /></button>
              )}
            </div>
          ))}

          <div className="sale-total">
            <ShoppingCart size={18} />
            <span>الإجمالي: <strong>{total.toLocaleString('ar-EG')} ج.م</strong></span>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setModal(false)}>إلغاء</button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : 'تأكيد البيع'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="حذف الفاتورة" message="هل أنت متأكد من حذف هذه الفاتورة؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
