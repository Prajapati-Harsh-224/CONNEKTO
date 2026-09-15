import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPackage, FiClock, FiCreditCard, FiTruck, FiList, FiChevronRight, FiArrowRight } from 'react-icons/fi'
import { HiSparkles } from 'react-icons/hi2'

import EmptyState from '../components/EmptyState.jsx'
import LoadingState from '../components/LoadingState.jsx'
import MetricCard from '../components/MetricCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocale } from '../context/LocaleContext.jsx'
import { getOrders } from '../services/orderService.js'

const cardIcons = {
  'Total orders': <FiPackage size={20} />,
  'Pending orders': <FiClock size={20} />,
  'Monthly spending': <FiCreditCard size={20} />,
}

export default function ShopOwnerDashboardPage() {
  const { user } = useAuth()
  const { t } = useLocale()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    getOrders()
      .then((res) => {
        if (isMounted) {
          setOrders(res.data?.orders || [])
        }
      })
      .catch((err) => {
        console.error('Failed to load shop owner orders:', err)
        if (isMounted) setOrders([])
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => { isMounted = false }
  }, [])

  const firstName = user?.name?.split(' ')[0] || 'there'

  const getDynamicGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const totalOrdersCount = orders.length
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending' || o.status === 'Accepted' || o.status === 'Preparing').length
  const totalSpending = orders.reduce((sum, o) => sum + Number(o.subtotal || o.amount || 0), 0)

  const summaryCards = [
    { label: t('totalOrders'), value: String(totalOrdersCount), detail: t('acrossAllSuppliers'), icon: cardIcons['Total orders'], actionTo: '/dashboard/shop-owner/orders' },
    { label: t('pendingOrders'), value: String(pendingOrdersCount), detail: t('needYourAttention'), icon: cardIcons['Pending orders'], actionTo: '/dashboard/shop-owner/orders' },
    { label: t('monthlySpending'), value: `₹${totalSpending.toLocaleString('en-IN')}`, detail: 'Total placed order value', icon: cardIcons['Monthly spending'], actionTo: '/dashboard/shop-owner/analytics' },
  ]

  const recentOrders = orders.slice(0, 5).map((o) => ({
    id: o.id,
    supplier: o.supplierName || 'Supplier',
    amount: `₹${Number(o.subtotal || o.amount || 0).toLocaleString('en-IN')}`,
    status: o.status,
    date: new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }))

  const deliveries = orders
    .filter((o) => o.status === 'Preparing' || o.status === 'Out for Delivery')
    .slice(0, 5)
    .map((o) => ({
      orderId: o.id,
      supplier: o.supplierName || 'Supplier',
      time: new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: o.status
    }))

  if (isLoading) return <LoadingState message={t('loadingWorkspace')} />

  return (
    <section className="shop-owner-dashboard">
      <header className="shop-owner-dashboard-header">
        <div>
          <h1>{getDynamicGreeting()}, {firstName}</h1>
          <p>{t('hereIsLatestView')}</p>
        </div>
      </header>


      <div className="summary-card-grid">
        {summaryCards.map((card) => (
          <MetricCard
            key={card.label}
            accent={card.accent}
            detail={card.detail}
            icon={card.icon}
            label={card.label}
            actionTo={card.actionTo}
            value={card.value}
          />
        ))}
      </div>

      <div className="shop-owner-lower-grid">
        <section className="data-panel recent-orders-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <span className="panel-icon accent-orange" aria-hidden="true"><FiList /></span>
              <h2>{t('recentOrders')}</h2>
            </div>
            <Link className="panel-link" to="/dashboard/shop-owner/orders">{t('viewAll')} <FiArrowRight /></Link>
          </div>
          {recentOrders.length ? (
            <div className="recent-orders-table" role="table" aria-label={t('recentOrders')}>
              <div className="recent-orders-head" role="row">
                <span role="columnheader">#</span>
                <span role="columnheader">{t('supplier')}</span>
                <span role="columnheader">{t('amount')}</span>
                <span role="columnheader">{t('status')}</span>
                <span role="columnheader">{t('date')}</span>
                <span aria-hidden="true" />
              </div>

              {recentOrders.map((order) => (
                <div className="recent-orders-row" key={order.id} role="row">
                  <span role="cell" className="num-font">{order.id}</span>
                  <span data-label={t('supplier')} role="cell">{order.supplier}</span>
                  <span data-label={t('amount')} role="cell" className="num-font">{order.amount}</span>
                  <span data-label={t('status')} role="cell"><StatusBadge status={order.status} /></span>
                  <span data-label={t('date')} role="cell" className="num-font">{order.date}</span>
                  <Link className="row-arrow" to={`/dashboard/shop-owner/orders/${encodeURIComponent(order.id)}`} aria-label={`View ${order.id}`}>
                    <FiChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent orders" message="When you place orders with suppliers, they will appear here." />
          )}
        </section>

        <section className="data-panel deliveries-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <span className="panel-icon accent-orange" aria-hidden="true"><FiTruck /></span>
              <h2>{t('todaysDeliveries')}</h2>
            </div>
            <Link className="panel-link" to="/dashboard/shop-owner/orders">{t('viewAll')} <FiArrowRight /></Link>
          </div>

          {deliveries.length ? (
            <div className="deliveries-list">
              {deliveries.map((delivery) => (
                <div className="delivery-item" key={`${delivery.orderId}-${delivery.supplier}`}>
                  <div className="delivery-icon" aria-hidden="true"><FiTruck size={16} /></div>
                  <div className="delivery-meta">
                    <div className="delivery-row-top">
                      <strong>{delivery.supplier}</strong>
                      <StatusBadge status={delivery.status} />
                    </div>
                    <div className="delivery-row-bottom">
                      <span className="num-font">{delivery.orderId}</span>
                      <span className="num-font">{delivery.time}</span>
                    </div>
                  </div>
                  <Link className="row-arrow" to={`/dashboard/shop-owner/orders/${encodeURIComponent(delivery.orderId)}`} aria-label={`View ${delivery.orderId}`}>
                    <FiChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t('noDeliveriesToday')} message={t('noDeliveriesTodayMessage')} />
          )}
        </section>
      </div>

      <section className="dashboard-insight">
        <span className="dashboard-insight-icon" aria-hidden="true"><HiSparkles /></span>
        <div>
          <strong>{t('keepBusinessStocked')}</strong>
          <p>{t('spendingInsight')}</p>
        </div>
        <Link className="panel-link" to="/dashboard/shop-owner/analytics">{t('viewInsights')} <FiArrowRight /></Link>
      </section>
    </section>
  )
}


