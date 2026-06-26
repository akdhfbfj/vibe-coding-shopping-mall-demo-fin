import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useOutletContext } from 'react-router-dom'
import { getCart } from '@/api/carts.js'
import { createOrder } from '@/api/orders.js'
import HomeFooter from '@/components/home/HomeFooter.jsx'
import HomeNavbar from '@/components/home/HomeNavbar.jsx'
import { notifyCartUpdated } from '@/hooks/useCartCount.js'
import { buildPortOnePaymentRequest, requestPortOnePayment } from '@/utils/portOne.js'
import '@/pages/HomePage.css'
import '@/pages/CheckoutPage.css'

const FREE_SHIPPING_THRESHOLD = 50000
const DEFAULT_SHIPPING_FEE = 3000
const CHECKOUT_PENDING_KEY = 'checkout_pending'

const PAYMENT_OPTIONS = [
  { value: 'card', label: '신용카드' },
  { value: 'bank_transfer', label: '계좌이체' },
]

function formatPrice(price) {
  return `₩${new Intl.NumberFormat('ko-KR').format(price)}`
}

function formatOrderDate(dateValue) {
  const date = new Date(dateValue)

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function getEstimatedDeliveryRange(dateValue) {
  const start = new Date(dateValue)
  const end = new Date(dateValue)
  start.setDate(start.getDate() + 5)
  end.setDate(end.getDate() + 7)

  const formatter = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `${formatter.format(start)} - ${formatter.format(end)}`
}

function formatAddress(shippingAddress) {
  if (!shippingAddress) {
    return ''
  }

  const lines = [
    shippingAddress.recipientName,
    shippingAddress.phone,
    `[${shippingAddress.postalCode}] ${shippingAddress.address}`,
  ]

  if (shippingAddress.addressDetail) {
    lines.push(shippingAddress.addressDetail)
  }

  if (shippingAddress.deliveryMemo) {
    lines.push(`배송 메모: ${shippingAddress.deliveryMemo}`)
  }

  return lines.filter(Boolean)
}

function getOrderName(cart) {
  const firstItemName = cart?.items?.[0]?.product?.name

  if (!firstItemName) {
    return 'ATELIER 주문'
  }

  if (cart.items.length === 1) {
    return firstItemName
  }

  return `${firstItemName} 외 ${cart.items.length - 1}건`
}

function getPayMethod(paymentMethod) {
  return paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'card'
}

/** KG이니시스 oid(paymentId) 최대 40자 */
function createPaymentId() {
  return `order_${Date.now()}`
}

function saveCheckoutPending(data) {
  sessionStorage.setItem(CHECKOUT_PENDING_KEY, JSON.stringify(data))
}

function loadCheckoutPending() {
  const raw = sessionStorage.getItem(CHECKOUT_PENDING_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearCheckoutPending() {
  sessionStorage.removeItem(CHECKOUT_PENDING_KEY)
}

async function completeOrderFromPayment(pending, transactionId) {
  return createOrder({
    shippingAddress: pending.shippingAddress,
    paymentMethod: pending.paymentMethod,
    transactionId,
  })
}

function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function SuccessCheckIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function FailureIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

const NEXT_STEPS = [
  {
    step: 1,
    tone: 'green',
    title: '주문 확인 이메일',
    description: '주문 세부 정보가 포함된 확인 이메일을 받으실 수 있습니다.',
  },
  {
    step: 2,
    tone: 'blue',
    title: '주문 처리',
    description: '1-2 영업일 내에 주문을 처리하고 포장합니다.',
  },
  {
    step: 3,
    tone: 'purple',
    title: '배송 시작',
    description: '배송이 시작되면 추적 번호를 이메일로 보내드립니다.',
  },
]

function OrderSuccessView({ order }) {
  const addressLines = formatAddress(order.shippingAddress)

  return (
    <div className="checkout-result">
      <div className="checkout-result-hero">
        <div className="checkout-result-icon checkout-result-icon--success">
          <SuccessCheckIcon />
        </div>
        <h1 className="checkout-result-title">주문이 성공적으로 완료되었습니다!</h1>
        <p className="checkout-result-desc">
          주문해 주셔서 감사합니다.
          <br />
          주문 확인 이메일을 곧 받으실 수 있습니다.
        </p>
      </div>

      <section className="checkout-result-card">
        <h2 className="checkout-result-card-title">📋 주문 정보</h2>

        <div className="checkout-result-meta">
          <div>
            <p className="checkout-result-label">주문 번호</p>
            <p className="checkout-result-value">{order.orderNumber}</p>
          </div>
          <div>
            <p className="checkout-result-label">주문 날짜</p>
            <p className="checkout-result-value">{formatOrderDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="checkout-result-items">
          <p className="checkout-result-label">주문 상품</p>
          <ul className="checkout-result-item-list">
            {order.items.map((item) => (
              <li key={item._id} className="checkout-result-item">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="checkout-result-item-image" />
                ) : (
                  <div className="checkout-result-item-image checkout-result-item-image--placeholder" />
                )}
                <div className="checkout-result-item-info">
                  <p className="checkout-result-item-name">{item.name}</p>
                  <p className="checkout-result-item-qty">수량: {item.quantity}</p>
                </div>
                <p className="checkout-result-item-price">{formatPrice(item.lineTotal)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="checkout-result-total">
          <span>총 결제 금액</span>
          <strong>{formatPrice(order.totalAmount)}</strong>
        </div>
      </section>

      <section className="checkout-result-card">
        <h2 className="checkout-result-card-title">📦 배송 정보</h2>

        <div className="checkout-result-delivery">
          <CalendarIcon />
          <div>
            <p className="checkout-result-delivery-label">예상 배송일</p>
            <p className="checkout-result-delivery-value">
              {getEstimatedDeliveryRange(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="checkout-result-address">
          <p className="checkout-result-label">배송 주소</p>
          {addressLines.map((line) => (
            <p key={line} className="checkout-result-address-line">{line}</p>
          ))}
        </div>
      </section>

      <section className="checkout-result-card">
        <h2 className="checkout-result-card-title">📋 다음 단계</h2>
        <ol className="checkout-result-steps">
          {NEXT_STEPS.map(({ step, tone, title, description }) => (
            <li key={step} className="checkout-result-step">
              <span className={`checkout-result-step-num checkout-result-step-num--${tone}`}>
                {step}
              </span>
              <div>
                <p className="checkout-result-step-title">{title}</p>
                <p className="checkout-result-step-desc">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="checkout-result-actions">
        <Link to="/orders" className="checkout-result-btn checkout-result-btn--primary">
          주문 목록보기
        </Link>
        <Link to="/" className="checkout-result-btn checkout-result-btn--secondary">
          쇼핑 계속하기
        </Link>
      </div>
    </div>
  )
}

function OrderFailureView({ message, onRetry }) {
  return (
    <div className="checkout-result">
      <div className="checkout-result-hero">
        <div className="checkout-result-icon checkout-result-icon--failure">
          <FailureIcon />
        </div>
        <h1 className="checkout-result-title">주문에 실패하였습니다</h1>
        <p className="checkout-result-desc checkout-result-desc--failure">
          {message || '결제 또는 주문 처리 중 문제가 발생했습니다. 다시 시도해주세요.'}
        </p>
      </div>

      <section className="checkout-result-card checkout-result-card--failure">
        <h2 className="checkout-result-card-title">무엇을 할 수 있나요?</h2>
        <ol className="checkout-result-steps">
          <li className="checkout-result-step">
            <span className="checkout-result-step-num checkout-result-step-num--red">1</span>
            <div>
              <p className="checkout-result-step-title">결제 정보 확인</p>
              <p className="checkout-result-step-desc">
                카드 한도, 계좌 잔액, 결제 수단 정보가 올바른지 확인해주세요.
              </p>
            </div>
          </li>
          <li className="checkout-result-step">
            <span className="checkout-result-step-num checkout-result-step-num--red">2</span>
            <div>
              <p className="checkout-result-step-title">다시 주문하기</p>
              <p className="checkout-result-step-desc">
                아래 버튼을 눌러 결제를 다시 시도할 수 있습니다.
              </p>
            </div>
          </li>
          <li className="checkout-result-step">
            <span className="checkout-result-step-num checkout-result-step-num--red">3</span>
            <div>
              <p className="checkout-result-step-title">문의하기</p>
              <p className="checkout-result-step-desc">
                문제가 계속되면 고객센터로 문의해주세요.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <div className="checkout-result-actions">
        <button type="button" className="checkout-result-btn checkout-result-btn--primary" onClick={onRetry}>
          다시 시도하기
        </button>
        <Link to="/cart" className="checkout-result-btn checkout-result-btn--secondary">
          장바구니로 돌아가기
        </Link>
      </div>
    </div>
  )
}

function CheckoutPage() {
  const { user, setUser } = useOutletContext()
  const [cart, setCart] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(user))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [completedOrder, setCompletedOrder] = useState(null)
  const [orderFailure, setOrderFailure] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [form, setForm] = useState({
    recipientName: '',
    phone: '',
    address: '',
    postalCode: '',
    deliveryMemo: '',
  })

  useEffect(() => {
    if (!user) {
      return
    }

    const query = new URLSearchParams(window.location.search)
    const paymentId = query.get('paymentId')
    const errorCode = query.get('code')

    if (!paymentId && !errorCode) {
      return
    }

    let isMounted = true

    const handlePaymentReturn = async () => {
      const errorMessage = query.get('message')

      window.history.replaceState({}, '', '/checkout')

      if (errorCode) {
        if (isMounted) {
          setOrderFailure({
            message: decodeURIComponent(errorMessage || '결제에 실패했습니다.'),
          })
        }
        clearCheckoutPending()
        return
      }

      const pending = loadCheckoutPending()
      if (!pending) {
        if (isMounted) {
          setOrderFailure({
            message: '결제 정보를 찾을 수 없습니다. 다시 시도해주세요.',
          })
        }
        return
      }

      if (isMounted) {
        setIsSubmitting(true)
        setError('')
      }

      try {
        const order = await completeOrderFromPayment(pending, paymentId)
        if (isMounted) {
          setCompletedOrder(order)
          notifyCartUpdated()
        }
        clearCheckoutPending()
      } catch (returnError) {
        if (isMounted) {
          setOrderFailure({
            message: returnError.message || '주문 처리에 실패했습니다.',
          })
        }
      } finally {
        if (isMounted) {
          setIsSubmitting(false)
        }
      }
    }

    handlePaymentReturn()

    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setCart(null)
      setIsLoading(false)
      return
    }

    let isMounted = true
    setIsLoading(true)

    getCart()
      .then((data) => {
        if (isMounted) {
          setCart(data)
          setError('')
        }
      })
      .catch((fetchError) => {
        if (isMounted) {
          setError(fetchError.message || '장바구니를 불러오지 못했습니다.')
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

  useEffect(() => {
    if (!user) {
      return
    }

    setForm((prev) => ({
      ...prev,
      recipientName: user.name?.trim() || '',
      address: user.address || prev.address,
    }))
  }, [user])

  const subtotal = useMemo(() => {
    if (!cart?.items?.length) {
      return 0
    }

    return cart.items.reduce((sum, item) => {
      if (!item.product?.price) {
        return sum
      }

      return sum + item.product.price * item.quantity
    }, 0)
  }, [cart])

  const shippingFee = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FEE
  const totalAmount = subtotal + shippingFee
  const isFreeOrder = totalAmount === 0
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.recipientName.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    if (!form.phone.trim()) {
      setError('연락처를 입력해주세요.')
      return
    }

    if (!form.address.trim()) {
      setError('주소를 입력해주세요.')
      return
    }

    if (!form.postalCode.trim()) {
      setError('우편번호를 입력해주세요.')
      return
    }

    if (totalAmount < 0) {
      setError('결제 금액이 올바르지 않습니다.')
      return
    }

    setIsSubmitting(true)

    const shippingAddress = {
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      postalCode: form.postalCode.trim(),
      address: form.address.trim(),
      deliveryMemo: form.deliveryMemo.trim() || undefined,
    }

    try {
      if (isFreeOrder) {
        const order = await createOrder({
          shippingAddress,
          paymentMethod,
        })

        setCompletedOrder(order)
        notifyCartUpdated()
        return
      }

      const paymentId = createPaymentId()
      const orderName = getOrderName(cart)
      const redirectUrl = `${window.location.origin}/checkout`

      saveCheckoutPending({
        shippingAddress,
        paymentMethod,
        paymentId,
      })

      const paymentRequest = buildPortOnePaymentRequest({
        paymentId,
        orderName,
        amount: totalAmount,
        payMethod: getPayMethod(paymentMethod),
        user,
        shippingAddress,
        redirectUrl,
      })

      const paymentResponse = await requestPortOnePayment(paymentRequest)

      if (!paymentResponse) {
        return
      }

      const order = await completeOrderFromPayment(
        { shippingAddress, paymentMethod },
        paymentResponse.paymentId
      )

      clearCheckoutPending()
      setCompletedOrder(order)
      notifyCartUpdated()
    } catch (submitError) {
      clearCheckoutPending()
      setOrderFailure({
        message: submitError.message || '결제 처리에 실패했습니다.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    setOrderFailure(null)
    setError('')
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/checkout' }} />
  }

  if (!isLoading && !error && cart?.items?.length === 0 && !completedOrder && !orderFailure) {
    return <Navigate to="/cart" replace />
  }

  return (
    <div className="atelier-home checkout-page">
      <HomeNavbar user={user} setUser={setUser} />

      <section className="checkout-page-content atelier-container">
        {isSubmitting && !completedOrder && !orderFailure ? (
          <div className="checkout-result checkout-result--loading">
            <p className="checkout-status">주문을 처리하는 중...</p>
          </div>
        ) : completedOrder ? (
          <OrderSuccessView order={completedOrder} />
        ) : orderFailure ? (
          <OrderFailureView message={orderFailure.message} onRetry={handleRetry} />
        ) : (
          <>
            <h1 className="checkout-page-heading">Checkout</h1>

            <div className="checkout-steps" aria-label="Checkout progress">
              <div className="checkout-step checkout-step--active">
                <span className="checkout-step-num">1</span>
                <span>Shipping</span>
              </div>
              <span className="checkout-step-line" aria-hidden="true" />
              <div className="checkout-step">
                <span className="checkout-step-num">2</span>
                <span>Payment</span>
              </div>
              <span className="checkout-step-line" aria-hidden="true" />
              <div className="checkout-step">
                <span className="checkout-step-num">3</span>
                <span>Review</span>
              </div>
            </div>

            {isLoading && <p className="checkout-status">주문 정보를 불러오는 중...</p>}

            {!isLoading && error && !cart && (
              <p className="checkout-status checkout-status--error">{error}</p>
            )}

            {!isLoading && cart?.items?.length > 0 && (
              <div className="checkout-layout">
                <form className="checkout-panel" onSubmit={handleSubmit} noValidate>
                  <h2 className="checkout-panel-title">
                    <TruckIcon />
                    Shipping Information
                  </h2>

                  <div className="checkout-form-grid">
                    <div className="checkout-field checkout-field--full">
                      <label htmlFor="recipientName">이름</label>
                      <div className="checkout-input-wrap">
                        <input
                          id="recipientName"
                          name="recipientName"
                          value={form.recipientName}
                          onChange={handleChange}
                          placeholder="홍길동"
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div className="checkout-field checkout-field--full">
                      <label htmlFor="phone">연락처</label>
                      <div className="checkout-input-wrap">
                        <PhoneIcon />
                        <input
                          id="phone"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="010-1234-5678"
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    <div className="checkout-field checkout-field--full">
                      <label htmlFor="postalCode">우편번호</label>
                      <div className="checkout-input-wrap checkout-input-wrap--short">
                        <input
                          id="postalCode"
                          name="postalCode"
                          value={form.postalCode}
                          onChange={handleChange}
                          placeholder="06234"
                          autoComplete="postal-code"
                        />
                      </div>
                    </div>

                    <div className="checkout-field checkout-field--full">
                      <label htmlFor="address">주소</label>
                      <div className="checkout-input-wrap">
                        <PinIcon />
                        <input
                          id="address"
                          name="address"
                          value={form.address}
                          onChange={handleChange}
                          placeholder="서울특별시 강남구 테헤란로 123"
                          autoComplete="street-address"
                        />
                      </div>
                    </div>

                    <div className="checkout-field checkout-field--full">
                      <label htmlFor="deliveryMemo">배송 시 요청사항 (선택)</label>
                      <div className="checkout-input-wrap">
                        <input
                          id="deliveryMemo"
                          name="deliveryMemo"
                          value={form.deliveryMemo}
                          onChange={handleChange}
                          placeholder="문 앞에 놔주세요"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="checkout-payment-options" role="radiogroup" aria-label="Payment method">
                    {PAYMENT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`checkout-payment-option${
                          paymentMethod === option.value ? ' checkout-payment-option--active' : ''
                        }`}
                        onClick={() => setPaymentMethod(option.value)}
                        aria-pressed={paymentMethod === option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </form>

                <aside className="checkout-panel checkout-summary">
                  <h2 className="checkout-summary-title">Order Summary</h2>

                  <ul className="checkout-summary-list">
                    {cart.items.map((item) => {
                      const product = item.product

                      return (
                        <li key={item._id} className="checkout-summary-item">
                          <div className="checkout-summary-image-wrap">
                            {product?.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="checkout-summary-image"
                              />
                            ) : (
                              <div className="checkout-summary-image checkout-summary-image--placeholder" />
                            )}
                            <span className="checkout-summary-qty">{item.quantity}</span>
                          </div>

                          <div>
                            <p className="checkout-summary-name">{product?.name || '상품 정보 없음'}</p>
                            {product?.category && (
                              <p className="checkout-summary-meta">{product.category}</p>
                            )}
                          </div>

                          <p className="checkout-summary-price">
                            {product?.price != null
                              ? formatPrice(product.price * item.quantity)
                              : '-'}
                          </p>
                        </li>
                      )
                    })}
                  </ul>

                  <div className="checkout-summary-rows">
                    <div className="checkout-summary-row">
                      <span>Subtotal ({itemCount} items)</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="checkout-summary-row">
                      <span>Shipping</span>
                      <span>{shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}</span>
                    </div>
                    <div className="checkout-summary-row checkout-summary-row--total">
                      <span>Total</span>
                      <span>{formatPrice(totalAmount)}</span>
                    </div>
                  </div>

                  {error && <p className="checkout-status checkout-status--error">{error}</p>}

                  <button
                    type="button"
                    className="checkout-submit-btn"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                  >
                    <LockIcon />
                    {isSubmitting
                      ? (isFreeOrder ? '주문 처리 중...' : '결제 진행 중...')
                      : (isFreeOrder ? '0원 주문하기' : '결제하기')}
                  </button>

                  <p className="checkout-secure-note">
                    <LockIcon />
                    Secure SSL encrypted checkout
                  </p>

                  <div className="checkout-payment-badges" aria-hidden="true">
                    <span className="checkout-payment-badge">VISA</span>
                    <span className="checkout-payment-badge">MC</span>
                    <span className="checkout-payment-badge">AMEX</span>
                    <span className="checkout-payment-badge">PAYPAL</span>
                  </div>

                  <p className="checkout-terms">
                    By placing your order, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </aside>
              </div>
            )}
          </>
        )}
      </section>

      <HomeFooter />
    </div>
  )
}

export default CheckoutPage
