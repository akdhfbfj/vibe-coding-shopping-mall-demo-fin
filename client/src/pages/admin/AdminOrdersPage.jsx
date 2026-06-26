import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { getOrders, updateOrder } from '@/api/orders.js'
import { isAdminUser } from '@/utils/userRole.js'
import '@/pages/admin/AdminOrdersPage.css'

const ORDER_TABS = [
  { id: 'all', label: '전체' },
  { id: 'processing', label: '처리중', statuses: ['pending', 'paid', 'processing'] },
  { id: 'shipping', label: '배송중', statuses: ['shipment_started', 'shipping'] },
  { id: 'completed', label: '완료', statuses: ['delivered', 'completed'] },
]

const ADMIN_STATUS_OPTIONS = [
  { value: 'processing', label: '처리중' },
  { value: 'shipment_started', label: '배송 시작' },
  { value: 'shipping', label: '배송중' },
  { value: 'delivered', label: '배송 완료' },
  { value: 'completed', label: '완료' },
]

const STATUS_META = {
  pending: { label: '처리중', badge: 'processing', icon: 'clock' },
  paid: { label: '처리중', badge: 'processing', icon: 'clock' },
  processing: { label: '처리중', badge: 'processing', icon: 'clock' },
  shipment_started: { label: '배송중', badge: 'shipping', icon: 'truck' },
  shipping: { label: '배송중', badge: 'shipping', icon: 'truck' },
  delivered: { label: '완료', badge: 'completed', icon: 'check' },
  completed: { label: '완료', badge: 'completed', icon: 'check' },
  cancelled: { label: '취소', badge: 'cancelled', icon: 'clock' },
}

const TRACKING_STATUSES = ['shipment_started', 'shipping', 'delivered']

function normalizeAdminStatus(status) {
  if (['pending', 'paid', 'processing'].includes(status)) {
    return 'processing'
  }

  return status
}

function canManageOrder(status) {
  return status !== 'cancelled'
}

function formatPrice(price) {
  return `₩${new Intl.NumberFormat('ko-KR').format(price)}`
}

