import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { addCartItem } from '@/api/carts.js'
import { getProduct } from '@/api/products.js'
import HomeFooter from '@/components/home/HomeFooter.jsx'
import HomeNavbar from '@/components/home/HomeNavbar.jsx'
import Toast from '@/components/Toast.jsx'
import { notifyCartUpdated } from '@/hooks/useCartCount.js'
import '@/pages/HomePage.css'
import '@/pages/ProductDetailPage.css'

const SIZES = ['XS', 'S', 'M', 'L', 'XL']
const COLOR_OPTIONS = [
  { id: 'sky', label: 'Sky Blue', value: '#b8d4e8' },
  { id: 'black', label: 'Black', value: '#1a1a1a' },
  { id: 'cream', label: 'Cream', value: '#e8e0d4' },
]
const STOCK_COUNT = 5
const REVIEW_COUNT = 124
const RATING = 4.8
const DISCOUNT_RATE = 26

const TABS = [
  { id: 'description', label: 'Description' },
  { id: 'reviews', label: `Reviews (${REVIEW_COUNT})` },
  { id: 'shipping', label: 'Shipping & Returns' },
]

const DEFAULT_FEATURES = [
  '프리미엄 원단으로 제작된 데일리 필수 아이템',
  '편안한 착용감과 세련된 실루엣',
  '계절감 있는 컬러와 디테일',
  '단독 착용 및 레이어드 모두 가능',
]

function formatPrice(price) {
  return `₩${new Intl.NumberFormat('ko-KR').format(price)}`
}

