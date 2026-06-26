import { useEffect, useState } from 'react'
import { Link, useLocation, useOutletContext } from 'react-router-dom'
import HomeFooter from '@/components/home/HomeFooter.jsx'
import HomeNavbar from '@/components/home/HomeNavbar.jsx'
import { getAllProducts } from '@/api/products.js'
import '@/pages/HomePage.css'

function formatPrice(price) {
  return `₩${new Intl.NumberFormat('ko-KR').format(price)}`
}

function HomePage() {
  const location = useLocation()
  const signupSuccess = location.state?.signupSuccess
  const loginSuccess = location.state?.loginSuccess
  const { user, setUser } = useOutletContext()
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState('')

  useEffect(() => {
    let isMounted = true

    getAllProducts()
      .then((data) => {
        if (isMounted) {
          setProducts(data)
          setProductsError('')
        }
      })
      .catch((error) => {
        if (isMounted) {
          setProductsError(error.message || '상품을 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProducts(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="atelier-home">
      <HomeNavbar user={user} setUser={setUser} />

      {signupSuccess && (
        <p className="atelier-banner">회원가입이 완료되었습니다. 환영합니다!</p>
      )}

      {loginSuccess && (
        <p className="atelier-banner">로그인에 성공했습니다. 쇼핑을 시작해보세요!</p>
      )}

      <section className="atelier-hero">
        <div className="atelier-hero-overlay">
          <p className="atelier-hero-sub atelier-label">Autumn / Winter 2025</p>
          <h1 className="atelier-hero-title">THE NEW COLLECTION</h1>
          <div className="atelier-hero-buttons">
            <a href="#" className="atelier-btn atelier-fade-hover">Shop Women</a>
            <a href="#" className="atelier-btn atelier-fade-hover">Shop Men</a>
          </div>
        </div>
      </section>

      <section className="atelier-split">
        <div className="atelier-split-item atelier-split-item--women">
          <a href="#" className="atelier-btn atelier-fade-hover">Women</a>
        </div>
        <div className="atelier-split-item atelier-split-item--men">
          <a href="#" className="atelier-btn atelier-fade-hover">Men</a>
        </div>
      </section>

      <section className="atelier-new-in">
        <h2 className="atelier-section-title atelier-label">New In</h2>

        {isLoadingProducts && (
          <p className="atelier-products-status">상품을 불러오는 중...</p>
        )}

        {!isLoadingProducts && productsError && (
          <p className="atelier-products-status atelier-products-status--error">{productsError}</p>
        )}

        {!isLoadingProducts && !productsError && products.length === 0 && (
          <p className="atelier-products-status">등록된 상품이 없습니다.</p>
        )}

        {!isLoadingProducts && !productsError && products.length > 0 && (
          <div className="atelier-product-grid">
            {products.map((product) => (
              <Link key={product._id} to={`/product/${product._id}`} className="atelier-product-card">
                <div
                  className="atelier-product-image"
                  style={{ backgroundImage: `url(${product.image})` }}
                />
                <p className="atelier-product-name">{product.name}</p>
                <p className="atelier-product-price">{formatPrice(product.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="atelier-editorial">
        <div className="atelier-editorial-content">
          <h2 className="atelier-editorial-title">
            CONSIDERED ESSENTIALS FOR THE MODERN WARDROBE
          </h2>
          <a href="#" className="atelier-editorial-link atelier-fade-hover atelier-label">
            Discover More
          </a>
        </div>
      </section>

      <section className="atelier-newsletter">
        <h2 className="atelier-newsletter-title">Be The First To Know</h2>
        <p className="atelier-newsletter-desc">
          새로운 컬렉션, 독점 오퍼, 스타일링 팁을 가장 먼저 받아보세요.
        </p>
        <form className="atelier-newsletter-form" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            className="atelier-newsletter-input"
            placeholder="Email address"
            aria-label="이메일 주소"
          />
          <button type="submit" className="atelier-newsletter-submit atelier-fade-hover atelier-label">
            Join
          </button>
        </form>
      </section>

      <HomeFooter />
    </div>
  )
}

export default HomePage