function formatOrderDate(dateValue) {
  const date = new Date(dateValue)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getStatusMeta(status) {
  return STATUS_META[status] || { label: status, badge: 'processing', icon: 'clock' }
}

function getItemCount(order) {
  return order.items.reduce((sum, item) => sum + item.quantity, 0)
}

function getTrackingNumber(order) {
  return order.payment?.transactionId || order.orderNumber
}

function formatAddress(order) {
  const { shippingAddress } = order

  if (!shippingAddress) {
    return '-'
  }

  return `[${shippingAddress.postalCode}] ${shippingAddress.address}`
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
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

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function StatusIcon({ type }) {
  if (type === 'truck') {
    return <TruckIcon />
  }

  if (type === 'check') {
    return <CheckIcon />
  }

  return <ClockIcon />
}

function AdminOrdersPage() {
  const { user } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  const activeTab = searchParams.get('tab') || 'all'

  const loadOrders = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getOrders({ limit: 100 })
      setOrders(data.orders || [])
    } catch (loadError) {
      setError(loadError.message || '주문 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user || !isAdminUser(user)) {
      return
    }

    loadOrders()
  }, [user])

  const filteredOrders = useMemo(() => {
    const tab = ORDER_TABS.find((item) => item.id === activeTab)
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesTab =
        !tab || tab.id === 'all' || tab.statuses.includes(order.status)

      if (!matchesTab) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const customerName = order.user?.name?.toLowerCase() || ''
      const orderNumber = order.orderNumber?.toLowerCase() || ''

      return orderNumber.includes(normalizedQuery) || customerName.includes(normalizedQuery)
    })
  }, [orders, activeTab, searchQuery])

  const handleTabChange = (tabId) => {
    if (tabId === 'all') {
      setSearchParams({})
      return
    }

    setSearchParams({ tab: tabId })
  }

  const handleOrderUpdate = async (orderId, payload) => {
    setUpdatingOrderId(orderId)
    setError('')

    try {
      const updatedOrder = await updateOrder(orderId, payload)
      setOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder : order)))
    } catch (updateError) {
      setError(updateError.message || '주문 상태 변경에 실패했습니다.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleStatusChange = (order, nextStatus) => {
    const currentStatus = normalizeAdminStatus(order.status)

    if (nextStatus === currentStatus) {
      return
    }

    handleOrderUpdate(order._id, { status: nextStatus })
  }

  const handleCancelOrder = (order) => {
    if (!window.confirm('이 주문을 취소하시겠습니까?')) {
      return
    }

    handleOrderUpdate(order._id, {
      status: 'cancelled',
      cancelReason: '관리자 취소',
    })
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="admin-orders-page">
      <header className="admin-orders-topbar">
        <div className="admin-orders-topbar-inner">
          <div className="admin-orders-title-group">
            <Link to="/admin" className="admin-orders-back" aria-label="관리자 대시보드로 돌아가기">
              <BackIcon />
            </Link>
            <h1 className="admin-orders-heading">주문 관리</h1>
          </div>
        </div>
      </header>

      <main className="admin-orders-main">
        <div className="admin-orders-toolbar">
          <label className="admin-orders-search">
            <SearchIcon />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="주문번호 또는 고객명으로 검색..."
            />
          </label>
          <button type="button" className="admin-orders-filter-btn">
            <FilterIcon />
            필터
          </button>
        </div>

        <nav className="admin-orders-tabs" aria-label="주문 상태 필터">
          {ORDER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-orders-tab${activeTab === tab.id ? ' admin-orders-tab--active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {error && <p className="admin-orders-status admin-orders-status--error">{error}</p>}

        {isLoading && <p className="admin-orders-status">주문 목록을 불러오는 중...</p>}

        {!isLoading && filteredOrders.length === 0 && (
          <div className="admin-orders-empty">
            <p>표시할 주문이 없습니다.</p>
          </div>
        )}

        {!isLoading && filteredOrders.length > 0 && (
          <ul className="admin-orders-list">
            {filteredOrders.map((order) => {
              const statusMeta = getStatusMeta(order.status)
              const customerName = order.user?.name || order.shippingAddress?.recipientName || '고객'
              const isUpdating = updatingOrderId === order._id
              const showActions = canManageOrder(order.status)
              const showTracking = TRACKING_STATUSES.includes(order.status)
              const canCancel = !['completed', 'delivered', 'cancelled'].includes(order.status)

              return (
                <li key={order._id} className="admin-order-card">
                  <header className="admin-order-card-header">
                    <div className="admin-order-card-header-left">
                      <span className={`admin-order-card-icon admin-order-card-icon--${statusMeta.badge}`}>
                        <StatusIcon type={statusMeta.icon} />
                      </span>
                      <div>
                        <p className="admin-order-card-id">{order.orderNumber}</p>
                        <p className="admin-order-card-meta">
                          {customerName} · {formatOrderDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="admin-order-card-header-right">
                      <span className={`admin-order-card-badge admin-order-card-badge--${statusMeta.badge}`}>
                        {statusMeta.label}
                      </span>
                      <p className="admin-order-card-total">{formatPrice(order.totalAmount)}</p>
                      <Link to={`/orders/${order._id}`} className="admin-order-card-detail-btn">
                        <EyeIcon />
                        상세보기
                      </Link>
                    </div>
                  </header>

                  <div className="admin-order-card-info">
                    <div className="admin-order-card-info-col">
                      <p className="admin-order-card-info-label">고객 정보</p>
                      <p className="admin-order-card-info-value">{order.user?.email || '-'}</p>
                      <p className="admin-order-card-info-sub">{order.shippingAddress?.phone || '-'}</p>
                    </div>
                    <div className="admin-order-card-info-col">
                      <p className="admin-order-card-info-label">주문 상품</p>
                      <p className="admin-order-card-info-value">{getItemCount(order)}개 상품</p>
                    </div>
                    <div className="admin-order-card-info-col">
                      <p className="admin-order-card-info-label">배송 주소</p>
                      <p className="admin-order-card-info-value">{formatAddress(order)}</p>
                    </div>
                  </div>

                  <footer className="admin-order-card-footer">
                    {showActions && (
                      <div className="admin-order-card-actions">
                        <label className="admin-order-status-control">
                          <span className="admin-order-status-label">주문 상태</span>
                          <select
                            className="admin-order-status-select"
                            value={normalizeAdminStatus(order.status)}
                            disabled={isUpdating}
                            onChange={(event) => handleStatusChange(order, event.target.value)}
                          >
                            {ADMIN_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        {canCancel && (
                          <button
                            type="button"
                            className="admin-order-card-action"
                            disabled={isUpdating}
                            onClick={() => handleCancelOrder(order)}
                          >
                            주문 취소
                          </button>
                        )}
                      </div>
                    )}

                    {showTracking && (
                      <div className="admin-order-card-tracking">
                        추적번호: {getTrackingNumber(order)}
                      </div>
                    )}
                  </footer>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}

export default AdminOrdersPage
