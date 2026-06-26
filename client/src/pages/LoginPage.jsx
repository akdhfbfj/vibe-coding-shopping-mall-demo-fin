import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import HomeNavbar from '@/components/home/HomeNavbar.jsx'
import { getMe, login as loginApi } from '@/api/users.js'
import { clearAuth, getStoredToken, saveAuth } from '@/utils/authStorage.js'
import '@/pages/HomePage.css'
import '@/pages/LoginPage.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const { user, setUser } = useOutletContext()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const token = getStoredToken()

    if (!token) {
      setIsCheckingAuth(false)
      return
    }

    getMe()
      .then((userData) => {
        saveAuth(token, userData, Boolean(localStorage.getItem('token')))
        setUser(userData)
        navigate('/', { replace: true, state: { user: userData } })
      })
      .catch(() => {
        clearAuth()
        setIsCheckingAuth(false)
      })
  }, [navigate, setUser])

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!form.email.trim()) {
      return '이메일을 입력해주세요.'
    }

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      return '올바른 이메일 형식을 입력해주세요.'
    }

    if (!form.password) {
      return '비밀번호를 입력해주세요.'
    }

    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await loginApi({
        email: form.email.trim(),
        password: form.password,
      })

      if (!response.token || !response.user) {
        throw new Error('로그인 응답이 올바르지 않습니다.')
      }

      saveAuth(response.token, response.user, rememberMe)
      setUser(response.user)

      navigate('/', {
        replace: true,
        state: { loginSuccess: true, user: response.user },
      })
    } catch (submitError) {
      setError(submitError.message || '로그인에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="atelier-home">
        <HomeNavbar user={user} setUser={setUser} />
      </div>
    )
  }

  return (
    <div className="atelier-home">
      <HomeNavbar user={user} setUser={setUser} />

      <section className="login-page">
        <div className="login-card">
        <header className="login-header">
          <h1>로그인</h1>
          <p>계정에 로그인하여 쇼핑을 시작하세요</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label className="login-label" htmlFor="email">
              이메일
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <MailIcon />
              </span>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">
              비밀번호
            </label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <LockIcon />
              </span>
              <input
                id="password"
                className="has-toggle"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="login-checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              로그인 상태 유지
            </label>
            <a href="#" className="login-forgot-link" onClick={(e) => e.preventDefault()}>
              비밀번호 찾기
            </a>
          </div>

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>

          <div className="login-divider">또는</div>

          <div className="login-social-list">
            <button type="button" className="login-social-btn login-social-btn--outline">
              <span className="login-social-icon">
                <GoogleIcon />
              </span>
              Google로 로그인
            </button>
            <button type="button" className="login-social-btn login-social-btn--outline">
              <span className="login-social-icon">
                <FacebookIcon />
              </span>
              Facebook으로 로그인
            </button>
            <button type="button" className="login-social-btn login-social-btn--apple">
              <span className="login-social-icon">
                <AppleIcon />
              </span>
              Apple로 로그인
            </button>
          </div>
        </form>

        <p className="login-footer">
          아직 계정이 없으신가요?
          <Link to="/signup" className="login-footer-link">
            회원가입
          </Link>
        </p>
      </div>
      </section>
    </div>
  )
}

export default LoginPage
