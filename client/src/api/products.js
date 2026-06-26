import { apiClient } from '@/api/client.js'

/**
 * 상품 등록 API
 * POST /api/products
 */
export async function createProduct(productData) {
  return apiClient.post('/products', productData)
}

/**
 * 상품 목록 조회 API
 * GET /api/products
 */
export async function getProducts(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.category) {
    searchParams.set('category', params.category)
  }

  if (params.search) {
    searchParams.set('search', params.search)
  }

  if (params.page) {
    searchParams.set('page', String(params.page))
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit))
  }

  if (params.all) {
    searchParams.set('all', 'true')
  }

  const query = searchParams.toString()
  return apiClient.get(query ? `/products?${query}` : '/products')
}

/**
 * 전체 상품 목록 조회 API
 * GET /api/products?all=true
 */
export async function getAllProducts(params = {}) {
  const data = await getProducts({ ...params, all: true })
  return data.products
}

/**
 * 상품 상세 조회 API
 * GET /api/products/:id
 */
export async function getProduct(id) {
  return apiClient.get(`/products/${id}`)
}

/**
 * 상품 수정 API
 * PUT /api/products/:id
 */
export async function updateProduct(id, productData) {
  return apiClient.put(`/products/${id}`, productData)
}

/**
 * 상품 삭제 API
 * DELETE /api/products/:id
 */
export async function deleteProduct(id) {
  return apiClient.delete(`/products/${id}`)
}
