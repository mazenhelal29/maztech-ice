import React, { useState } from 'react'
import { PageHeader, ConfirmDialog, EmptyState } from '../components/UI'
import { Modal } from '../components/Modal'
import { productsService } from '../services/productsService'
import { useFetch, useRealtime } from '../hooks/useRealtime'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { name: '', selling_price: '', quantity: '' }

export function ProductsPage() {
  const { data: products, loading, refetch } = useFetch(productsService.getAll)
  useRealtime('products', refetch)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (p) => { setEditing(p); setForm(p); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await productsService.update(editing.id, form)
        toast.success('تم تحديث المنتج')
      } else {
        await productsService.create(form)
        toast.success('تمت إضافة المنتج')
      }
      refetch(); closeModal()
    } catch (err) { toast.error(err.message) }
  }

  const handleDelete = async () => {
    try {
      await productsService.delete(deleteId)
      toast.success('تم حذف المنتج')
      refetch()
    } catch (err) { toast.error(err.message) }
    setDeleteId(null)
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <PageHeader
        title="المنتجات"
        subtitle={`${products.length} منتج`}
        action={
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} /> إضافة منتج
          </button>
        }
      />

      <div className="search-bar">
        <input className="form-input" placeholder="🔍 بحث عن منتج..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🍦" title="لا توجد منتجات" description="أضف منتجات للبدء" />
      ) : (
        <div className="products-grid">
          {filtered.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-card__icon">🍦</div>
              <div className="product-card__info">
                <h3>{p.name}</h3>
                <p className="product-card__price">{Number(p.selling_price).toLocaleString('ar-EG')} ج.م</p>
                <p className="product-card__stock">المخزون: <strong>{p.quantity}</strong> وحدة</p>
              </div>
              <div className="product-card__actions">
                <button className="btn btn--icon btn--ghost" onClick={() => openEdit(p)}><Edit2 size={16} /></button>
                <button className="btn btn--icon btn--ghost-danger" onClick={() => setDeleteId(p.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} title={editing ? 'تعديل منتج' : 'إضافة منتج جديد'} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label className="form-label">اسم المنتج *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">سعر البيع *</label>
            <input type="number" min="0" step="0.01" className="form-input" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">الكمية الأولية</label>
            <input type="number" min="0" className="form-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={closeModal}>إلغاء</button>
            <button type="submit" className="btn btn--primary">حفظ</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا المنتج؟"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
