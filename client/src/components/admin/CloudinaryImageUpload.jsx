import { useCloudinaryUploadWidget } from '@/hooks/useCloudinaryUploadWidget.js'

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  )
}

function CloudinaryImageUpload({ value, fileName, onChange, onError }) {
  const { openWidget, isReady, isConfigured, error } = useCloudinaryUploadWidget({
    onSuccess: ({ secureUrl, originalFilename }) => {
      onChange(secureUrl, originalFilename)
    },
  })

  const handleOpenWidget = () => {
    onError?.('')
    openWidget()
  }

  const handleRemove = () => {
    onChange('', '')
    onError?.('')
  }

  return (
    <div className="admin-product-image-upload">
      <div className="admin-product-file">
        <button
          type="button"
          className="admin-product-file-btn"
          onClick={handleOpenWidget}
          disabled={!isConfigured || !isReady}
        >
          <ImageIcon />
          {!isConfigured ? '이미지 업로드' : !isReady ? '위젯 준비 중...' : value ? '이미지 변경' : '이미지 업로드'}
        </button>
        <span className="admin-product-file-name">
          {!isConfigured
            ? 'Cloudinary 설정 필요'
            : !isReady
              ? '업로드 위젯 로딩 중'
              : fileName || (value ? '업로드 완료' : '선택된 이미지 없음')}
        </span>
      </div>

      {error && <p className="admin-product-upload-error">{error}</p>}

      {value && (
        <div className="admin-product-preview-wrap">
          <img src={value} alt="상품 미리보기" className="admin-product-preview" />
          <div className="admin-product-preview-meta">
            <p className="admin-product-preview-label">미리보기</p>
            {fileName && <p className="admin-product-preview-name">{fileName}</p>}
            <button type="button" className="admin-product-preview-remove" onClick={handleRemove}>
              이미지 제거
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CloudinaryImageUpload
