/**
 * DashboardPage — Home screen showing today's stats, low-stock alerts,
 * and quick action buttons. First screen shopkeeper sees after login.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import LoadingSpinner from '../components/LoadingSpinner'

// Format Indian currency
function inr(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export default function DashboardPage() {
  const { user, shop, signOut } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [stats,     setStats]     = useState(null)
  const [lowStock,  setLowStock]  = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (shop) loadDashboard()
  }, [shop])

  async function loadDashboard() {
    setLoading(true)
    try {
      if (shop.id === 'demo-shop-sharma-123') {
        // Read demo products and sales from localStorage
        const rawProds = localStorage.getItem('dukaanmate_demo_products')
        const prods = rawProds ? JSON.parse(rawProds) : []
        const low = prods.filter(p => p.quantity <= p.low_stock_limit && p.is_active !== false)
        setLowStock(low)

        const rawSales = localStorage.getItem('dukaanmate_demo_sales')
        const sales = rawSales ? JSON.parse(rawSales) : []
        const totalSales  = sales.reduce((s, r) => s + (Number(r.total_amount) || 0), 0)
        const totalProfit = sales.reduce((s, r) => s + (Number(r.profit_amount) || 0), 0)
        setStats({ totalSales, totalProfit, salesCount: sales.length })
        setLoading(false)
        return
      }

      // Today's date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      // Today's sales total
      const { data: salesData } = await supabase
        .from('sales')
        .select('total_amount, profit_amount')
        .eq('shop_id', shop.id)
        .gte('created_at', todayISO)

      const totalSales  = salesData?.reduce((s, r) => s + (r.total_amount  || 0), 0) ?? 0
      const totalProfit = salesData?.reduce((s, r) => s + (r.profit_amount || 0), 0) ?? 0

      setStats({ totalSales, totalProfit, salesCount: salesData?.length ?? 0 })

      // Low stock products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, quantity, low_stock_limit, unit')
        .eq('shop_id', shop.id)
        .eq('is_active', true)

      // Filter: quantity <= low_stock_limit
      const low = (products || []).filter(p => p.quantity <= p.low_stock_limit)
      setLowStock(low)
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }



  const QUICK_ACTIONS = [
    { label: t('addSale'),      icon: '💰', to: '/sales/new',     color: 'bg-green-500 hover:bg-green-600'   },
    { label: t('addStock'),     icon: '📦', to: '/inventory/add', color: 'bg-blue-500 hover:bg-blue-600'    },
    { label: t('askAssistant'), icon: '🤖', to: '/assistant',     color: 'bg-purple-500 hover:bg-purple-600' },
    { label: t('createInvoice'),icon: '🧾', to: '/invoice/new',   color: 'bg-orange-500 hover:bg-orange-600' },
  ]

  if (loading) return (
    <div className="page-wrapper">
      <LoadingSpinner message={t('loading')} />
    </div>
  )

  return (
    <div className="page-wrapper pb-20">
      {/* Header */}
      <div className="page-header">
        <div className="flex-1">
          <p className="text-xs text-gray-500">{t('goodMorning')},</p>
          <h2 className="text-orange-700 truncate">{shop?.shop_name || shop?.owner_name || 'Shopkeeper'}</h2>
        </div>
        <LanguageSelector />
        <button
          onClick={signOut}
          className="text-gray-400 hover:text-red-500 text-sm px-2 min-h-[44px]"
          title={t('logout')}
        >
          🚪
        </button>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Today's stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">{t('todaySales')}</p>
            <p className="text-2xl font-bold text-orange-600">{inr(stats?.totalSales)}</p>
            <p className="text-xs text-gray-400">{stats?.salesCount} sale{stats?.salesCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 mb-1">{t('todayProfit')}</p>
            <p className={`text-2xl font-bold ${(stats?.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {inr(stats?.totalProfit)}
            </p>
          </div>
        </div>

        {/* Low stock alerts */}
        {lowStock.length > 0 && (
          <div className="card border-red-100 bg-red-50">
            <h3 className="text-red-700 mb-2">⚠️ {t('lowStockAlerts')} ({lowStock.length})</h3>
            <div className="flex flex-col gap-2">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-800">{p.name}</span>
                  <span className={`badge-${p.quantity === 0 ? 'danger' : 'warning'}`}>
                    {p.quantity === 0 ? t('outOfStock') : `${p.quantity} ${p.unit} bache`}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="mt-3 text-sm text-red-600 underline font-medium"
            >
              Stock dekho →
            </button>
          </div>
        )}

        {/* Quick action buttons */}
        <div>
          <h3 className="text-gray-600 mb-3 text-sm font-semibold uppercase tracking-wide">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.to}
                onClick={() => navigate(action.to)}
                className={`${action.color} text-white rounded-2xl p-4 flex flex-col items-center gap-2 min-h-[88px] transition-colors shadow-sm`}
              >
                <span className="text-3xl">{action.icon}</span>
                <span className="text-sm font-semibold text-center leading-tight">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* No sales today */}
        {stats?.salesCount === 0 && (
          <div className="text-center text-gray-400 py-4 text-sm">
            📊 {t('noSalesToday')}
          </div>
        )}

        {/* Privacy note */}
        <p className="text-center text-xs text-gray-400 px-4 py-2 border-t border-gray-100">
          {t('privacyNote')}
        </p>
      </div>
    </div>
  )
}

