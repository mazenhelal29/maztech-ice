import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { IceCream, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login, loading, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success) {
      toast.success('تم تسجيل الدخول بنجاح')
      navigate('/dashboard')
    } else {
      toast.error('خطأ في البريد أو كلمة المرور')
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bubble login-bubble--1" />
        <div className="login-bubble login-bubble--2" />
        <div className="login-bubble login-bubble--3" />
      </div>

      <div className="login-card">
        <div className="login-card__logo">
          <div className="login-logo-circle">
            <IceCream size={40} />
          </div>
        </div>
        <h1 className="login-card__title">مصنع الحلويات</h1>
        <p className="login-card__subtitle">نظام إدارة المصنع المتكامل مع Maz-Tech</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@factory.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <div className="input-with-icon">
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
