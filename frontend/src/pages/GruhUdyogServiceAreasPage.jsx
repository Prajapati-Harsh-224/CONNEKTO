import { useEffect, useState } from 'react'
import { FiMapPin } from 'react-icons/fi'
import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getGruhUdyogServiceAreas } from '../services/gruhUdyogService.js'

export default function GruhUdyogServiceAreasPage() {
  const { t } = useLocale()
  const [areas, setAreas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getGruhUdyogServiceAreas()
      .then((response) => setAreas(response.data.serviceAreas))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <LoadingState message={t('loadingData')} />
  if (error) {
    return (
      <section className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-purple-600">{t('gruhUdyogWorkspace')}</div>
        <h1 className="text-2xl font-bold text-slate-900">{t('serviceAreasPageTitle')}</h1>
        <p className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl" role="alert">{error}</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">{t('gruhUdyogWorkspace')}</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('serviceAreasPageTitle')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('serviceAreasSummary')}</p>
      </div>

      {areas.length ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Covered Localities</h2>
          <div className="flex flex-wrap gap-2.5">
            {areas.map((area) => (
              <span
                key={area}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-xs"
              >
                <FiMapPin className="w-4 h-4 text-purple-600" />
                {area}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title={t('noServiceAreasConfigured')} message={t('serviceAreasSummary')} />
      )}
    </section>
  )
}
