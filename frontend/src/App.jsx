/**
 * DukaanMate — Main App Component
 * Sets up routing, auth protection, and global providers.
 * Uses react-router-dom v7 (compatible with v6 API using BrowserRouter).
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import BottomNav from './components/BottomNav'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import LoginPage        from './pages/LoginPage'
import SignupPage       from './pages/SignupPage'
import ShopSetupPage    from './pages/ShopSetupPage'
import DashboardPage    from './pages/DashboardPage'
import InventoryPage    from './pages/InventoryPage'
import AddEditProductPage from './pages/AddEditProductPage'
import SalesPage        from './pages/SalesPage'
import AssistantPage    from './pages/AssistantPage'
import InvoicePage      from './pages/InvoicePage'

/**
 * ProtectedRoute — Only shows the page if the user is logged in.
 * If not logged in, redirects to /login.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-wrapper"><LoadingSpinner message="DukaanMate load ho raha hai…" /></div>
  if (!user)   return <Navigate to="/login" replace />
  return children
}

/**
 * AppWithNav — Wraps protected pages with the bottom navigation bar.
 */
function AppWithNav({ children }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}

/**
 * AppRoutes — All routes in one place.
 */
function AppRoutes() {
  const { user, shop, loading } = useAuth()

  if (loading) return <div className="page-wrapper"><LoadingSpinner message="DukaanMate load ho raha hai…" /></div>

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"  element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />

      {/* Shop setup (logged in but no shop yet) */}
      <Route path="/shop-setup" element={
        <ProtectedRoute>
          <ShopSetupPage />
        </ProtectedRoute>
      } />

      {/* Protected routes with bottom nav */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          {/* If no shop profile, redirect to setup */}
          {user && !shop && !loading ? <Navigate to="/shop-setup" /> :
            <AppWithNav><DashboardPage /></AppWithNav>
          }
        </ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute><AppWithNav><InventoryPage /></AppWithNav></ProtectedRoute>
      } />
      <Route path="/inventory/add" element={
        <ProtectedRoute><AddEditProductPage /></ProtectedRoute>
      } />
      <Route path="/inventory/edit/:id" element={
        <ProtectedRoute><AddEditProductPage /></ProtectedRoute>
      } />

      <Route path="/sales" element={
        <ProtectedRoute><AppWithNav><SalesPage /></AppWithNav></ProtectedRoute>
      } />
      <Route path="/sales/new" element={
        <ProtectedRoute><AppWithNav><SalesPage initialShowForm /></AppWithNav></ProtectedRoute>
      } />

      <Route path="/assistant" element={
        <ProtectedRoute><AppWithNav><AssistantPage /></AppWithNav></ProtectedRoute>
      } />

      <Route path="/invoice" element={
        <ProtectedRoute><AppWithNav><InvoicePage /></AppWithNav></ProtectedRoute>
      } />
      <Route path="/invoice/new" element={
        <ProtectedRoute><InvoicePage /></ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/"  element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      <Route path="*"  element={<Navigate to={user ? '/dashboard' : '/login'} />} />
    </Routes>
  )
}

/**
 * App — Root component. Wraps everything in providers.
 */
export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          {/* Toast notifications — positioned at top for visibility */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: 'Noto Sans, sans-serif',
                fontSize: '15px',
                maxWidth: '380px',
              },
            }}
          />
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
