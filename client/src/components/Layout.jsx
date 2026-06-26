import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { getStoredUser } from '@/utils/authStorage.js'
import { useAuthSession } from '@/hooks/useAuthSession.js'

const STANDALONE_PAGES = ['/', '/login', '/cart', '/checkout', '/orders', '/admin']

function isStandalonePath(pathname) {
  return (
    STANDALONE_PAGES.includes(pathname)
    || pathname.startsWith('/admin/')
    || pathname.startsWith('/product/')
    || pathname.startsWith('/orders/')
  )
}

function Layout() {
  const location = useLocation()
  const [user, setUser] = useState(() => getStoredUser())
  const isStandalonePage = isStandalonePath(location.pathname)

  useAuthSession(setUser)

  return (
    <div className="app">
      {!isStandalonePage && (
        <header className="app-header">
          <div className="container app-header-inner">
            <Link to="/" className="logo">
              Shopping Mall
            </Link>
          </div>
        </header>
      )}

      <main className={isStandalonePage ? 'app-main app-main--home' : 'app-main'}>
        {isStandalonePage ? (
          <Outlet context={{ user, setUser }} />
        ) : (
          <div className="container">
            <Outlet context={{ user, setUser }} />
          </div>
        )}
      </main>

      {!isStandalonePage && (
        <footer className="app-footer">
          <div className="container">
            <p>Shopping Mall Client</p>
          </div>
        </footer>
      )}
    </div>
  )
}

export default Layout
