import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import ProductEditor from './ProductEditor'
import OrdersList from './OrdersList'
import Settings from './Settings'

const TABS = [
  { key: 'product', label: 'المنتج والعروض' },
  { key: 'orders', label: 'الطلبات' },
  { key: 'settings', label: 'الإعدادات' },
]

export default function Dashboard() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('product')
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/dashboard/login')
    }
  }, [loading, user, navigate])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/dashboard/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        ...جارٍ التحقق
      </div>
    )
  }

  if (!user) {
    // brief flash before redirect kicks in
    return null
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between">
        <h1 className="font-bold text-lg">لوحة تحكم ملونات ميكا</h1>
        <button
          onClick={handleLogout}
          className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg"
        >
          تسجيل الخروج
        </button>
      </header>

      {/* TABS */}
      <nav className="bg-white border-b flex px-5 gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-4 text-sm font-bold border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* CONTENT */}
      <main className="p-5">
        {activeTab === 'product' && <ProductEditor />}
        {activeTab === 'orders' && <OrdersList />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  )
}