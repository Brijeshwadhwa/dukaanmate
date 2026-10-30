/**
 * ShopSetupPage — Collects shop profile info after first signup.
 * Validates GSTIN format, saves to Supabase 'shops' table.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import toast from 'react-hot-toast'

// Valid GSTIN format: 2 digits + 10 alphanumeric + 1 char + 1 char + 1 char + 1 char
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/

const BUSINESS_TYPES = ['General Store', 'Grocery', 'Medical', 'Electronics', 'Clothing', 'Food/Restaurant', 'Hardware', 'Other']
const CATEGORIES     = ['Food & Grocery', 'Beverages', 'Personal Care', 'Household', 'Electronics', 'Clothing', 'Medicines', 'Other']
const INDIA_STATES   = ['Punjab', 'Haryana', 'Delhi', 'Uttar Pradesh', 'Rajasthan', 'Maharashtra', 'Gujarat', 'Tamil Nadu', 'Karnataka', 'Other']

export default function ShopSetupPage() {
  const { t, lang } = useLanguage()
  const { user, setShop } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    city: '',
    state: 'Punjab',
    business_type: 'General Store',
    gst_registered: false,
    gstin: '',
    preferred_language: lang,
    product_category: 'Food & Grocery',
  })
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()

    // Validate GSTIN if GST registered
    if (form.gst_registered && form.gstin && !GSTIN_REGEX.test(form.gstin.toUpperCase())) {
      toast.error('GSTIN format galat hai. Example: 03ABCDE1234F1Z5')
      return
    }

    if (!form.shop_name.trim()) {
      toast.error('Dukaan ka naam zaroori hai.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        user_id: user.id,
        shop_name: form.shop_name.trim(),
        owner_name: form.owner_name.trim(),
        city: form.city.trim(),
        state: form.state,
        business_type: form.business_type,
        gst_registered: form.gst_registered,
        gstin: form.gst_registered && form.gstin ? form.gstin.toUpperCase() : null,
        preferred_language: form.preferred_language,
        product_category: form.product_category,
      }

      if (user.id === 'demo-user-sharma-123') {
        const demoShop = { ...payload, id: 'demo-shop-sharma-123' }
        localStorage.setItem('dukaanmate_demo_shop', JSON.stringify(demoShop))
        setShop(demoShop)
        toast.success(t('profileSaved'))
        navigate('/dashboard')
        return
      }

      const { data, error } = await supabase
        .from('shops')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) throw error
      setShop(data)
      toast.success(t('profileSaved'))
      navigate('/dashboard')
    } catch (err) {
      console.error('Shop save error:', err)
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper flex flex-col min-h-screen pb-8">
      <div className="page-header">
        <h1 className="flex-1 text-lg text-orange-700">🏪 {t('shopProfile')}</h1>
        <LanguageSelector />
      </div>

      <form onSubmit={handleSave} className="px-4 py-4 flex flex-col gap-4">
        {/* Shop name */}
        <div>
          <label className="label">{t('shopName')} *</label>
          <input className="input" value={form.shop_name} onChange={e => update('shop_name', e.target.value)} required placeholder="e.g. Sharma General Store" />
        </div>

        {/* Owner name */}
        <div>
          <label className="label">{t('ownerName')}</label>
          <input className="input" value={form.owner_name} onChange={e => update('owner_name', e.target.value)} placeholder="Apna naam" />
        </div>

        {/* City + State */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('city')}</label>
            <input className="input" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Ludhiana" />
          </div>
          <div>
            <label className="label">{t('state')}</label>
            <select className="input" value={form.state} onChange={e => update('state', e.target.value)}>
              {INDIA_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Business type */}
        <div>
          <label className="label">{t('businessType')}</label>
          <select className="input" value={form.business_type} onChange={e => update('business_type', e.target.value)}>
            {BUSINESS_TYPES.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>

        {/* Product category */}
        <div>
          <label className="label">{t('productCategory')}</label>
          <select className="input" value={form.product_category} onChange={e => update('product_category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* GST toggle */}
        <div className="card flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">{t('gstRegistered')}</p>
            <p className="text-xs text-gray-500">GST number milaa hua hai?</p>
          </div>
          <button
            type="button"
            onClick={() => update('gst_registered', !form.gst_registered)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors
              ${form.gst_registered ? 'bg-orange-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform
              ${form.gst_registered ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* GSTIN input (only if GST registered) */}
        {form.gst_registered && (
          <div>
            <label className="label">{t('gstin')}</label>
            <input
              className="input uppercase"
              value={form.gstin}
              onChange={e => update('gstin', e.target.value)}
              placeholder={t('gstinPlaceholder')}
              maxLength={15}
            />
            <p className="text-xs text-gray-400 mt-1">Format: 2 digits + 5 letters + 4 digits + 4 chars</p>
          </div>
        )}

        {/* Preferred language */}
        <div>
          <label className="label">{t('preferredLanguage')}</label>
          <div className="flex gap-3">
            {[['en','English'],['hi','हिंदी'],['pa','ਪੰਜਾਬੀ']].map(([code, label]) => (
              <button
                key={code}
                type="button"
                onClick={() => update('preferred_language', code)}
                className={`flex-1 py-2 rounded-xl border-2 font-medium text-sm transition-colors
                  ${form.preferred_language === code
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-600'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary mt-2" disabled={loading}>
          {loading ? t('savingProfile') : t('saveProfile')}
        </button>
      </form>
    </div>
  )
}

