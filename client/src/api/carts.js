import { apiClient } from '@/api/client.js'

/**
 * 장바구니 조회 API
 * GET /api/carts
 */
export async function getCart() {
  return apiClient.get('/carts')
}

/**
 * 장바구니 상품 추가 API
 * POST /api/carts/items
 */
export async function addCartItem(productId, quantity = 1) {
  return apiClient.post('/carts/items', { productId, quantity })
}

/**
 * 장바구니 상품 수량 변경 API
 * PUT /api/carts/items/:itemId
 */
export async function updateCartItem(itemId, quantity) {
  return apiClient.put(`/carts/items/${itemId}`, { quantity })
}

/**
 * 장바구니 상품 삭제 API
 * DELETE /api/carts/items/:itemId
 */
export async function removeCartItem(itemId) {
  return apiClient.delete(`/carts/items/${itemId}`)
}

/**
 * 장바구니 비우기 API
 * DELETE /api/carts
 */
export async function clearCart() {
  return apiClient.delete('/carts')
}
