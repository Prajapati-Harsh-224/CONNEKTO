import { useState } from 'react'
import EmptyState from '../components/EmptyState.jsx'
import { useLocale } from '../context/LocaleContext.jsx'

const demoCustomers = [
  { name: 'Shree General Store', area: 'Indore', orders: 12, value: 'Rs 24,800' },
  { name: 'Mahalaxmi Provisions', area: 'Bhopal', orders: 9, value: 'Rs 18,940' },
  { name: 'Jai Ambe Mart', area: 'Dewas', orders: 7, value: 'Rs 14,680' },
]

export default function SupplierCustomersPage() {
  const { t } = useLocale()
  const [search, setSearch] = useState('')
  const customers = demoCustomers.filter((customer) => customer.name.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <section className="customers-page">
      <div className="customers-heading">
        <div>
          <div className="eyebrow">{t('supplierWorkspace')}</div>
          <h1>{t('customers')}</h1>
          <p className="muted">{t('customersDescription')}</p>
        </div>
        <span className="demo-label">{t('demoData')}</span>
      </div>
      <div className="customers-tools">
        <input aria-label={t('searchCustomers')} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchCustomers')} type="search" value={search} />
      </div>
      {customers.length ? (
        <div className="customer-list">
          {customers.map((customer) => (
            <article className="customer-card" key={customer.name}>
              <div className="customer-card-main">
                <span className="customer-avatar" aria-hidden="true">{customer.name.slice(0, 1)}</span>
                <div><h2>{customer.name}</h2><p>{customer.area}</p></div>
              </div>
              <div className="customer-card-stats"><span><strong>{customer.orders}</strong> {t('orders')}</span><strong>{customer.value}</strong></div>
            </article>
          ))}
        </div>
      ) : <EmptyState title={t('noCustomerData')} message={t('tryDifferentSearch')} />}
    </section>
  )
}
