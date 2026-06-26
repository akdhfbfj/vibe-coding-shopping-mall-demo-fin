import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { NAV_LINKS } from '@/data/homeContent.js'
import { useCartCount } from '@/hooks/useCartCount.js'
import { clearAuth } from '@/utils/authStorage.js'
import { isAdminUser } from '@/utils/userRole.js'

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M6 7h12l-1 14H7L6 7Z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

function HomeNavbar({ user, setUser }) {
  const isAdmin = isAdminUser(user)
  const cartCount = useCartCount(user)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    setIsUserMenuOpen(false)
  }

  return (
    <header className="atelier-nav">
      <div className="atelier-nav-inner">
        <nav className="atelier-nav-links" aria-label="메인 네비게이션">
          {NAV_LINKS.map((label) => (
            <a key={label} href="#" className="atelier-fade-hover atelier-label">
              {label}
            </a>
          ))}
        </nav>

        <Link to="/" className="atelier-logo">ATELIER</Link>

        <div className="atelier-nav-actions">
          <button type="button" className="atelier-icon-btn atelier-fade-hover" aria-label="검색">
            <SearchIcon />
          </button>

          {!user ? (
            <Link to="/login" className="atelier-nav-auth atelier-fade-hover atelier-label">
              Login
            </Link>
          ) : (
            <>
              <div className="atelier-user-menu" ref={userMenuRef}>
                <span className="atelier-nav-greeting">
                  <button
                    type="button"
                    className="atelier-user-menu-trigger"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="menu"
                  >
                    <strong>{user.name}</strong>
                  </button>
                  님 환영합니다
                </span>

                {isUserMenuOpen && (
                  <div className="atelier-user-menu-dropdown" role="menu">
                    <Link
                      to="/orders"
                      className="atelier-user-menu-item"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      내 주문 목록
                    </Link>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="atelier-nav-logout atelier-fade-hover atelier-label"
                onClick={handleLogout}
              >
                Logout
              </button>
              {isAdmin && (
                <Link to="/admin" className="atelier-nav-admin">Admin</Link>
              )}
            </>
          )}

          <Link
            to="/cart"
            className="atelier-icon-btn atelier-cart-btn atelier-fade-hover"
            aria-label={cartCount > 0 ? `장바구니, ${cartCount}개 상품` : '장바구니'}
          >
            <BagIcon />
            {cartCount > 0 && (
              <span className="atelier-cart-badge" aria-hidden="true">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}

export default HomeNavbar
