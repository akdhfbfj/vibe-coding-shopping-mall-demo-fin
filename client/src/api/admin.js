import { apiClient } from '@/api/client.js'

/**
 * 관리자 대시보드 통계 조회 API
 * GET /api/admin/dashboard
 */
export async function getDashboardStats() {
  return apiClient.get('/admin/dashboard')
}
