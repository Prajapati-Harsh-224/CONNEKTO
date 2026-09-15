import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../services/api.js'

export default function NotificationDropdown({ role, isOpen, onClose, onUnreadChange }) {
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
              link: `/dashboard/shop-owner/orders/${order.id}`,
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
              title: `New Order #${order.id.slice(0, 8)}`,
              message: `From ${order.shopName || order.shopOwnerName || 'Shop Owner'} · Status: ${order.status} · Amount: ₹${Number(order.subtotal || 0).toLocaleString('en-IN')}`,
              time: order.createdAt,
              link: `/dashboard/supplier/incoming-orders/${order.id}`,
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
    <div className="notification-dropdown" ref={dropdownRef} style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: '0',
      width: '360px',
      maxHeight: '440px',
      backgroundColor: '#ffffff',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>
          Notifications {unreadCount > 0 && <span style={{
            background: '#ef4444',
            color: '#fff',
            borderRadius: '9999px',
            padding: '2px 8px',
            fontSize: '0.75rem',
            marginLeft: '6px'
          }}>{unreadCount}</span>}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
            No notifications available
          </div>
        ) : (
          notifications.map(n => {
            const isRead = readIds.includes(n.id)
            return (
              <Link
                key={n.id}
                to={n.link}
                onClick={() => handleItemClick(n.id)}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f9fafb',
                  backgroundColor: isRead ? '#ffffff' : '#eff6ff',
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isRead ? 'transparent' : '#2563eb',
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: isRead ? 500 : 600, color: '#1f2937' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '2px' }}>
                      {n.message}
                    </div>
                    {n.time && (
                      <div style={{ fontSize: '0.725rem', color: '#9ca3af', marginTop: '4px' }}>
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
