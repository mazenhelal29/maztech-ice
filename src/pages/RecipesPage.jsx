import React, { useState } from 'react'
import { PageHeader, ConfirmDialog, EmptyState } from '../components/UI'
import { Modal } from '../components/Modal'
import { recipesService } from '../services/recipesService'
import { productsService } from '../services/productsService'
import { materialsService } from '../services/materialsService'
import { useFetch, useRealtime } from '../hooks/useRealtime'
import { Plus, Trash2, Edit2, FlaskConical } from 'lucide-react'
import toast from 'react-hot-toast'

export function RecipesPage() {
  const { data: recipes, loading, refetch } = useFetch(recipesService.getAll)
  const { data: products } = useFetch(productsService.getAll)
  const { data: materials } = useFetch(materialsService.getAll)
  useRealtime('recipes', refetch)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [productId, setProductId] = useState('')
  const [items, setItems] = useState([{ raw_material_id: '', quantity: '' }])
  const [deleteId, setDeleteId] = useState(null)

  const openCreate = () => {
    setEditing(null)
    setProductId('')
    setItems([{ raw_material_id: '', quantity: '' }])
    setModal(true)
  }

  const openEdit = (r) => {
    setEditing(r)
    setProductId(r.product_id)
    setItems(r.recipe_items?.map(i => ({ raw_material_id: i.raw_material_id, quantity: i.quantity })) || [])
    setModal(true)
  }

  const addItem = () => setItems([...items, { raw_material_id: '', quantity: '' }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i, field, val) => {
    const next = [...items]
    next[i][field] = val
    setItems(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!productId) return toast.error('اختر منتجاً')
    const validItems = items.filter(i => i.raw_material_id && i.quantity)
    if (validItems.length === 0) return toast.error('أضف مادة خام واحدة على الأقل')
    try {
      if (editing) {
        await recipesService.update(editing.id, validItems)
        toast.success('تم تحديث الوصفة')
      } else {
        await recipesService.create(productId, validItems)
        toast.success('تمت إضافة الوصفة')
      }
      refetch(); setModal(false)
    } catch (err) { toast.error(err.message) }
  }

  const handleDelete = async () => {
    try {
      await recipesService.delete(deleteId)
      toast.success('تم حذف الوصفة')
      refetch()
    } catch (err) { toast.error(err.message) }
    setDeleteId(null)
  }

  // Calculate cost for a recipe
  const calcCost = (recipe) => {
    return recipe.recipe_items?.reduce((sum, item) => {
      const cost = Number(item.raw_materials?.cost_per_unit || 0)
      return sum + cost * Number(item.quantity)
    }, 0)
  }

  if (loading) return <div className="page-loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <PageHeader
        title="الوصفات (BOM)"
        subtitle={`${recipes.length} وصفة`}
        action={
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} /> إضافة وصفة
          </button>
        }
      />

      {recipes.length === 0 ? (
        <EmptyState icon="🧪" title="لا توجد وصفات" description="أنشئ وصفة لكل منتج" />
      ) : (
        <div className="recipe-grid">
          {recipes.map((r) => (
            <div key={r.id} className="recipe-card">
              <div className="recipe-card__header">
                <div className="recipe-card__icon"><FlaskConical size={22} /></div>
                <div>
                  <h3>{r.products?.name}</h3>
                  <p className="recipe-card__cost">تكلفة الوحدة: {Number(calcCost(r)).toLocaleString('ar-EG')} ج.م</p>
                </div>
                <div className="recipe-card__actions">
                  <button className="btn btn--icon btn--ghost" onClick={() => openEdit(r)}><Edit2 size={16} /></button>
                  <button className="btn btn--icon btn--ghost-danger" onClick={() => setDeleteId(r.id)}><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="recipe-card__items">
                {r.recipe_items?.map((item) => (
                  <div key={item.id} className="recipe-item">
                    <span>{item.raw_materials?.name}</span>
                    <span>{item.quantity} {item.raw_materials?.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} title={editing ? 'تعديل وصفة' : 'إضافة وصفة جديدة'} onClose={() => setModal(false)} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">المنتج *</label>
            <select className="form-input" value={productId} onChange={e => setProductId(e.target.value)} required>
              <option value="">-- اختر منتجاً --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="recipe-items-list">
            <div className="recipe-items-header">
              <h4>مكونات الوصفة</h4>
              <button type="button" className="btn btn--sm btn--outline" onClick={addItem}>
                <Plus size={14} /> إضافة مادة
              </button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="recipe-item-row">
                <select className="form-input" value={item.raw_material_id} onChange={e => updateItem(i, 'raw_material_id', e.target.value)}>
                  <option value="">-- المادة --</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
                <input type="number" min="0" step="0.001" className="form-input" placeholder="الكمية" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                {items.length > 1 && (
                  <button type="button" className="btn btn--icon btn--ghost-danger" onClick={() => removeItem(i)}><Trash2 size={14} /></button>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setModal(false)}>إلغاء</button>
            <button type="submit" className="btn btn--primary">حفظ الوصفة</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="حذف الوصفة" message="هل أنت متأكد من حذف هذه الوصفة؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
