/**
 * DukaanMate — Language Context
 * Provides language state and `t()` function to all components.
 * Language preference is saved in localStorage so it persists.
 */
import { createContext, useContext, useState, useCallback } from 'react'
import { t as translate } from '../i18n/translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  // Load language preference from localStorage, default to 'en'
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('dukaanmate_lang') || 'en'
  })

  const setLang = useCallback((newLang) => {
    localStorage.setItem('dukaanmate_lang', newLang)
    setLangState(newLang)
  }, [])

  // Convenience: t('key') instead of translate(lang, 'key')
  const t = useCallback((key) => translate(lang, key), [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}

