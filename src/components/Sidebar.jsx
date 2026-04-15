import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useAppStore } from '../store/appStore'
import {
  LayoutDashboard, Package, ShoppingCart, Users, FlaskConical,
  Factory, Receipt, BarChart3, LogOut, ChevronRight, IceCream,
  UserCog, Boxes
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/materials', icon: Boxes, label: 'المواد الخام' },
  { to: '/products', icon: Package, label: 'المنتجات' },
  { to: '/recipes', icon: FlaskConical, label: 'الوصفات' },
  { to: '/production', icon: Factory, label: 'الإنتاج' },
  { to: '/sales', icon: ShoppingCart, label: 'المبيعات' },
  { to: '/customers', icon: Users, label: 'العملاء' },
  { to: '/expenses', icon: Receipt, label: 'المصروفات' },
  { to: '/reports', icon: BarChart3, label: 'التقارير' },
  { to: '/users', icon: UserCog, label: 'المستخدمين' },
]

export function Sidebar() {
  const { profile, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : 'sidebar--collapsed'}`}>
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <IceCream size={28} className="sidebar__logo-icon" />
          {sidebarOpen && <span className="sidebar__logo-text">مصنع آيس كريم</span>}
        </div>
        <button className="sidebar__toggle" onClick={toggleSidebar}>
          <ChevronRight size={18} className={sidebarOpen ? '' : 'rotate-180'} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
            }
          >
            <Icon size={20} className="sidebar__item-icon" />
            {sidebarOpen && <span className="sidebar__item-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        {sidebarOpen && (
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">{profile?.name?.[0] || 'م'}</div>
            <div className="sidebar__user-info">
              <p className="sidebar__user-name">{profile?.name || 'مستخدم'}</p>
            </div>
          </div>
        )}
        <button className="sidebar__logout" onClick={handleLogout} title="تسجيل الخروج">
          <LogOut size={18} />
          {sidebarOpen && <span>خروج</span>}
        </button>
      </div>
    </aside>
  )
}
