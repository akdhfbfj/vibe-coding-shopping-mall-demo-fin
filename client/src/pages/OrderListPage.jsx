import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { getOrders } from '@/api/orders.js'
import HomeFooter from '@/components/home/HomeFooter.jsx'
import HomeNavbar from '@/components/home/HomeNavbar.jsx'
import '@/pages/HomePage.css'
import '@/pages/OrderListPage.css'

const ORDER_TABS = [
  { id: 'all', label: '전체' },
  { id: 'confirmed', label: '주문 확인', statuses: ['pending', 'paid'] },
  { id: 'preparing', label: '상품 준비중', statuses: ['processing'] },
  { id: 'shipment_started', label: '배송 시작', statuses: ['shipment_started'] },
  { id: 'shipping', label: '배송 중', statuses: ['shipping'] },
  { id: 'completed', label: '배송 완료', statuses: ['delivered', 'completed'] },
  { id: 'cancelled', label: '주문 취소', statuses: ['cancelled'] },
]

const STATUS_META = {
  pending: { label: '주문 확인', badge: 'processing', message: '주문이 접수되었습니다.' },
  paid: { label: '주문 확인', badge: 'processing', message: '주문이 확인되었습니다.' },
  processing: { label: '상품 준비중', badge: 'processing', message: '상품을 준비하고 있습니다.' },
  shipment_started: { label: '배송 시작', badge: 'shipping', message: '배송이 시작되었습니다.' },
  shipping: { label: '배송 중', badge: 'shipping', message: '배송 중입니다.' },
  delivered: { label: '배송 완료', badge: 'completed', message: '배송이 완료되었습니다.' },
  completed: { label: '배송 완료', badge: 'completed', message: '주문이 완료되었습니다.' },
  cancelled: { label: '주문 취소', badge: 'cancelled', message: '주문이 취소되었습니다.' },
}

function formatPrice(price) {
  return `₩${new Intl.NumberFormat('ko-KR').format(price)}`
}

function formatOrderListDate(dateValue) {
  const date = new Date(dateValue)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getEstimatedArrival(dateValue) {
  const start = new Date(dateValue)
  const end = new Date(dateValue)
  start.setDate(start.getDate() + 5)
  end.setDate(end.getDate() + 7)

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
  })

  return `${formatter.format(start)}-${formatter.format(end)}, ${start.getFullYear()}`
}

function getStatusMeta(status) {
  return STATUS_META[status] || { label: status, badge: 'processing', message: '' }
}

function getTrackingNumber(order) {
  return order.payment?.transactionId || order.orderNumber
}

function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function OrderListPage() {
  const { user, setUser } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(user))
  const [error, setError] = useState('')

  const tabParam = searchParams.get('tab')
  const activeTab = ORDER_TABS.find((tab) => tab.id === tabParam)?.id || 'all'
  const activeTabLabel = ORDER_TABS.find((tab) => tab.id === activeTab)?.label || '전체'

  useEffect(() => {
    if (!user) {
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError('')

    getOrders({ limit: 100 })
      .then((data) => {
        if (isMounted) {
          setOrders(data.orders || [])
        }
      })
      .catch((fetchError) => {
        if (isMounted) {
          setError(fetchError.message || '주문 내역을 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [user])

  const tabCounts = useMemo(() => {
    const counts = { all: orders.length }

    ORDER_TABS.forEach((tab) => {
      if (tab.id === 'all') {
        return
      }

      counts[tab.id] = orders.filter((order) => tab.statuses.includes(order.status)).length
    })

    return counts
  }, [orders])

  const filteredOrders = useMemo(() => {
    const tab = ORDER_TABS.find((item) => item.id === activeTab)

    if (!tab || tab.id === 'all') {
      return orders
    }

    return orders.filter((order) => tab.statuses.includes(order.status))
  }, [orders, activeTab])

  const handleTabChange = (tabId) => {
    if (tabId === 'all') {
      setSearchParams({})
      return
    }

    setSearchParams({ tab: tabId })
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/orders' }} />
  }

  return (
    <div className="atelier-home order-list-page">
      <HomeNavbar user={user} setUser={setUser} />

      <section className="order-list-content atelier-container">
        <h1 className="order-list-heading">주문 내역</h1>

        <nav className="order-list-tabs" role="tablist" aria-label="주문 상태 필터">
          {ORDER_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const count = tabCounts[tab.id] ?? 0

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`order-list-tab${isActive ? ' order-list-tab--active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="order-list-tab-count">{count}</span>
              </button>
            )
          })}
        </nav>

        {isLoading && <p className="order-list-status">주문 내역을 불러오는 중...</p>}

        {!isLoading && error && <p className="order-list-status order-list-status--error">{error}</p>}

        {!isLoading && !error && filteredOrders.length === 0 && (
          <div className="order-list-empty">
            <p>{activeTab === 'all' ? '주문 내역이 없습니다.' : `${activeTabLabel} 상태의 주문이 없습니다.`}</p>
            <Link to="/" className="order-list-empty-link">쇼핑하러 가기</Link>
          </div>
        )}

        {!isLoading && !error && filteredOrders.length > 0 && (
          <ul className="order-list">
            {filteredOrders.map((order) => {
              const statusMeta = getStatusMeta(order.status)
              const trackingNumber = getTrackingNumber(order)
              const showTracking = ['shipment_started', 'shipping'].includes(order.status)

              return (
                <li key={order._id} className="order-card">
                  <header className="order-card-header">
                    <div className="order-card-header-left">
                      <span className="order-card-icon">
                        <TruckIcon />
                      </span>
                      <div>
                        <p className="order-card-id">주문 #{order.orderNumber}</p>
                        <p className="order-card-date">주문일: {formatOrderListDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="order-card-header-right">
                      <span className={`order-card-badge order-card-badge--${statusMeta.badge}`}>
                        {statusMeta.label}
                      </span>
                      <p className="order-card-total">{formatPrice(order.totalAmount)}</p>
                    </div>
                  </header>

                  <ul className="order-card-items">
                    {order.items.map((item) => (
                      <li key={item._id} className="order-card-item">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="order-card-item-image" />
                        ) : (
                          <div className="order-card-item-image order-card-item-image--placeholder" />
                        )}
                        <div className="order-card-item-info">
                          <p className="order-card-item-name">{item.name}</p>
                          {item.sku && (
                            <p className="order-card-item-meta">SKU: {item.sku}</p>
                          )}
                          <p className="order-card-item-meta">수량: {item.quantity}</p>
                        </div>
                        <p className="order-card-item-price">{formatPrice(item.lineTotal)}</p>
                      </li>
                    ))}
                  </ul>

                  <div className="order-card-footer">
                    <p className="order-card-status-msg">
                      {statusMeta.message}
                      {order.status !== 'cancelled' && (
                        <> 예상 도착일: {getEstimatedArrival(order.createdAt)}</>
                      )}
                    </p>
                    {showTracking && (
                      <p className="order-card-tracking">{trackingNumber}</p>
                    )}

                    <div className="order-card-actions">
                      <Link to={`/orders/${order._id}`} className="order-card-btn">
                        주문 상세보기
                      </Link>
                      {showTracking && (
                        <button type="button" className="order-card-btn order-card-btn--track">
                          <TruckIcon />
                          배송 추적
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <HomeFooter />
    </div>
  )
}

export default OrderListPage
