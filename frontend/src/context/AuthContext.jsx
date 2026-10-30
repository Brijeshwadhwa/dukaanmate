/**
 * DukaanMate — Auth Context
 * Provides current user session, shop profile, and Demo Mode for instant testing.
 */
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DEMO_USER, DEMO_SHOP, DEMO_INITIAL_PRODUCTS } from '../lib/demoData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [shop, setShop]       = useState(null)
  const [isDemo, setIsDemo]   = useState(false)
  const [loading, setLoading] = useState(true)

  // Initialize demo products in localStorage if not already present
  function ensureDemoProducts() {
    if (!localStorage.getItem('dukaanmate_demo_products')) {
      localStorage.setItem('dukaanmate_demo_products', JSON.stringify(DEMO_INITIAL_PRODUCTS))
    }
  }

  // Load shop profile for regular Supabase user
  async function loadShop(userId) {
    if (!userId) { setShop(null); return }
    try {
      const { data } = await supabase
        .from('shops')
        .select('*')
        .eq('user_id', userId)
        .maybe_single()
      setShop(data || null)
    } catch {
      setShop(null)
    }
  }

  useEffect(() => {
    // 1. Check if user was previously in demo mode
    const savedDemo = localStorage.getItem('dukaanmate_is_demo') === 'true'
    if (savedDemo) {
      ensureDemoProducts()
      setUser(DEMO_USER)
      const customShop = localStorage.getItem('dukaanmate_demo_shop')
      setShop(customShop ? JSON.parse(customShop) : DEMO_SHOP)
      setIsDemo(true)
      setLoading(false)
      return
    }

    // 2. Otherwise check Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadShop(session.user.id)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadShop(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Login as Sharma General Store Demo
  function loginAsDemo() {
    ensureDemoProducts()
    localStorage.setItem('dukaanmate_is_demo', 'true')
    setUser(DEMO_USER)
    setShop(DEMO_SHOP)
    setIsDemo(true)
  }

  async function signOut() {
    localStorage.removeItem('dukaanmate_is_demo')
    setIsDemo(false)
    setUser(null)
    setShop(null)
    try {
      await supabase.auth.signOut()
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, shop, setShop, isDemo, loginAsDemo, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
