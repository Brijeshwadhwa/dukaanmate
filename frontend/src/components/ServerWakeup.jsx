/**
 * ServerWakeup — Shown when Render backend is cold-starting (free tier sleeps).
 * Friendly message so the shopkeeper knows to wait ~30 seconds.
 */
import { useLanguage } from '../context/LanguageContext'

export default function ServerWakeup() {
  const { t } = useLanguage()
  return (
    <div className="card border-yellow-200 bg-yellow-50 flex flex-col gap-2">
      <p className="font-semibold text-yellow-800">{t('serverWakingUp')}</p>
      <p className="text-sm text-yellow-700">{t('serverWakingUpDesc')}</p>
      <div className="w-full bg-yellow-200 rounded-full h-2 overflow-hidden mt-1">
        <div className="bg-yellow-500 h-2 rounded-full animate-pulse w-1/2" />
      </div>
    </div>
  )
}

