import { Link, useParams } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext.jsx'

export default function DashboardPlaceholderPage() {
  const { role } = useParams()
  const { t } = useLocale()
  const title = role === 'supplier' ? t('supplierWorkspace') : role === 'gruh-udyog' ? t('gruhUdyog') : t('shopOwnerWorkspace')

  return (
    <section className="setup-page narrow">
      <div className="eyebrow">{t('roleAwareRoute')}</div>
      <h1>{title}</h1>
      <p className="muted">{t('dashboardFunctionalityReserved')}</p>
      <Link className="button secondary" to="/">{t('returnHome')}</Link>
    </section>
  )
}
