import { useEffect, useState } from 'react'
import { Link, Navigate, useOutletContext } from 'react-router-dom'
import { getDashboardStats } from '@/api/admin.js'
import { isAdminUser } from '@/utils/userRole.js'
import '@/pages/admin/AdminPage.css'

function formatPrice(price) {
  return `₩${new Intl.NumberFormat('ko-KR').format(price)}`
}

function formatCount(value) {
  return new Intl.NumberFormat('ko-KR').format(value)
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 2h2l2.4 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 6H6" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M12 22V12" />
      <path d="m3.5 7.5 8.5-4.5 8.5 4.5" />
      <path d="M3.5 7.5V16.5l8.5 4.5 8.5-4.5V7.5" />
      <path d="M12 3v9" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 16V9M12 16V5M17 16v-4" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

const MANAGEMENT_CARDS = [
  {
    title: '상품 관리',
    description: '상품 등록, 수정, 삭제 및 재고 관리',
    to: '/admin/products',
    iconClass: 'admin-mgmt-icon--product',
    Icon: PackageIcon,
  },
  {
    title: '주문 관리',
    description: '주문 조회, 상태 변경 및 배송 관리',
    to: '/admin/orders',
    iconClass: 'admin-mgmt-icon--order',
    Icon: CartIcon,
  },
]

function buildStats(stats) {
  if (!stats) {
    return []
  }

  return [
    {
      label: '총 주문',
      value: formatCount(stats.totalOrders),
      trend: stats.trends.orders,
      iconClass: 'admin-stat-icon--blue',
      Icon: CartIcon,
    },
    {
      label: '총 상품',
      value: formatCount(stats.totalProducts),
      trend: stats.trends.products,
      iconClass: 'admin-stat-icon--green',
      Icon: PackageIcon,
    },
    {
      label: '총 고객',
      value: formatCount(stats.totalCustomers),
      trend: stats.trends.customers,
      iconClass: 'admin-stat-icon--purple',
      Icon: UsersIcon,
    },
    {
      label: '총 매출',
      value: formatPrice(stats.totalRevenue),
      trend: stats.trends.revenue,
      iconClass: 'admin-stat-icon--orange',
      Icon: TrendIcon,
    },
  ]
}

const STAT_LABELS = ['총 주문', '총 상품', '총 고객', '총 매출']

const STAT_ICONS = [
  { iconClass: 'admin-stat-icon--blue', Icon: CartIcon },
  { iconClass: 'admin-stat-icon--green', Icon: PackageIcon },
  { iconClass: 'admin-stat-icon--purple', Icon: UsersIcon },
  { iconClass: 'admin-stat-icon--orange', Icon: TrendIcon },
]

function AdminPage() {
  const { user } = useOutletContext()
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || !isAdminUser(user)) {
      return
    }

    let isMounted = true

    const loadDashboard = async () => {
      setIsLoading(true)
      setError('')

      try {
        const data = await getDashboardStats()

        if (isMounted) {
          setDashboard(data)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || '대시보드 정보를 불러오지 못했습니다.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [user])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />
  }

  const stats = buildStats(dashboard?.stats)
  const recentOrders = dashboard?.recentOrders ?? []

  return (
    <div className="admin-page">
      <header className="admin-nav">
        <div className="admin-nav-inner">
          <div className="admin-brand">
            <Link to="/admin" className="admin-logo">ATELIER</Link>
            <span className="admin-badge">ADMIN</span>
          </div>
          <Link to="/" className="admin-back-btn">쇼핑몰로 돌아가기</Link>
        </div>
      </header>

      <main className="admin-main">
        <header className="admin-header">
          <h1 className="admin-title">관리자 대시보드</h1>
          <p className="admin-subtitle">ATELIER 쇼핑몰 관리 시스템에 오신 것을 환영합니다.</p>
        </header>

        {error && <p className="admin-error">{error}</p>}

        <section className="admin-stats" aria-label="요약 통계">
          {isLoading
            ? STAT_LABELS.map((label, index) => {
                const { iconClass, Icon } = STAT_ICONS[index]

                return (
                  <article key={label} className="admin-stat-card">
                    <div>
                      <p className="admin-stat-label">{label}</p>
                      <p className="admin-stat-value">-</p>
                      <p className="admin-stat-trend">불러오는 중...</p>
                    </div>
                    <div className={`admin-stat-icon ${iconClass}`}>
                      <Icon />
                    </div>
                  </article>
                )
              })
            : stats.map(({ label, value, trend, iconClass, Icon }) => (
                <article key={label} className="admin-stat-card">
                  <div>
                    <p className="admin-stat-label">{label}</p>
                    <p className="admin-stat-value">{value}</p>
                    <p className="admin-stat-trend">{trend}</p>
                  </div>
                  <div className={`admin-stat-icon ${iconClass}`}>
                    <Icon />
                  </div>
                </article>
              ))}
        </section>

        <div className="admin-grid">
          <section className="admin-panel">
            <h2 className="admin-panel-title">빠른 작업</h2>
            <div className="admin-actions">
              <Link to="/admin/products/register" className="admin-action-btn admin-action-btn--primary">
                <span className="admin-action-icon"><PlusIcon /></span>
                새 상품 등록
              </Link>
              <Link to="/admin/orders" className="admin-action-btn">
                <span className="admin-action-icon"><EyeIcon /></span>
                주문 관리
              </Link>
              <button type="button" className="admin-action-btn">
                <span className="admin-action-icon"><ChartIcon /></span>
                매출 분석
              </button>
              <button type="button" className="admin-action-btn">
                <span className="admin-action-icon"><UserIcon /></span>
                고객 관리
              </button>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">최근 주문</h2>
              <Link to="/admin/orders" className="admin-view-all">전체보기</Link>
            </div>
            {isLoading ? (
              <p className="admin-empty">최근 주문을 불러오는 중...</p>
            ) : recentOrders.length === 0 ? (
              <p className="admin-empty">최근 주문이 없습니다.</p>
            ) : (
              <ul className="admin-orders">
                {recentOrders.map((order) => (
                  <li key={order.id} className="admin-order-item">
                    <div>
                      <p className="admin-order-id">{order.id}</p>
                      <p className="admin-order-meta">{order.customer} · {order.date}</p>
                    </div>
                    <div className="admin-order-right">
                      <span className={`admin-status admin-status--${order.statusClass}`}>
                        {order.statusLabel}
                      </span>
                      <p className="admin-order-amount">{formatPrice(order.amount)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="admin-mgmt-cards" aria-label="관리 메뉴">
          {MANAGEMENT_CARDS.map(({ title, description, to, iconClass, Icon }) => {
            const content = (
              <>
                <div className={`admin-mgmt-icon ${iconClass}`}>
                  <Icon />
                </div>
                <h3 className="admin-mgmt-title">{title}</h3>
                <p className="admin-mgmt-desc">{description}</p>
              </>
            )

            if (to) {
              return (
                <Link key={title} to={to} className="admin-mgmt-card">
                  {content}
                </Link>
              )
            }

            return (
              <button key={title} type="button" className="admin-mgmt-card">
                {content}
              </button>
            )
          })}
        </section>
      </main>
    </div>
  )
}

export default AdminPage
