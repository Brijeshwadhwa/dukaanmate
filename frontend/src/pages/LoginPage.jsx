/**
 * LoginPage — Email/password login using Supabase Auth.
 * Simple, large text, mobile-first design.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { t } = useLanguage()
  const { loginAsDemo } = useAuth()
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  function handleDemoLogin() {
    loginAsDemo()
    toast.success('Sharma General Store demo mode active! 🏪')
    navigate('/dashboard')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/dashboard')
    } catch (err) {
      // Show user-friendly message, not raw Supabase error
      toast.error(err.message === 'Invalid login credentials'
        ? 'Email ya password galat hai. Dobara try karein.'
        : t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrapper flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <div>
          <h1 className="text-orange-600">🏪 {t('appName')}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{t('tagline')}</p>
        </div>
        <LanguageSelector />
      </div>

      {/* Form */}
      <div className="flex-1 px-4 py-6">
        <h2 className="mb-6">{t('login')}</h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? t('loggingIn') : t('login')}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-orange-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500 font-medium">ya phir (or)</span>
          </div>
        </div>

        {/* Demo store login button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="btn-secondary !border-orange-500 !text-orange-700 flex items-center justify-center gap-2"
        >
          <span>🏪</span>
          <span>Try Demo Store (Sharma General Store)</span>
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          {t('noAccount')}{' '}
          <Link to="/signup" className="text-orange-600 font-semibold underline">
            {t('signupFree')}
          </Link>
        </p>
      </div>
    </div>
  )
}

