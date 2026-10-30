/**
 * SalesPage — Record a sale. Stock auto-decreases via backend transaction.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function SalesPage() {
  const { shop } = useAuth()
  const { t }    = useLanguage()
  const navigate = useNavigate()

  const [products,       setProducts]       = useState([])
  const [recentSales,    setRecentSales]    = useState([])
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [showForm,       setShowForm]       = useState(false)
  const [paymentMethod,  setPaymentMethod]  = useState('cash')
  const [items,          setItems]          = useState([{ product_id: '', quantity: 1, price: 0 }])

  useEffect(() => { if (shop) loadData() }, [shop])

  async function loadData() {
    setLoading(true)
    if (shop.id === 'demo-shop-sharma-123') {
      const rawProds = localStorage.getItem('dukaanmate_demo_products')
      const prods = rawProds ? JSON.parse(rawProds) : []
      setProducts(prods.filter(p => p.is_active !== false))

      const rawSales = localStorage.getItem('dukaanmate_demo_sales')
      const sales = rawSales ? JSON.parse(rawSales) : []
      setRecentSales(sales)
      setLoading(false)
      return
    }

    const [{ data: prods }, { data: sales }] = await Promise.all([
      supabase.from('products').select('id,name,selling_price,quantity,unit').eq('shop_id', shop.id).eq('is_active', true).order('name'),
      supabase.from('sales').select('id,total_amount,profit_amount,payment_method,created_at').eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(20),
    ])
    setProducts(prods || [])
    setRecentSales(sales || [])
    setLoading(false)
  }

  function updateItem(idx, field, value) {
    setItems(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      // Auto-fill price when product selected
      if (field === 'product_id') {
        const prod = products.find(p => p.id === value)
        if (prod) updated[idx].price = prod.selling_price
      }
      return updated
    })
  }

  function addItem()        { setItems(p => [...p, { product_id: '', quantity: 1, price: 0 }]) }
  function removeItem(idx)  { setItems(p => p.filter((_, i) => i !== idx)) }

  const totalAmount = items.reduce((s, i) => s + (parseFloat(i.price) * parseInt(i.quantity || 0)), 0)

  async function handleSale(e) {
    e.preventDefault()
    const validItems = items.filter(i => i.product_id && i.quantity > 0)
    if (validItems.length === 0) { toast.error('Kam se kam ek item select karein.'); return }

    setSaving(true)
    try {
      if (shop.id === 'demo-shop-sharma-123') {
        const rawProds = localStorage.getItem('dukaanmate_demo_products')
        const prods = rawProds ? JSON.parse(rawProds) : []
        let totalCost = 0
        let totalRev = 0

        // Check stock
        for (const item of validItems) {
          const p = prods.find(x => x.id === item.product_id)
          if (!p || p.quantity < item.quantity) {
            throw new Error(`Not enough stock for ${p ? p.name : 'product'} (available: ${p ? p.quantity : 0})`)
          }
        }

        // Deduct stock
        for (const item of validItems) {
          const p = prods.find(x => x.id === item.product_id)
          p.quantity -= item.quantity
          totalCost += (p.purchase_price || 0) * item.quantity
          totalRev  += (item.price || p.selling_price) * item.quantity
        }
        localStorage.setItem('dukaanmate_demo_products', JSON.stringify(prods))

        const newSale = {
          id: 'demo-sale-' + Date.now(),
          shop_id: shop.id,
          total_amount: totalRev,
          profit_amount: totalRev - totalCost,
          payment_method: paymentMethod,
          created_at: new Date().toISOString(),
        }
        const rawSales = localStorage.getItem('dukaanmate_demo_sales')
        const sales = rawSales ? JSON.parse(rawSales) : []
        sales.unshift(newSale)
        localStorage.setItem('dukaanmate_demo_sales', JSON.stringify(sales))

        toast.success(t('saleRecorded') + ' ' + t('stockUpdated'))
        setShowForm(false)
        setItems([{ product_id: '', quantity: 1, price: 0 }])
        loadData()
        return
      }

      // Post to backend — it handles the DB transaction safely
      await api.post('/api/sales', {
        shop_id: shop.id,
        payment_method: paymentMethod,
        items: validItems.map(i => ({
          product_id: i.product_id,
          quantity: parseInt(i.quantity),
          unit_price: parseFloat(i.price),
        })),
      })
      toast.success(t('saleRecorded') + ' ' + t('stockUpdated'))
      setShowForm(false)
      setItems([{ product_id: '', quantity: 1, price: 0 }])
      loadData()
    } catch (err) {
      toast.error(err.message || t('error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-wrapper"><LoadingSpinner /></div>

  return (
    <div className="page-wrapper pb-20">
      <div className="page-header">
        <h2 className="flex-1">💰 {t('sales')}</h2>
        <button onClick={() => setShowForm(true)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold min-h-[44px]">
          + {t('recordSale')}
        </button>
      </div>

      {/* Sale form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3>{t('recordSale')}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-2xl min-h-[44px] px-2">×</button>
            </div>
            <form onSubmit={handleSale} className="p-4 flex flex-col gap-4">
              {items.map((item, idx) => (
                <div key={idx} className="card border-gray-200 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold">Item {idx + 1}</p>
                    {idx > 0 && <button type="button" onClick={() => removeItem(idx)} className="text-red-400 text-sm">Remove</button>}
                  </div>
                  <select className="input" value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)} required>
                    <option value="">{t('selectProduct')}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                        {p.name} ({p.quantity} {p.unit}) — ₹{p.selling_price}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label text-xs">{t('quantity_sold')}</label>
                      <input className="input" type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                    </div>
                    <div>
                      <label className="label text-xs">Price (₹)</label>
                      <input className="input" type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} />
                    </div>
                  </div>
                  <p className="text-right text-sm font-semibold text-orange-600">
                    = ₹{(parseFloat(item.price||0) * parseInt(item.quantity||0)).toFixed(2)}
                  </p>
                </div>
              ))}

              <button type="button" onClick={addItem} className="btn-secondary !py-2 text-sm">
                + Add Another Item
              </button>

              <div>
                <label className="label">{t('paymentMethod')}</label>
                <div className="flex gap-2">
                  {[['cash', t('cash'), '💵'], ['upi', t('upi'), '📱'], ['credit', t('credit'), '📝']].map(([v, l, e]) => (
                    <button key={v} type="button" onClick={() => setPaymentMethod(v)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${paymentMethod === v ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200'}`}>
                      {e} {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card bg-orange-50 border-orange-200 flex justify-between items-center">
                <span className="font-semibold">{t('totalAmount')}</span>
                <span className="text-xl font-bold text-orange-600">₹{totalAmount.toFixed(2)}</span>
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? t('loading') : `✅ ${t('recordSale')}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Recent sales */}
      <div className="px-4 py-4 flex flex-col gap-3">
        <h3 className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Recent Sales</h3>
        {recentSales.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm">{t('noSalesToday')}</p>
          </div>
        )}
        {recentSales.map(sale => (
          <div key={sale.id} className="card flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800">₹{Number(sale.total_amount).toFixed(2)}</p>
              <p className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleString('en-IN')} · {sale.payment_method}</p>
            </div>
            {sale.profit_amount != null && (
              <span className={`text-sm font-semibold ${sale.profit_amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {sale.profit_amount >= 0 ? '+' : ''}₹{Number(sale.profit_amount).toFixed(2)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

