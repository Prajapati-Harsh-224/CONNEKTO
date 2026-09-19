import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../services/api.js'
import { useLocale } from '../context/LocaleContext.jsx'

export default function NotificationDropdown({ role, isOpen, onClose, onUnreadChange }) {
  const { t } = useLocale()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('connecto_read_notifications') || '[]')
    } catch {
      return []
    }
  })
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    let isMounted = true

    async function loadNotifications() {
      setLoading(true)
      try {
        if (role === 'shop-owner') {
          const res = await apiRequest('/orders')
          if (isMounted && res.success && Array.isArray(res.data?.orders)) {
            const list = res.data.orders.map(order => ({
              id: `order-${order.id}-${order.status}-${order.updatedAt || order.createdAt}`,
              orderId: order.id,
              type: 'shop_order',
              title: `Order #${order.id.slice(0, 8)}: ${order.status}`,
              message: `Supplier: ${order.supplierName || 'Supplier'} · Subtotal: ₹${Number(order.subtotal || 0).toLocaleString('en-IN')}`,
              time: order.updatedAt || order.createdAt,
              link: order.id ? `/dashboard/shop-owner/orders/${order.id}` : '/dashboard/shop-owner/orders',
              status: order.status
            }))
            setNotifications(list)
          }
        } else if (role === 'supplier' || role === 'gruh-udyog') {
          const res = await apiRequest('/supplier/orders')
          if (isMounted && res.success && Array.isArray(res.data?.orders)) {
            const list = res.data.orders.map(order => ({
              id: `supplier-order-${order.id}-${order.status}-${order.updatedAt || order.createdAt}`,
              orderId: order.id,
              type: 'supplier_order',
              title: `New Order #${(order.id || '').slice(0, 8)}`,
              message: `From ${order.shopName || order.shopOwnerName || 'Shop Owner'} · Status: ${order.status} · Amount: ₹${Number(order.subtotal || 0).toLocaleString('en-IN')}`,
              time: order.createdAt,
              link: role === 'gruh-udyog'
                ? '/dashboard/gruh-udyog/orders'
                : (order.id ? `/dashboard/supplier/orders/${order.id}` : '/dashboard/supplier/orders'),
              status: order.status
            }))
            setNotifications(list)
          }
        }
      } catch (err) {
        console.error('Failed to load notifications:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadNotifications()
    return () => { isMounted = false }
  }, [role])


  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length

  useEffect(() => {
    if (onUnreadChange) {
      onUnreadChange(unreadCount)
    }
  }, [unreadCount, onUnreadChange])

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadIds(allIds)
    try {
      localStorage.setItem('connecto_read_notifications', JSON.stringify(allIds))
    } catch (e) {
      console.error(e)
    }
  }

  const handleItemClick = (id) => {
    if (!readIds.includes(id)) {
      const next = [...readIds, id]
      setReadIds(next)
      try {
        localStorage.setItem('connecto_read_notifications', JSON.stringify(next))
      } catch (e) {
        console.error(e)
      }
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute top-[calc(100%+0.5rem)] -right-14 sm:right-0 w-[calc(100vw-2rem)] max-w-[360px] max-h-[440px] bg-white shadow-2xl rounded-2xl border border-slate-100 z-50 flex flex-col overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
          <span>{t('notifications') || 'Notifications'}</span>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white rounded-full px-2 py-0.5 text-[11px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            type="button"
            className="text-xs font-semibold text-[#f06535] hover:text-[#e05424] cursor-pointer bg-transparent border-none p-0"
          >
            {t('markAllAsRead') || 'Mark all read'}
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-slate-50 py-1">
        {loading ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            {t('loadingNotifications') || 'Loading notifications...'}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            {t('noNotifications') || 'No notifications available'}
          </div>
        ) : (
          notifications.map(n => {
            const isRead = readIds.includes(n.id)
            return (
              <Link
                key={n.id}
                to={n.link}
                onClick={() => handleItemClick(n.id)}
                className={`block px-4 py-3 transition-colors ${
                  isRead ? 'bg-white hover:bg-slate-50' : 'bg-orange-50/40 hover:bg-orange-50/70'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      isRead ? 'bg-transparent' : 'bg-[#f06535]'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs ${isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'} truncate`}>
                      {n.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {n.message}
                    </div>
                    {n.time && (
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.time).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
