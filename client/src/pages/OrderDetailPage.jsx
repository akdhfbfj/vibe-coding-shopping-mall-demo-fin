import { useEffect, useState } from 'react'
import { Link, Navigate, useOutletContext, useParams } from 'react-router-dom'
import { getOrderById } from '@/api/orders.js'
import HomeFooter from '@/components/home/HomeFooter.jsx'
import HomeNavbar from '@/components/home/HomeNavbar.jsx'
import '@/pages/HomePage.css'
import '@/pages/OrderListPage.css'

function formatPrice(price) {
  return `₩${new Intl.NumberFormat('ko-KR').format(price)}`
}

function formatOrderDate(dateValue) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateValue))
}

const STATUS_LABELS = {
  pending: '주문 확인',
  paid: '주문 확인',
  processing: '상품 준비중',
  shipment_started: '배송 시작',
  shipping: '배송 중',
  delivered: '배송 완료',
  completed: '배송 완료',
  cancelled: '주문 취소',
}

function OrderDetailPage() {
  const { user, setUser } = useOutletContext()
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(user))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !id) {
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError('')

    getOrderById(id)
      .then((data) => {
        if (isMounted) {
          setOrder(data)
        }
      })
      .catch((fetchError) => {
        if (isMounted) {
          setError(fetchError.message || '주문 정보를 불러오지 못했습니다.')
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
  }, [user, id])

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `/orders/${id}` }} />
  }

  return (
    <div className="atelier-home order-list-page">
      <HomeNavbar user={user} setUser={setUser} />

      <section className="order-list-content atelier-container">
        <Link to="/orders" className="order-detail-back">← 주문 내역으로</Link>
        <h1 className="order-list-heading">주문 상세</h1>

        {isLoading && <p className="order-list-status">주문 정보를 불러오는 중...</p>}
        {!isLoading && error && <p className="order-list-status order-list-status--error">{error}</p>}

        {!isLoading && order && (
          <article className="order-card order-detail-card">
            <header className="order-card-header">
              <div className="order-card-header-left">
                <div>
                  <p className="order-card-id">주문 #{order.orderNumber}</p>
                  <p className="order-card-date">주문일: {formatOrderDate(order.createdAt)}</p>
                </div>
              </div>
              <div className="order-card-header-right">
                <span className="order-card-badge order-card-badge--processing">
                  {STATUS_LABELS[order.status] || order.status}
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
                    <p className="order-card-item-meta">수량: {item.quantity}</p>
                  </div>
                  <p className="order-card-item-price">{formatPrice(item.lineTotal)}</p>
                </li>
              ))}
            </ul>

            <div className="order-detail-info">
              <h2 className="order-detail-section-title">배송 정보</h2>
              <p>{order.shippingAddress.recipientName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>
                [{order.shippingAddress.postalCode}] {order.shippingAddress.address}
              </p>
              {order.shippingAddress.deliveryMemo && (
                <p>배송 메모: {order.shippingAddress.deliveryMemo}</p>
              )}
            </div>

            <div className="order-detail-info">
              <h2 className="order-detail-section-title">결제 정보</h2>
              <p>상품 금액: {formatPrice(order.subtotal)}</p>
              <p>배송비: {order.shippingFee === 0 ? '무료' : formatPrice(order.shippingFee)}</p>
              <p>총 결제 금액: {formatPrice(order.totalAmount)}</p>
            </div>
          </article>
        )}
      </section>

      <HomeFooter />
    </div>
  )
}

export default OrderDetailPage
