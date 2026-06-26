import { Link, Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { isAdminUser } from '@/utils/userRole.js'
import '@/components/admin/AdminRoute.css'

function AdminRoute() {
  const outletContext = useOutletContext()
  const { user } = outletContext ?? {}
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!isAdminUser(user)) {
    return (
      <div className="admin-access-denied">
        <div className="admin-access-denied-card">
          <p className="admin-access-denied-badge">ADMIN ONLY</p>
          <h1 className="admin-access-denied-title">접근 권한이 없습니다</h1>
          <p className="admin-access-denied-desc">
            관리자가 아닌 사용자는 관리자 페이지에 접근할 수 없습니다.
          </p>
          <Link to="/" className="admin-access-denied-link">
            쇼핑몰로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return <Outlet context={outletContext} />
}

export default AdminRoute
