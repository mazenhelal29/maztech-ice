# 🍦 نظام إدارة مصنع آيس كريم - ERP

نظام ERP متكامل لإدارة مصنع آيس كريم مبني بـ React + Vite + Supabase

## 🚀 خطوات التشغيل

### 1. إعداد Supabase
1. اذهب إلى [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً
2. من **SQL Editor** شغّل كامل ملف `supabase_schema.sql`
3. من **Authentication > Settings** فعّل Email/Password

### 2. إعداد المشروع
افتح ملف `.env` وضع بيانات Supabase:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

ستجد هذه البيانات في: **Supabase Dashboard > Settings > API**

### 3. إنشاء أول مستخدم Admin
1. من **Supabase > Authentication > Users** أضف مستخدماً جديداً
2. ثم من **SQL Editor** شغّل:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your-email@domain.com';
```

### 4. تشغيل التطبيق
```bash
npm install
npm run dev
```

## 📦 هيكل المشروع
```
src/
├── components/     # مكونات مشتركة
│   ├── Layout.jsx
│   ├── Sidebar.jsx
│   ├── Modal.jsx
│   ├── UI.jsx
│   └── ProtectedRoute.jsx
├── pages/          # صفحات النظام
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── MaterialsPage.jsx
│   ├── ProductsPage.jsx
│   ├── RecipesPage.jsx
│   ├── ProductionPage.jsx
│   ├── SalesPage.jsx
│   ├── CustomersPage.jsx
│   ├── ExpensesPage.jsx
│   ├── ReportsPage.jsx
│   └── UsersPage.jsx
├── services/       # خدمات Supabase
│   ├── materialsService.js
│   ├── productsService.js
│   ├── recipesService.js
│   ├── productionService.js
│   ├── salesService.js
│   ├── expensesService.js
│   ├── accountingService.js
│   └── usersService.js
├── store/          # Zustand
│   ├── authStore.js
│   └── appStore.js
├── hooks/
│   └── useRealtime.js
└── lib/
    └── supabase.js
```

## 🔐 الأدوار
| الميزة | مدير | موظف |
|--------|------|------|
| لوحة التحكم | ✅ | ✅ |
| المواد الخام | ✅ | ✅ |
| المنتجات | ✅ | ✅ |
| الوصفات | ✅ | ✅ |
| الإنتاج | ✅ | ✅ |
| المبيعات | ✅ | ✅ |
| العملاء | ✅ | ✅ |
| المصروفات | ✅ | ❌ |
| التقارير | ✅ | ❌ |
| المستخدمون | ✅ | ❌ |

## 🛠 التقنيات
- **React 18** + **Vite**
- **Supabase** (Auth + PostgreSQL + Realtime)
- **Zustand** (State Management)
- **React Router v6**
- **Recharts** (Charts)
- **Lucide React** (Icons)
- **React Hot Toast** (Notifications)
- **date-fns** (Date formatting)
