import { apiClient } from '@/api/client.js'

/**
 * 주문 생성 API
 * POST /api/orders
 */
export async function createOrder(payload) {
  return apiClient.post('/orders', payload)
}

/**
 * 주문 목록 조회 API
 * GET /api/orders
 */
export async function getOrders(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.status) {
    searchParams.set('status', params.status)
  }

  if (params.page) {
    searchParams.set('page', String(params.page))
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit))
  }

  const query = searchParams.toString()
  return apiClient.get(query ? `/orders?${query}` : '/orders')
}

/**
 * 주문 상세 조회 API
 * GET /api/orders/:id
 */
export async function getOrderById(orderId) {
  return apiClient.get(`/orders/${orderId}`)
}

/**
 * 주문 상태 변경 API
 * PATCH /api/orders/:id
 */
export async function updateOrder(orderId, payload) {
  return apiClient.patch(`/orders/${orderId}`, payload)
}
