import { apiClient } from '@/api/client.js'

/**
 * 회원가입 API
 * POST /api/users
 * @param {{ email: string, name: string, password: string, user_type?: string, address?: string }} userData
 */
export async function createUser(userData) {
  return apiClient.post('/users', userData)
}

/**
 * 로그인 API
 * POST /api/users/login
 * @param {{ email: string, password: string }} credentials
 */
export async function login(credentials) {
  return apiClient.post('/users/login', credentials)
}

/**
 * 토큰으로 현재 로그인한 사용자 정보 조회
 * GET /api/users/me
 */
export async function getMe() {
  return apiClient.get('/users/me')
}

