import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getCart } from '@/api/carts.js'

export function getCartItemCount(cart) {
  if (!cart?.items?.length) {
    return 0
  }

  return cart.items.reduce((sum, item) => sum + item.quantity, 0)
}

export function notifyCartUpdated() {
  window.dispatchEvent(new Event('cart-updated'))
}

export function useCartCount(user) {
  const location = useLocation()
  const [cartCount, setCartCount] = useState(0)

  const fetchCartCount = useCallback(async () => {
    if (!user) {
      setCartCount(0)
      return
    }

    try {
      const cart = await getCart()
      setCartCount(getCartItemCount(cart))
    } catch {
      setCartCount(0)
    }
  }, [user])

  useEffect(() => {
    fetchCartCount()
  }, [fetchCartCount, location.pathname])

  useEffect(() => {
    window.addEventListener('cart-updated', fetchCartCount)
    return () => window.removeEventListener('cart-updated', fetchCartCount)
  }, [fetchCartCount])

  return cartCount
}
