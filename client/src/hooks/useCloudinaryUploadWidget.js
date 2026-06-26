import { useCallback, useEffect, useRef, useState } from 'react'

const CLOUDINARY_SCRIPT_URL = 'https://upload-widget.cloudinary.com/global/all.js'

let scriptPromise = null

function loadCloudinaryScript() {
  if (window.cloudinary?.createUploadWidget) {
    return Promise.resolve()
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${CLOUDINARY_SCRIPT_URL}"]`)

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve())
        existingScript.addEventListener('error', () => reject(new Error('Cloudinary 위젯을 불러오지 못했습니다.')))
        return
      }

      const script = document.createElement('script')
      script.src = CLOUDINARY_SCRIPT_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Cloudinary 위젯을 불러오지 못했습니다.'))
      document.body.appendChild(script)
    })
  }

  return scriptPromise
}

export function useCloudinaryUploadWidget({ onSuccess }) {
  const widgetRef = useRef(null)
  const onSuccessRef = useRef(onSuccess)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim()
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim()
  const isConfigured = Boolean(
    cloudName &&
    uploadPreset &&
    cloudName !== 'your_cloud_name' &&
    uploadPreset !== 'your_unsigned_upload_preset'
  )

  useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  useEffect(() => {
    if (!isConfigured) {
      setError('Cloudinary 환경 변수(VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET)를 설정해주세요.')
      return
    }

    setError('')
    let isMounted = true

    loadCloudinaryScript()
      .then(() => {
        if (!isMounted) return

        widgetRef.current = window.cloudinary.createUploadWidget(
          {
            cloudName,
            uploadPreset,
            sources: ['local', 'url', 'camera'],
            multiple: false,
            resourceType: 'image',
            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            maxFileSize: 5000000,
            language: 'ko',
            text: {
              ko: {
                local: {
                  browse: '파일 선택',
                  dd_title_single: '이미지를 여기에 드래그하세요',
                },
                queue: {
                  title: '업로드 대기',
                  title_uploading_with_counter: '{{num}}개 업로드 중',
                  upload_more: '더 업로드',
                  done: '완료',
                },
              },
            },
          },
          (uploadError, result) => {
            if (uploadError) {
              setError('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
              return
            }

            if (result?.event === 'success') {
              setError('')
              onSuccessRef.current?.({
                secureUrl: result.info.secure_url,
                publicId: result.info.public_id,
                originalFilename: result.info.original_filename,
              })
            }
          }
        )

        setIsReady(true)
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError.message)
        }
      })

    return () => {
      isMounted = false
    }
  }, [cloudName, uploadPreset, isConfigured])

  const openWidget = useCallback(() => {
    if (!isConfigured) {
      setError('Cloudinary 환경 변수(VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET)를 설정해주세요.')
      return
    }

    if (!widgetRef.current) {
      setError('Cloudinary 위젯이 아직 준비되지 않았습니다.')
      return
    }

    widgetRef.current.open()
  }, [isConfigured])

  return {
    openWidget,
    isReady,
    isConfigured,
    error,
    clearError: () => setError(''),
  }
}
