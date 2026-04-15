import React, { useState } from 'react'
import { PageHeader, ConfirmDialog, EmptyState } from '../components/UI'
import { Modal } from '../components/Modal'
import { expensesService } from '../services/expensesService'
import { useFetch, useRealtime } from '../hooks/useRealtime'
import { Plus, Edit2, Trash2, Receipt } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import toast from 'react-hot-toast'

const EMPTY = { title: '', amount: '', date: new Date().toISOString().split('T')[0], notes: '' }

export function ExpensesPage() {
  const { data: expenses, loading, refetch } = useFetch(expensesService.getAll)
  useRealtime('expenses', refetch)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteId, setDeleteId] = useState(null)

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (e) => { setEditing(e); setForm({ ...e, date: e.date?.split('T')[0] || e.date }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await expensesService.update(editing.id, form)
        toast.success('تم تحديث المصروف')
      } else {
        await expensesService.create(form)
        toast.success('تمت إضافة المصروف')
      }
      refetch(); closeModal()
    } catch (err) { toast.error(err.message) }
  }

  const handleDelete = async () => {
    try {
      await expensesService.delete(deleteId)
      toast.success('تم حذف المصروف')
      refetch()
    } catch (err) { toast.error(err.message) }
    setDeleteId(null)
  }

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <PageHeader
        title="المصروفات"
        subtitle={`الإجمالي: ${totalExpenses.toLocaleString('ar-EG')} ج.م`}
        action={
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} /> إضافة مصروف
          </button>
        }
      />

      {expenses.length === 0 ? (
        <EmptyState icon="🧾" title="لا توجد مصروفات" description="أضف مصروفاً للبدء" />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>البند</th>
                <th>المبلغ</th>
                <th>التاريخ</th>
                <th>ملاحظات</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp, i) => (
                <tr key={exp.id}>
                  <td>{i + 1}</td>
                  <td>
                    <div className="cell-with-icon">
                      <Receipt size={16} className="icon-orange" />
                      <strong>{exp.title}</strong>
                    </div>
                  </td>
                  <td><span className="text-danger">{Number(exp.amount).toLocaleString('ar-EG')} ج.م</span></td>
                  <td>{exp.date ? format(new Date(exp.date), 'dd MMM yyyy', { locale: ar }) : '-'}</td>
                  <td><small>{exp.notes || '-'}</small></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn--icon btn--ghost" onClick={() => openEdit(exp)}><Edit2 size={16} /></button>
                      <button className="btn btn--icon btn--ghost-danger" onClick={() => setDeleteId(exp.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}><strong>الإجمالي</strong></td>
                <td colSpan={4}><strong className="text-danger">{totalExpenses.toLocaleString('ar-EG')} ج.م</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <Modal open={modal} title={editing ? 'تعديل مصروف' : 'إضافة مصروف جديد'} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label className="form-label">البند *</label>
            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">المبلغ *</label>
            <input type="number" min="0" step="0.01" className="form-input" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">التاريخ *</label>
            <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">ملاحظات</label>
            <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={closeModal}>إلغاء</button>
            <button type="submit" className="btn btn--primary">حفظ</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="حذف المصروف" message="هل أنت متأكد من حذف هذا المصروف؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
