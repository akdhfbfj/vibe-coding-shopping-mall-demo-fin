import { getStoredToken } from '@/utils/authStorage.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export { getStoredToken }

async function request(path, options = {}) {
  const token = getStoredToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Error('백엔드 서버에 연결할 수 없습니다. server 폴더에서 npm run dev를 실행해 주세요.')
    }

    throw new Error(error.message || `Request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) =>
    request(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),
  put: (path, body, options) =>
    request(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  patch: (path, body, options) =>
    request(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
