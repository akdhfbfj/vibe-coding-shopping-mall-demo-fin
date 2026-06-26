import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { clearCart, getCart, removeCartItem, updateCartItem } from '@/api/carts.js'
import HomeFooter from '@/components/home/HomeFooter.jsx'
import HomeNavbar from '@/components/home/HomeNavbar.jsx'
import { notifyCartUpdated } from '@/hooks/useCartCount.js'
import '@/pages/HomePage.css'
import '@/pages/CartPage.css'

function formatPrice(price) {
  return `₩${new Intl.NumberFormat('ko-KR').format(price)}`
}

function CartPage() {
  const { user, setUser } = useOutletContext()
  const [cart, setCart] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(user))
  const [error, setError] = useState('')
  const [updatingItemId, setUpdatingItemId] = useState(null)

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

  const totalPrice = useMemo(() => {
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

  const handleQuantityChange = async (itemId, nextQuantity) => {
    if (nextQuantity < 1) {
      return
    }

    setUpdatingItemId(itemId)

    try {
      const updatedCart = await updateCartItem(itemId, nextQuantity)
      setCart(updatedCart)
      notifyCartUpdated()
    } catch (updateError) {
      setError(updateError.message || '수량 변경에 실패했습니다.')
    } finally {
      setUpdatingItemId(null)
    }
  }

  const handleRemoveItem = async (itemId) => {
    setUpdatingItemId(itemId)

    try {
      const updatedCart = await removeCartItem(itemId)
      setCart(updatedCart)
      notifyCartUpdated()
    } catch (removeError) {
      setError(removeError.message || '상품 삭제에 실패했습니다.')
    } finally {
      setUpdatingItemId(null)
    }
  }

  const handleClearCart = async () => {
    try {
      const updatedCart = await clearCart()
      setCart(updatedCart)
      notifyCartUpdated()
    } catch (clearError) {
      setError(clearError.message || '장바구니 비우기에 실패했습니다.')
    }
  }

  return (
    <div className="atelier-home cart-page">
      <HomeNavbar user={user} setUser={setUser} />

      <section className="cart-page-content atelier-container">
        <h1 className="cart-page-title atelier-label">Shopping Bag</h1>

        {!user && (
          <div className="cart-page-empty">
            <p>장바구니를 확인하려면 로그인이 필요합니다.</p>
            <Link to="/login" className="cart-page-link atelier-fade-hover">
              Login
            </Link>
          </div>
        )}

        {user && isLoading && <p className="cart-page-status">장바구니를 불러오는 중...</p>}

        {user && !isLoading && error && (
          <p className="cart-page-status cart-page-status--error">{error}</p>
        )}

        {user && !isLoading && !error && cart?.items?.length === 0 && (
          <div className="cart-page-empty">
            <p>장바구니가 비어 있습니다.</p>
            <Link to="/" className="cart-page-link atelier-fade-hover">
              쇼핑 계속하기
            </Link>
          </div>
        )}

        {user && !isLoading && !error && cart?.items?.length > 0 && (
          <>
            <ul className="cart-page-list">
              {cart.items.map((item) => {
                const product = item.product

                return (
                  <li key={item._id} className="cart-page-item">
                    <Link to={`/product/${product?._id}`} className="cart-page-item-image-wrap">
                      {product?.image ? (
                        <img src={product.image} alt={product.name} className="cart-page-item-image" />
                      ) : (
                        <div className="cart-page-item-image cart-page-item-image--placeholder" />
                      )}
                    </Link>

                    <div className="cart-page-item-info">
                      <Link to={`/product/${product?._id}`} className="cart-page-item-name">
                        {product?.name || '상품 정보 없음'}
                      </Link>
                      <p className="cart-page-item-price">
                        {product?.price != null ? formatPrice(product.price) : '-'}
                      </p>

                      <div className="cart-page-item-actions">
                        <div className="cart-page-quantity">
                          <button
                            type="button"
                            className="cart-page-quantity-btn"
                            disabled={updatingItemId === item._id || item.quantity <= 1}
                            onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            className="cart-page-quantity-btn"
                            disabled={updatingItemId === item._id}
                            onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-page-remove-btn atelier-fade-hover"
                          disabled={updatingItemId === item._id}
                          onClick={() => handleRemoveItem(item._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <p className="cart-page-item-total">
                      {product?.price != null ? formatPrice(product.price * item.quantity) : '-'}
                    </p>
                  </li>
                )
              })}
            </ul>

            <div className="cart-page-summary">
              <div className="cart-page-summary-row">
                <span>Total</span>
                <strong>{formatPrice(totalPrice)}</strong>
              </div>
              <Link to="/checkout" className="cart-page-checkout-btn atelier-fade-hover">
                결제하기
              </Link>
              <button type="button" className="cart-page-clear-btn atelier-fade-hover" onClick={handleClearCart}>
                Clear Bag
              </button>
            </div>
          </>
        )}
      </section>

      <HomeFooter />
    </div>
  )
}

export default CartPage
