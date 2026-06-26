import { Link } from 'react-router-dom'
import '@/pages/admin/AdminProductsPage.css'

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
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

function AdminProductsLayout({ activeTab, children }) {
  return (
    <div className="admin-products-page">
      <header className="admin-products-topbar">
        <div className="admin-products-topbar-inner">
          <div className="admin-products-title-group">
            <Link to="/admin" className="admin-products-back" aria-label="관리자 대시보드로 돌아가기">
              <BackIcon />
            </Link>
            <h1 className="admin-products-heading">상품 관리</h1>
          </div>
          <Link to="/admin/products/register" className="admin-products-new-btn">
            <PlusIcon />
            새 상품 등록
          </Link>
        </div>
      </header>

      <nav className="admin-products-tabs" aria-label="상품 관리 탭">
        <Link
          to="/admin/products"
          className={`admin-products-tab${activeTab === 'list' ? ' admin-products-tab--active' : ''}`}
        >
          상품 목록
        </Link>
        <Link
          to="/admin/products/register"
          className={`admin-products-tab${activeTab === 'register' ? ' admin-products-tab--active' : ''}`}
        >
          상품 등록
        </Link>
      </nav>

      <main className="admin-products-main">{children}</main>
    </div>
  )
}

export default AdminProductsLayout
