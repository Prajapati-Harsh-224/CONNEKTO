import { Link, useParams } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext.jsx'

export default function DashboardPlaceholderPage() {
  const { role } = useParams()
  const { t } = useLocale()
  const title = role === 'supplier' ? t('supplierWorkspace') : role === 'gruh-udyog' ? t('gruhUdyog') : t('shopOwnerWorkspace')

  return (
    <section className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto space-y-4">
      <div className="text-xs font-bold uppercase tracking-wider text-brand-orange">{t('roleAwareRoute')}</div>
      <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500">{t('dashboardFunctionalityReserved')}</p>
      <Link
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-xs"
        to="/"
      >
        {t('returnHome')}
      </Link>
    </section>
  )
}
