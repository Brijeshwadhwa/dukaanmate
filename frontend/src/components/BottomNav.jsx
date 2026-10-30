/**
 * BottomNav — Mobile navigation bar at the bottom of the screen.
 * Large tap targets, icons + labels, active state highlighted.
 */
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

// Icons as simple SVG paths (no external icon library needed)
const NAV_ITEMS = [
  {
    to: '/dashboard',
    icon: '🏠',
    labelKey: 'dashboard',
  },
  {
    to: '/inventory',
    icon: '📦',
    labelKey: 'inventory',
  },
  {
    to: '/sales',
    icon: '💰',
    labelKey: 'sales',
  },
  {
    to: '/assistant',
    icon: '🤖',
    labelKey: 'assistant',
  },
  {
    to: '/invoice',
    icon: '🧾',
    labelKey: 'gstInvoice',
  },
]

export default function BottomNav() {
  const { t } = useLanguage()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-orange-100 safe-area-pb">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors
              ${isActive
                ? 'text-orange-600 bg-orange-50'
                : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'
              }`
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] mt-0.5 font-medium leading-tight">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

