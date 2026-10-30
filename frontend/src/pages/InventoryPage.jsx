/**
 * InventoryPage — Product list, stock levels, low-stock alerts.
 * Full implementation in Phase 3.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

function inr(n) { return `₹${Number(n||0).toLocaleString('en-IN')}` }

export default function InventoryPage() {
  const { shop } = useAuth()
  const { t }    = useLanguage()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => { if (shop) loadProducts() }, [shop])

  async function loadProducts() {
    setLoading(true)
    if (shop.id === 'demo-shop-sharma-123') {
      const raw = localStorage.getItem('dukaanmate_demo_products')
      const prods = raw ? JSON.parse(raw) : []
      setProducts(prods.filter(p => p.is_active !== false))
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .order('name')
    if (!error) setProducts(data || [])
    setLoading(false)
  }

  async function deleteProduct(id) {
    if (!window.confirm('Is product ko delete karein?')) return
    if (shop.id === 'demo-shop-sharma-123') {
      const raw = localStorage.getItem('dukaanmate_demo_products')
      const prods = raw ? JSON.parse(raw) : []
      const updated = prods.map(p => p.id === id ? { ...p, is_active: false } : p)
      localStorage.setItem('dukaanmate_demo_products', JSON.stringify(updated))
      toast.success('Product delete ho gaya.')
      loadProducts()
      return
    }

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .eq('shop_id', shop.id) // Security: only this shop
    if (error) { toast.error(t('error')); return }
    toast.success('Product delete ho gaya.')
    loadProducts()
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function stockStatus(p) {
    if (p.quantity === 0)              return { label: t('outOfStock'), cls: 'badge-danger'  }
    if (p.quantity <= p.low_stock_limit) return { label: t('lowStock'),   cls: 'badge-warning' }
    return { label: t('inStock'), cls: 'badge-success' }
  }

  if (loading) return <div className="page-wrapper"><LoadingSpinner /></div>

  return (
    <div className="page-wrapper pb-20">
      <div className="page-header">
        <h2 className="flex-1">📦 {t('inventory')}</h2>
        <button onClick={() => navigate('/inventory/add')} className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold min-h-[44px]">
          + {t('addProduct')}
        </button>
      </div>

      <div className="px-4 py-3">
        <input className="input" placeholder={`🔍 ${t('search')}…`} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Reorder hint */}
      {products.filter(p => p.quantity <= p.low_stock_limit).length > 0 && (
        <div className="mx-4 mb-3 card border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
          ⚠️ {products.filter(p => p.quantity <= p.low_stock_limit).length} item(s) low/out of stock
        </div>
      )}

      <div className="px-4 flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-4xl mb-3">📦</p>
            <p>{t('noProducts')}</p>
          </div>
        )}
        {filtered.map(p => {
          const status = stockStatus(p)
          return (
            <div key={p.id} className="card flex flex-col gap-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.category} · {p.unit}</p>
                </div>
                <span className={status.cls}>{status.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Stock</p>
                  <p className="font-bold text-gray-800">{p.quantity}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Cost</p>
                  <p className="font-bold text-gray-800">{inr(p.purchase_price)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="font-bold text-orange-600">{inr(p.selling_price)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => navigate(`/inventory/edit/${p.id}`)} className="flex-1 btn-secondary !py-1.5 !text-sm">
                  ✏️ {t('edit')}
                </button>
                <button onClick={() => deleteProduct(p.id)} className="btn-danger !py-1.5 !px-3 text-sm">
                  🗑️
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

