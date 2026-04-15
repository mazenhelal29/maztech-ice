import React, { useState } from 'react'
import { PageHeader, ConfirmDialog, EmptyState } from '../components/UI'
import { Modal } from '../components/Modal'
import { customersService } from '../services/salesService'
import { useFetch, useRealtime } from '../hooks/useRealtime'
import { Plus, Edit2, Trash2, Phone, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { name: '', phone: '', address: '' }

export function CustomersPage() {
  const { data: customers, loading, refetch } = useFetch(customersService.getAll)
  useRealtime('customers', refetch)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (c) => { setEditing(c); setForm(c); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await customersService.update(editing.id, form)
        toast.success('تم تحديث العميل')
      } else {
        await customersService.create(form)
        toast.success('تمت إضافة العميل')
      }
      refetch(); closeModal()
    } catch (err) { toast.error(err.message) }
  }

  const handleDelete = async () => {
    try {
      await customersService.delete(deleteId)
      toast.success('تم حذف العميل')
      refetch()
    } catch (err) { toast.error(err.message) }
    setDeleteId(null)
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <PageHeader
        title="العملاء"
        subtitle={`${customers.length} عميل`}
        action={
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} /> إضافة عميل
          </button>
        }
      />

      <div className="search-bar">
        <input className="form-input" placeholder="🔍 بحث باسم أو رقم هاتف..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="👤" title="لا يوجد عملاء" description="أضف عملاء للبدء" />
      ) : (
        <div className="customers-grid">
          {filtered.map((c) => (
            <div key={c.id} className="customer-card">
              <div className="customer-card__avatar">{c.name?.[0] || '؟'}</div>
              <div className="customer-card__info">
                <h3>{c.name}</h3>
                {c.phone && <p><Phone size={13} /> {c.phone}</p>}
                {c.address && <p><MapPin size={13} /> {c.address}</p>}
              </div>
              <div className="customer-card__actions">
                <button className="btn btn--icon btn--ghost" onClick={() => openEdit(c)}><Edit2 size={16} /></button>
                <button className="btn btn--icon btn--ghost-danger" onClick={() => setDeleteId(c.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} title={editing ? 'تعديل عميل' : 'إضافة عميل جديد'} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label className="form-label">الاسم *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">رقم الهاتف</label>
            <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">العنوان</label>
            <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={closeModal}>إلغاء</button>
            <button type="submit" className="btn btn--primary">حفظ</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="حذف العميل" message="هل أنت متأكد من حذف هذا العميل؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
