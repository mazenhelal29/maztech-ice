import React, { useState } from 'react'
import { PageHeader, ConfirmDialog, EmptyState, Badge } from '../components/UI'
import { Modal } from '../components/Modal'
import { useFetch } from '../hooks/useRealtime'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, Shield, User } from 'lucide-react'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import toast from 'react-hot-toast'

async function getAllUsers() {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

const EMPTY_FORM = { name: '', email: '', password: '' }

export function UsersPage() {
  const { profile: currentUser } = useAuthStore()
  const { data: users, loading, refetch } = useFetch(getAllUsers)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true) }
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, email: u.email, password: '' }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editing) {
        await supabase.from('users').update({ name: form.name }).eq('id', editing.id)
        toast.success('تم تحديث المستخدم')
      } else {
        // Create auth user then profile
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name } }
        })
        if (authErr) throw authErr
        await supabase.from('users').insert([{
          id: authData.user.id,
          email: form.email,
          name: form.name,
        }])
        toast.success('تمت إضافة المستخدم')
      }
      refetch(); closeModal()
    } catch (err) { toast.error(err.message) }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    try {
      await supabase.from('users').delete().eq('id', deleteId)
      toast.success('تم حذف المستخدم')
      refetch()
    } catch (err) { toast.error(err.message) }
    setDeleteId(null)
  }

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <PageHeader
        title="إدارة المستخدمين"
        subtitle={`${users.length} مستخدم`}
        action={
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} /> إضافة مستخدم
          </button>
        }
      />

      {users.length === 0 ? (
        <EmptyState icon="👥" title="لا يوجد مستخدمون" />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>البريد الإلكتروني</th>
                <th>تاريخ الإنشاء</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{u.name?.[0] || '?'}</div>
                      <strong>{u.name}</strong>
                      {u.id === currentUser?.id && <span className="badge badge--info">أنت</span>}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.created_at ? format(new Date(u.created_at), 'dd MMM yyyy', { locale: ar }) : '-'}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn--icon btn--ghost" onClick={() => openEdit(u)}><Edit2 size={16} /></button>
                      {u.id !== currentUser?.id && (
                        <button className="btn btn--icon btn--ghost-danger" onClick={() => setDeleteId(u.id)}><Trash2 size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} title={editing ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label className="form-label">الاسم *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          {!editing && (
            <div className="form-group">
              <label className="form-label">البريد الإلكتروني *</label>
              <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          )}
          {!editing && (
            <div className="form-group">
              <label className="form-label">كلمة المرور *</label>
              <input type="password" className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
          )}
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={closeModal}>إلغاء</button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="حذف المستخدم" message="هل أنت متأكد من حذف هذا المستخدم؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
