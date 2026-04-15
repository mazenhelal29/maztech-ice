import React, { useState } from 'react'
import { PageHeader, ConfirmDialog, Badge, EmptyState } from '../components/UI'
import { Modal } from '../components/Modal'
import { materialsService } from '../services/materialsService'
import { useFetch, useRealtime } from '../hooks/useRealtime'
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const UNITS = ['كجم', 'لتر', 'قطعة', 'جرام', 'مل']
const EMPTY = { name: '', unit: 'كجم', quantity: '', cost_per_unit: '', min_quantity: '' }

export function MaterialsPage() {
  const { data: materials, loading, refetch } = useFetch(materialsService.getAll)
  useRealtime('raw_materials', refetch)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (m) => { setEditing(m); setForm(m); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await materialsService.update(editing.id, form)
        toast.success('تم تحديث المادة')
      } else {
        await materialsService.create(form)
        toast.success('تمت إضافة المادة')
      }
      refetch()
      closeModal()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async () => {
    try {
      await materialsService.delete(deleteId)
      toast.success('تم حذف المادة')
      refetch()
    } catch (err) {
      toast.error(err.message)
    }
    setDeleteId(null)
  }

  const filtered = materials.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <PageHeader
        title="المواد الخام"
        subtitle={`${materials.length} مادة مسجلة`}
        action={
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} /> إضافة مادة
          </button>
        }
      />

      <div className="search-bar">
        <input
          className="form-input"
          placeholder="🔍 بحث عن مادة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📦" title="لا توجد مواد" description="أضف مواد خام للبدء" />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الوحدة</th>
                <th>الكمية</th>
                <th>التكلفة/وحدة</th>
                <th>الحد الأدنى</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const isLow = Number(m.quantity) <= Number(m.min_quantity)
                return (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td>{m.unit}</td>
                    <td>{m.quantity}</td>
                    <td>{Number(m.cost_per_unit).toLocaleString('ar-EG')} ج.م</td>
                    <td>{m.min_quantity}</td>
                    <td>
                      {isLow ? (
                        <Badge variant="danger">
                          <AlertTriangle size={12} /> منخفض
                        </Badge>
                      ) : (
                        <Badge variant="success">متوفر</Badge>
                      )}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn--icon btn--ghost" onClick={() => openEdit(m)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn--icon btn--ghost-danger" onClick={() => setDeleteId(m.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} title={editing ? 'تعديل مادة' : 'إضافة مادة جديدة'} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label className="form-label">اسم المادة *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">الوحدة *</label>
            <select className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">الكمية *</label>
            <input type="number" min="0" step="0.01" className="form-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">التكلفة / وحدة *</label>
            <input type="number" min="0" step="0.01" className="form-input" value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">الحد الأدنى للمخزون *</label>
            <input type="number" min="0" step="0.01" className="form-input" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: e.target.value })} required />
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
        message="هل أنت متأكد من حذف هذه المادة؟"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
