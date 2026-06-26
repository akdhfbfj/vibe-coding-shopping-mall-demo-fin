import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser } from '@/api/users.js'
import '@/pages/SignUpPage.css'

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

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

function SignUpPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateAgreement = (field, checked) => {
    if (field === 'all') {
      setAgreements({
        all: checked,
        terms: checked,
        privacy: checked,
        marketing: checked,
      })
      return
    }

    const next = { ...agreements, [field]: checked }
    next.all = next.terms && next.privacy && next.marketing
    setAgreements(next)
  }

  const validateForm = () => {
    if (!form.name.trim()) {
      return '이름을 입력해주세요.'
    }

    if (!form.email.trim()) {
      return '이메일을 입력해주세요.'
    }

    if (!EMAIL_PATTERN.test(form.email.trim())) {
      return '올바른 이메일 형식을 입력해주세요.'
    }

    if (!PASSWORD_PATTERN.test(form.password)) {
      return '비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.'
    }

    if (form.password !== form.confirmPassword) {
      return '비밀번호가 일치하지 않습니다.'
    }

    if (!agreements.terms || !agreements.privacy) {
      return '필수 약관에 동의해주세요.'
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
      const payload = {
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password,
        user_type: 'customer',
      }

      await createUser(payload)

      navigate('/', { state: { signupSuccess: true } })
    } catch (submitError) {
      setError(submitError.message || '회원가입에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="signup-page">
      <div className="signup-card">
        <header className="signup-header">
          <h1>회원가입</h1>
          <p>새로운 계정을 만들어 쇼핑을 시작하세요</p>
        </header>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="signup-error">{error}</div>}

          <div className="signup-field">
            <label className="signup-label" htmlFor="name">
              이름
            </label>
            <div className="signup-input-wrap">
              <span className="signup-input-icon">
                <UserIcon />
              </span>
              <input
                id="name"
                type="text"
                placeholder="이름을 입력하세요"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="signup-field">
            <label className="signup-label" htmlFor="email">
              이메일
            </label>
            <div className="signup-input-wrap">
              <span className="signup-input-icon">
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

          <div className="signup-field">
            <label className="signup-label" htmlFor="password">
              비밀번호
            </label>
            <div className="signup-input-wrap">
              <span className="signup-input-icon">
                <LockIcon />
              </span>
              <input
                id="password"
                className="has-toggle"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="signup-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            <p className="signup-hint">8자 이상, 영문, 숫자, 특수문자 포함</p>
          </div>

          <div className="signup-field">
            <label className="signup-label" htmlFor="confirmPassword">
              비밀번호 확인
            </label>
            <div className="signup-input-wrap">
              <span className="signup-input-icon">
                <LockIcon />
              </span>
              <input
                id="confirmPassword"
                className="has-toggle"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="비밀번호를 다시 입력하세요"
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="signup-toggle-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <EyeIcon open={showConfirmPassword} />
              </button>
            </div>
          </div>

          <div className="signup-agreements">
            <label className="signup-checkbox signup-checkbox--all">
              <input
                type="checkbox"
                checked={agreements.all}
                onChange={(e) => updateAgreement('all', e.target.checked)}
              />
              전체 동의
            </label>

            <div className="signup-agreement-list">
              <div className="signup-agreement-item">
                <label className="signup-checkbox">
                  <input
                    type="checkbox"
                    checked={agreements.terms}
                    onChange={(e) => updateAgreement('terms', e.target.checked)}
                  />
                  이용약관 동의 (필수)
                </label>
                <a href="#" className="signup-view-link" onClick={(e) => e.preventDefault()}>
                  보기
                </a>
              </div>

              <div className="signup-agreement-item">
                <label className="signup-checkbox">
                  <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={(e) => updateAgreement('privacy', e.target.checked)}
                  />
                  개인정보처리방침 동의 (필수)
                </label>
                <a href="#" className="signup-view-link" onClick={(e) => e.preventDefault()}>
                  보기
                </a>
              </div>

              <div className="signup-agreement-item">
                <label className="signup-checkbox">
                  <input
                    type="checkbox"
                    checked={agreements.marketing}
                    onChange={(e) => updateAgreement('marketing', e.target.checked)}
                  />
                  마케팅 정보 수신 동의 (선택)
                </label>
              </div>
            </div>
          </div>

          <button type="submit" className="signup-submit" disabled={isSubmitting}>
            {isSubmitting ? '가입 중...' : '회원가입하기'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default SignUpPage
