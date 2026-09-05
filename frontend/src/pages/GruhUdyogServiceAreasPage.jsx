import { useEffect, useState } from 'react'
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
  if (error) return <section className="catalog-page"><div className="eyebrow">{t('gruhUdyogWorkspace')}</div><h1>{t('serviceAreasPageTitle')}</h1><p className="form-message error" role="alert">{error}</p></section>

  return (
    <section className="catalog-page">
      <div className="catalog-heading">
        <div>
          <div className="eyebrow">{t('gruhUdyogWorkspace')}</div>
          <h1>{t('serviceAreasPageTitle')}</h1>
          <p className="muted">{t('serviceAreasSummary')}</p>
        </div>
      </div>

      {areas.length ? (
        <div className="service-area-list" style={{ marginTop: '1rem' }}>
          {areas.map((area) => <span key={area}>{area}</span>)}
        </div>
      ) : (
        <EmptyState title={t('noServiceAreasConfigured')} message={t('serviceAreasSummary')} />
      )}
    </section>
  )
}
