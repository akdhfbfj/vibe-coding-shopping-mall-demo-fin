import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useOutletContext } from 'react-router-dom'
import AdminProductsLayout from '@/components/admin/AdminProductsLayout.jsx'
import { deleteProduct, getProducts } from '@/api/products.js'
import { isAdminUser } from '@/utils/userRole.js'

const CATEGORIES = ['상의', '하의', '악세사리']
const PAGE_SIZE = 5

const INITIAL_PAGINATION = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
}

function formatPrice(price) {
  return new Intl.NumberFormat('ko-KR').format(price)
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 5h18M7 12h10M10 19h4" />
    </svg>
  )
}

function AdminProductListPage() {
  const { user } = useOutletContext()
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(INITIAL_PAGINATION)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const filterRef = useRef(null)

  useEffect(() => {
    setPage(1)
  }, [search, category])

  useEffect(() => {
    if (!user || !isAdminUser(user)) {
      return
    }

    const timer = setTimeout(() => {
      setIsLoading(true)
      setError('')

      getProducts({
        search: search.trim() || undefined,
        category: category || undefined,
        page,
        limit: PAGE_SIZE,
      })
        .then((data) => {
          setProducts(data.products)
          setPagination(data.pagination)
        })
        .catch((fetchError) => {
          setError(fetchError.message || '상품 목록을 불러오지 못했습니다.')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }, search ? 300 : 0)

    return () => clearTimeout(timer)
  }, [user, search, category, page])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchProducts = async (nextPage = page) => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getProducts({
        search: search.trim() || undefined,
        category: category || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      })
      setProducts(data.products)
      setPagination(data.pagination)
      setPage(data.pagination.page)
    } catch (fetchError) {
      setError(fetchError.message || '상품 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (product) => {
    const confirmed = window.confirm(`"${product.name}" 상품을 삭제하시겠습니까?`)

    if (!confirmed) {
      return
    }

    setDeletingId(product._id)
    setError('')

    try {
      await deleteProduct(product._id)

      const remainingOnPage = products.length - 1
      const shouldGoPrevPage = remainingOnPage === 0 && page > 1

      if (shouldGoPrevPage) {
        setPage(page - 1)
      } else {
        await fetchProducts(page)
      }
    } catch (deleteError) {
      setError(deleteError.message || '상품 삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCategorySelect = (value) => {
    setCategory(value)
    setIsFilterOpen(false)
  }

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === page) {
      return
    }

    setPage(nextPage)
  }

  const hasActiveFilter = Boolean(search.trim() || category)
  const emptyMessage = hasActiveFilter ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'
  const pageNumbers = Array.from({ length: pagination.totalPages }, (_, index) => index + 1)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />
  }

  return (
    <AdminProductsLayout activeTab="list">
      <section className="admin-products-card">
        <h2 className="admin-products-card-title">상품 목록</h2>

        <div className="admin-products-toolbar">
          <label className="admin-products-search">
            <SearchIcon />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="admin-products-search-input"
              placeholder="상품명으로 검색..."
            />
          </label>

          <div className="admin-products-filter" ref={filterRef}>
            <button
              type="button"
              className={`admin-products-filter-btn${category ? ' admin-products-filter-btn--active' : ''}`}
              onClick={() => setIsFilterOpen((prev) => !prev)}
            >
              <FilterIcon />
              필터
              {category && <span className="admin-products-filter-badge">{category}</span>}
            </button>

            {isFilterOpen && (
              <div className="admin-products-filter-menu">
                <button
                  type="button"
                  className={`admin-products-filter-option${!category ? ' admin-products-filter-option--active' : ''}`}
                  onClick={() => handleCategorySelect('')}
                >
                  전체
                </button>
                {CATEGORIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`admin-products-filter-option${category === item ? ' admin-products-filter-option--active' : ''}`}
                    onClick={() => handleCategorySelect(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading && <p className="admin-products-empty">상품을 불러오는 중...</p>}

        {!isLoading && error && products.length === 0 && (
          <p className="admin-products-error">{error}</p>
        )}

        {!isLoading && !error && products.length === 0 && (
          <p className="admin-products-empty">{emptyMessage}</p>
        )}

        {!isLoading && products.length > 0 && (
          <>
            {error && <p className="admin-products-inline-error">{error}</p>}

            <div className="admin-products-table-wrap">
              <table className="admin-products-table">
                <thead>
                  <tr>
                    <th scope="col">이미지</th>
                    <th scope="col">SKU</th>
                    <th scope="col">상품명</th>
                    <th scope="col">카테고리</th>
                    <th scope="col">판매가격</th>
                    <th scope="col">등록일</th>
                    <th scope="col">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="admin-products-thumb"
                        />
                      </td>
                      <td>{product.sku}</td>
                      <td>
                        <div className="admin-products-name-cell">
                          <strong>{product.name}</strong>
                          {product.description && (
                            <span className="admin-products-desc">{product.description}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="admin-products-category">{product.category}</span>
                      </td>
                      <td>{formatPrice(product.price)}원</td>
                      <td>{formatDate(product.createdAt)}</td>
                      <td>
                        <div className="admin-products-actions">
                          <Link
                            to={`/admin/products/${product._id}/edit`}
                            className="admin-products-action-btn admin-products-action-btn--edit"
                          >
                            수정
                          </Link>
                          <button
                            type="button"
                            className="admin-products-action-btn admin-products-action-btn--delete"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product._id}
                          >
                            {deletingId === product._id ? '삭제 중...' : '삭제'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <nav className="admin-products-pagination" aria-label="상품 목록 페이지">
                <button
                  type="button"
                  className="admin-products-page-btn"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  이전
                </button>

                <div className="admin-products-page-numbers">
                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`admin-products-page-btn admin-products-page-btn--number${
                        pageNumber === page ? ' admin-products-page-btn--active' : ''
                      }`}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="admin-products-page-btn"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  다음
                </button>
              </nav>
            )}

            <p className="admin-products-page-info">
              전체 {pagination.total}개 중 {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, pagination.total)}개 표시
            </p>
          </>
        )}
      </section>
    </AdminProductsLayout>
  )
}

export default AdminProductListPage