function getOriginalPrice(salePrice) {
  return Math.round(salePrice / (1 - DISCOUNT_RATE / 100))
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#f5a623" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 20.5 4.5 13a5.5 5.5 0 0 1 8-4.9A5.5 5.5 0 0 1 20.5 13L12 20.5Z" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 7h3l2-3h6l2 3h3v12H4V7Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, setUser } = useOutletContext()
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartToast, setCartToast] = useState(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState('S')
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].id)
  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState('description')

  useEffect(() => {
    let isMounted = true

    setIsLoading(true)
    setError('')

    getProduct(id)
      .then((data) => {
        if (isMounted) {
          setProduct(data)
        }
      })
      .catch((fetchError) => {
        if (isMounted) {
          setError(fetchError.message || '상품을 불러오지 못했습니다.')
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
  }, [id])

  const thumbnails = useMemo(() => {
    if (!product) {
      return []
    }

    return [
      { id: 'main', type: 'image', src: product.image },
      { id: 'placeholder-1', type: 'placeholder' },
      { id: 'placeholder-2', type: 'placeholder' },
      { id: 'placeholder-3', type: 'placeholder' },
      { id: 'placeholder-4', type: 'placeholder' },
    ]
  }, [product])

  const originalPrice = product ? getOriginalPrice(product.price) : 0
  const totalPrice = product ? product.price * quantity : 0

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  const increaseQuantity = () => {
    setQuantity((prev) => Math.min(STOCK_COUNT, prev + 1))
  }

  const handleAddToCart = async () => {
    if (!product) {
      return
    }

    if (!user) {
      navigate('/login', { state: { from: `/product/${id}` } })
      return
    }

    setIsAddingToCart(true)
    setCartToast(null)

    try {
      await addCartItem(product._id, quantity)
      notifyCartUpdated()
      setCartToast({
        type: 'success',
        message: '장바구니에 담았습니다.',
      })
    } catch (addError) {
      setCartToast({
        type: 'error',
        message: addError.message || '장바구니 담기에 실패했습니다.',
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const renderTabContent = () => {
    if (!product) {
      return null
    }

    if (activeTab === 'description') {
      return (
        <div className="product-detail-tab-panel">
          <p className="product-detail-tab-lead">
            {product.description?.trim() || '세련된 실루엣과 편안한 착용감을 갖춘 ATELIER 시그니처 아이템입니다.'}
          </p>
          <h3 className="product-detail-tab-subtitle">Features</h3>
          <ul className="product-detail-feature-list">
            {DEFAULT_FEATURES.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <p className="product-detail-tab-meta">
            카테고리: {product.category} · SKU: {product.sku}
          </p>
        </div>
      )
    }

    if (activeTab === 'reviews') {
      return (
        <div className="product-detail-tab-panel">
          <div className="product-detail-review-summary">
            <StarIcon />
            <strong>{RATING}</strong>
            <span>· {REVIEW_COUNT} reviews</span>
          </div>
          <p className="product-detail-tab-lead">
            고객들이 착용감과 디자인에 대해 높은 만족도를 보이고 있습니다.
          </p>
          <div className="product-detail-review-card">
            <div className="product-detail-review-header">
              <span className="product-detail-review-stars">★★★★★</span>
              <span className="product-detail-review-author">김*연</span>
            </div>
            <p>색감이 사진과 동일하고 핏이 예뻐요. 데일리로 자주 입을 것 같습니다.</p>
          </div>
          <div className="product-detail-review-card">
            <div className="product-detail-review-header">
              <span className="product-detail-review-stars">★★★★☆</span>
              <span className="product-detail-review-author">이*준</span>
            </div>
            <p>원단이 부드럽고 배송도 빨랐어요. 사이즈는 평소대로 주문하면 잘 맞습니다.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="product-detail-tab-panel">
        <h3 className="product-detail-tab-subtitle">Shipping</h3>
        <p className="product-detail-tab-lead">
          50,000원 이상 구매 시 무료배송 · 배송 기간 5–7일 소요
        </p>
        <h3 className="product-detail-tab-subtitle">Returns</h3>
        <p className="product-detail-tab-lead">
          14일 이내 국내 무료반품 · 미착용·택 부착 상태에 한해 가능합니다.
        </p>
      </div>
    )
  }

  return (
    <div className="atelier-home product-detail-page">
      <HomeNavbar user={user} setUser={setUser} />

      <main className="product-detail-main">
        {isLoading && (
          <p className="product-detail-status">상품을 불러오는 중...</p>
        )}

        {!isLoading && error && (
          <div className="product-detail-status product-detail-status--error">
            <p>{error}</p>
            <Link to="/" className="product-detail-back-link">
              홈으로 돌아가기
            </Link>
          </div>
        )}

        {!isLoading && !error && product && (
          <div className="product-detail-container">
            <section className="product-detail-top">
              <div className="product-detail-gallery">
                <div className="product-detail-main-image">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-detail-image"
                  />
                </div>

                <div className="product-detail-thumbs">
                  {thumbnails.map((thumb, index) => (
                    <button
                      key={thumb.id}
                      type="button"
                      className={`product-detail-thumb${activeImage === index ? ' product-detail-thumb--active' : ''}`}
                      onClick={() => setActiveImage(index)}
                      aria-label={thumb.type === 'image' ? '메인 이미지' : `이미지 ${index + 1}`}
                    >
                      {thumb.type === 'image' ? (
                        <img src={thumb.src} alt="" />
                      ) : (
                        <span className="product-detail-thumb-placeholder">
                          <CameraIcon />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="product-detail-purchase">
                <h1 className="product-detail-name">{product.name}</h1>

                <div className="product-detail-rating">
                  <StarIcon />
                  <span>{RATING}</span>
                  <span className="product-detail-rating-count">({REVIEW_COUNT} reviews)</span>
                </div>

                <div className="product-detail-pricing">
                  <span className="product-detail-price-current">{formatPrice(product.price)}</span>
                  <span className="product-detail-price-original">{formatPrice(originalPrice)}</span>
                  <span className="product-detail-price-discount">{DISCOUNT_RATE}% OFF</span>
                </div>

                <div className="product-detail-option">
                  <p className="product-detail-option-label">Size</p>
                  <div className="product-detail-size-list">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`product-detail-size-btn${selectedSize === size ? ' product-detail-size-btn--active' : ''}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="product-detail-option">
                  <p className="product-detail-option-label">Color:</p>
                  <div className="product-detail-color-list">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        className={`product-detail-color-btn${selectedColor === color.id ? ' product-detail-color-btn--active' : ''}`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setSelectedColor(color.id)}
                        aria-label={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="product-detail-option">
                  <p className="product-detail-option-label">Quantity</p>
                  <div className="product-detail-quantity-row">
                    <div className="product-detail-quantity">
                      <button
                        type="button"
                        className="product-detail-quantity-btn"
                        onClick={decreaseQuantity}
                        aria-label="수량 줄이기"
                      >
                        −
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={quantity}
                        className="product-detail-quantity-input"
                        aria-label="수량"
                      />
                      <button
                        type="button"
                        className="product-detail-quantity-btn"
                        onClick={increaseQuantity}
                        aria-label="수량 늘리기"
                        disabled={quantity >= STOCK_COUNT}
                      >
                        +
                      </button>
                    </div>
                    <span className="product-detail-stock">Only {STOCK_COUNT} left in stock</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="product-detail-cart-btn"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  <BagIcon />
                  {isAddingToCart ? 'ADDING...' : `ADD TO BAG - ${formatPrice(totalPrice)}`}
                </button>

                <button type="button" className="product-detail-wishlist-btn">
                  <HeartIcon />
                  ADD TO WISHLIST
                </button>

                <div className="product-detail-trust">
                  <div className="product-detail-trust-item">
                    <span className="product-detail-trust-icon" aria-hidden="true">📦</span>
                    <div>
                      <p className="product-detail-trust-title">Free Shipping</p>
                      <p className="product-detail-trust-desc">On orders over ₩50,000</p>
                    </div>
                  </div>
                  <div className="product-detail-trust-item">
                    <span className="product-detail-trust-icon" aria-hidden="true">↩</span>
                    <div>
                      <p className="product-detail-trust-title">Easy Returns</p>
                      <p className="product-detail-trust-desc">14-day return policy</p>
                    </div>
                  </div>
                  <div className="product-detail-trust-item">
                    <span className="product-detail-trust-icon" aria-hidden="true">🔒</span>
                    <div>
                      <p className="product-detail-trust-title">Secure Payment</p>
                      <p className="product-detail-trust-desc">SSL encrypted</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="product-detail-tabs">
              <div className="product-detail-tab-list" role="tablist">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`product-detail-tab${activeTab === tab.id ? ' product-detail-tab--active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="product-detail-tab-content" role="tabpanel">
                {renderTabContent()}
              </div>
            </section>
          </div>
        )}
      </main>

      <HomeFooter />

      {cartToast && (
        <Toast
          message={cartToast.message}
          type={cartToast.type}
          action={cartToast.type === 'success' ? { to: '/cart', label: '장바구니 보기' } : undefined}
          onClose={() => setCartToast(null)}
        />
      )}
    </div>
  )
}

export default ProductDetailPage
