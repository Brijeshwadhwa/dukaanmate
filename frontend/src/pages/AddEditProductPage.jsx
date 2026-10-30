/**
 * AddEditProductPage — Form to add or edit a product in inventory.
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import toast from 'react-hot-toast'

const UNITS       = ['piece', 'kg', 'gram', 'litre', 'ml', 'packet', 'dozen', 'box', 'bottle', 'bag']
const CATEGORIES  = ['Food & Grocery', 'Beverages', 'Personal Care', 'Household', 'Electronics', 'Clothing', 'Medicines', 'Other']

export default function AddEditProductPage() {
  const { shop } = useAuth()
  const { t }    = useLanguage()
  const navigate = useNavigate()
  const { id }   = useParams() // id present = edit mode

  const [form, setForm] = useState({
    name: '', category: 'Food & Grocery', purchase_price: '',
    selling_price: '', quantity: '', unit: 'piece', low_stock_limit: '5',
  })
  const [loading, setLoading] = useState(false)

  // Load existing product if editing
  useEffect(() => {
    if (!id || !shop) return
    if (shop.id === 'demo-shop-sharma-123') {
      const raw = localStorage.getItem('dukaanmate_demo_products')
      const prods = raw ? JSON.parse(raw) : []
      const p = prods.find(item => item.id === id)
      if (p) {
        setForm({
          name: p.name, category: p.category,
          purchase_price: p.purchase_price, selling_price: p.selling_price,
          quantity: p.quantity, unit: p.unit, low_stock_limit: p.low_stock_limit,
        })
      }
      return
    }

    supabase.from('products').select('*').eq('id', id).eq('shop_id', shop.id).single()
      .then(({ data }) => {
        if (data) setForm({
          name: data.name, category: data.category,
          purchase_price: data.purchase_price, selling_price: data.selling_price,
          quantity: data.quantity, unit: data.unit, low_stock_limit: data.low_stock_limit,
        })
      })
  }, [id, shop])

  function update(f, v) { setForm(p => ({ ...p, [f]: v })) }

  async function handleSave(e) {
    e.preventDefault()
    const purchase = parseFloat(form.purchase_price)
    const selling  = parseFloat(form.selling_price)
    const qty      = parseInt(form.quantity)
    const limit    = parseInt(form.low_stock_limit)

    if (isNaN(purchase) || purchase < 0) { toast.error('Purchase price sahi nahi hai.'); return }
    if (isNaN(selling)  || selling  < 0) { toast.error('Selling price sahi nahi hai.'); return }
    if (isNaN(qty)      || qty      < 0) { toast.error('Quantity sahi nahi hai.'); return }
    if (selling < purchase) { toast.error('⚠️ Selling price cost se kam hai! Nuksaan hoga.') }

    setLoading(true)
    try {
      if (shop.id === 'demo-shop-sharma-123') {
        const raw = localStorage.getItem('dukaanmate_demo_products')
        const prods = raw ? JSON.parse(raw) : []
        if (id) {
          const updated = prods.map(p => p.id === id ? {
            ...p,
            name: form.name.trim(), category: form.category,
            purchase_price: purchase, selling_price: selling,
            quantity: qty, unit: form.unit, low_stock_limit: limit,
          } : p)
          localStorage.setItem('dukaanmate_demo_products', JSON.stringify(updated))
          toast.success('Product update ho gaya!')
        } else {
          const newProd = {
            id: 'demo-prod-' + Date.now(),
            shop_id: shop.id, name: form.name.trim(), category: form.category,
            purchase_price: purchase, selling_price: selling,
            quantity: qty, unit: form.unit, low_stock_limit: limit, is_active: true,
          }
          prods.push(newProd)
          localStorage.setItem('dukaanmate_demo_products', JSON.stringify(prods))
          toast.success('Product add ho gaya!')
        }
        navigate('/inventory')
        return
      }

      const payload = {
        shop_id: shop.id, name: form.name.trim(), category: form.category,
        purchase_price: purchase, selling_price: selling,
        quantity: qty, unit: form.unit, low_stock_limit: limit, is_active: true,
      }
      if (id) {
        const { error } = await supabase.from('products').update(payload).eq('id', id).eq('shop_id', shop.id)
        if (error) throw error
        toast.success('Product update ho gaya!')
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        toast.success('Product add ho gaya!')
      }
      navigate('/inventory')
    } catch (err) {
      console.error(err)
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper pb-8">
      <div className="page-header">
        <button onClick={() => navigate('/inventory')} className="text-orange-600 font-semibold min-h-[44px] pr-2">← {t('back')}</button>
        <h2 className="flex-1">{id ? t('editProduct') : t('addProduct')}</h2>
      </div>

      <form onSubmit={handleSave} className="px-4 py-4 flex flex-col gap-4">
        <div>
          <label className="label">{t('productName')} *</label>
          <input className="input" value={form.name} onChange={e => update('name', e.target.value)} required placeholder="e.g. Lay's Chips" />
        </div>

        <div>
          <label className="label">{t('category')}</label>
          <select className="input" value={form.category} onChange={e => update('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('purchasePrice')}</label>
            <input className="input" type="number" min="0" step="0.01" value={form.purchase_price} onChange={e => update('purchase_price', e.target.value)} required placeholder="0.00" />
          </div>
          <div>
            <label className="label">{t('sellingPrice')}</label>
            <input className="input" type="number" min="0" step="0.01" value={form.selling_price} onChange={e => update('selling_price', e.target.value)} required placeholder="0.00" />
          </div>
        </div>

        {/* Profit preview */}
        {form.purchase_price && form.selling_price && (
          <div className={`card text-sm ${parseFloat(form.selling_price) >= parseFloat(form.purchase_price) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {parseFloat(form.selling_price) >= parseFloat(form.purchase_price)
              ? `✅ Profit: ₹${(parseFloat(form.selling_price) - parseFloat(form.purchase_price)).toFixed(2)} per ${form.unit}`
              : `❌ Selling price cost se kam hai! Nuksaan hoga.`
            }
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('quantity')}</label>
            <input className="input" type="number" min="0" value={form.quantity} onChange={e => update('quantity', e.target.value)} required placeholder="0" />
          </div>
          <div>
            <label className="label">{t('unit')}</label>
            <select className="input" value={form.unit} onChange={e => update('unit', e.target.value)}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">{t('lowStockLimit')}</label>
          <input className="input" type="number" min="0" value={form.low_stock_limit} onChange={e => update('low_stock_limit', e.target.value)} placeholder="5" />
          <p className="text-xs text-gray-400 mt-1">Jab stock is se kam ho toh alert aayega.</p>
        </div>

        <button type="submit" className="btn-primary mt-2" disabled={loading}>
          {loading ? t('loading') : (id ? t('save') : t('addProduct'))}
        </button>
      </form>
    </div>
  )
}

