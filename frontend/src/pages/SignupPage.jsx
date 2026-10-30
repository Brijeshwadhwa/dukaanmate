/**
 * SignupPage — Create new account using Supabase Auth.
 * After signup, user is redirected to shop setup.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords match nahi kar rahe!')
      return
    }
    if (password.length < 6) {
      toast.error('Password kam se kam 6 characters ka hona chahiye.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      toast.success('Account ban gaya! Ab apni dukaan setup karein.')
      navigate('/shop-setup')
    } catch (err) {
      toast.error(err.message.includes('already registered')
        ? 'Yeh email pehle se registered hai. Login karein.'
        : t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper flex flex-col min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <div>
          <h1 className="text-orange-600">🏪 {t('appName')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{t('tagline')}</p>
        </div>
        <LanguageSelector />
      </div>

      <div className="flex-1 px-4 py-6">
        <h2 className="mb-6">{t('signup')}</h2>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="label">{t('email')}</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="apna@email.com"
            />
          </div>

          <div>
            <label className="label">{t('password')}</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="kam se kam 6 characters"
            />
          </div>

          <div>
            <label className="label">{t('confirmPassword')}</label>
            <input
              type="password"
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="same password dobara likho"
            />
          </div>

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? t('signingUp') : t('signupFree')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          {t('haveAccount')}{' '}
          <Link to="/login" className="text-orange-600 font-semibold underline">
            {t('loginHere')}
          </Link>
        </p>

        {/* Privacy note */}
        <p className="text-center text-xs text-gray-400 mt-8 px-4">
          {t('privacyNote')}
        </p>
      </div>
    </div>
  )
}

