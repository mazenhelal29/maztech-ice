import React from 'react'

export function LoadingSpinner({ text = 'جاري التحميل...' }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-action">{action}</div>}
    </div>
  )
}

export function StatCard({ icon, label, value, color, trend }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__content">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {trend && <span className="stat-card__trend">{trend}</span>}
      </div>
    </div>
  )
}

export function Badge({ children, variant = 'default' }) {
  return <span className={`badge badge--${variant}`}>{children}</span>
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  )
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>{title}</h3>
        </div>
        <div className="modal__body">
          <p>{message}</p>
        </div>
        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onCancel}>إلغاء</button>
          <button className="btn btn--danger" onClick={onConfirm}>تأكيد الحذف</button>
        </div>
      </div>
    </div>
  )
}
