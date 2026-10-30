/**
 * LanguageSelector — Globe icon button that switches between
 * English / हिंदी / ਪੰਜਾਬੀ instantly.
 */
import { useLanguage } from '../context/LanguageContext'

const LANGUAGES = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'hi', label: 'हि', full: 'हिंदी' },
  { code: 'pa', label: 'ਪੰ', full: 'ਪੰਜਾਬੀ' },
]

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage()

  return (
    <div className="flex gap-1">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          title={l.full}
          className={`px-2 py-1 rounded-lg text-sm font-semibold transition-colors min-h-[36px] min-w-[36px]
            ${lang === l.code
              ? 'bg-orange-500 text-white shadow'
              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

