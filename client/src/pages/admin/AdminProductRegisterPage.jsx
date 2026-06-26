import { useState } from 'react'
import { Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import AdminProductsLayout from '@/components/admin/AdminProductsLayout.jsx'
import CloudinaryImageUpload from '@/components/admin/CloudinaryImageUpload.jsx'
import { createProduct } from '@/api/products.js'
import { isAdminUser } from '@/utils/userRole.js'

const CATEGORIES = ['상의', '하의', '악세사리']

const INITIAL_FORM = {
  sku: '',
  name: '',
  price: '',
  category: '',
  description: '',
  image: '',
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

function AdminProductRegisterPage() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [imageFileName, setImageFileName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (imageUrl, name = '') => {
    setForm((prev) => ({ ...prev, image: imageUrl }))
    setImageFileName(name)
    if (imageUrl) {
      setError('')
    }
  }

  const handleReset = () => {
    setForm(INITIAL_FORM)
    setImageFileName('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.sku.trim()) {
      setError('SKU를 입력해주세요.')
      return
    }

    if (!form.name.trim()) {
      setError('상품명을 입력해주세요.')
      return
    }

    const price = Number(form.price)

    if (!form.price || Number.isNaN(price) || price < 0) {
      setError('판매가격을 올바르게 입력해주세요.')
      return
    }

    if (!form.category) {
      setError('카테고리를 선택해주세요.')
      return
    }

    if (!form.image) {
      setError('메인 이미지를 선택해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      await createProduct({
        sku: form.sku.trim(),
        name: form.name.trim(),
        price,
        category: form.category,
        image: form.image,
        description: form.description.trim() || undefined,
      })

      navigate('/admin/products')
    } catch (submitError) {
      setError(submitError.message || '상품 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminProductsLayout activeTab="register">
      <section className="admin-products-card">
        <h2 className="admin-products-card-title">새 상품 등록</h2>

        <form className="admin-product-form" onSubmit={handleSubmit} noValidate>
          <div className="admin-product-form-grid">
            <div className="admin-product-form-col">
              <label className="admin-product-field">
                <span className="admin-product-label">SKU</span>
                <input
                  type="text"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  className="admin-product-input"
                  placeholder="예: SHIRT-001"
                  autoComplete="off"
                />
              </label>

              <label className="admin-product-field">
                <span className="admin-product-label">상품명</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="admin-product-input"
                  placeholder="상품명을 입력하세요"
                />
              </label>

              <label className="admin-product-field">
                <span className="admin-product-label">판매가격</span>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className="admin-product-input"
                  placeholder="0"
                  min="0"
                />
              </label>

              <label className="admin-product-field">
                <span className="admin-product-label">카테고리</span>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="admin-product-input admin-product-select"
                >
                  <option value="">카테고리 선택</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-product-form-col">
              <label className="admin-product-field">
                <span className="admin-product-label">상품 설명</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="admin-product-textarea"
                  placeholder="상품에 대한 자세한 설명을 입력하세요"
                  rows={8}
                />
              </label>

              <div className="admin-product-field">
                <span className="admin-product-label">메인 이미지</span>
                <CloudinaryImageUpload
                  value={form.image}
                  fileName={imageFileName}
                  onChange={handleImageChange}
                  onError={setError}
                />
              </div>
            </div>
          </div>

          {error && <p className="admin-product-error">{error}</p>}

          <div className="admin-product-actions">
            <button
              type="button"
              className="admin-product-reset-btn"
              onClick={handleReset}
              aria-label="입력 초기화"
            >
              <TrashIcon />
            </button>
            <button type="submit" className="admin-product-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </section>
    </AdminProductsLayout>
  )
}

export default AdminProductRegisterPage
