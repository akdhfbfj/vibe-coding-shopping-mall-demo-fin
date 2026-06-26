import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import '@/components/Toast.css'

function Toast({ message, type = 'success', action, onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(timer)
  }, [duration, message, onClose])

  return (
    <div className={`atelier-toast atelier-toast--${type}`} role="status" aria-live="polite">
      <div className="atelier-toast-content">
        <p className="atelier-toast-message">{message}</p>
        {action && (
          <Link to={action.to} className="atelier-toast-action atelier-fade-hover" onClick={onClose}>
            {action.label}
          </Link>
        )}
      </div>
      <button type="button" className="atelier-toast-close atelier-fade-hover" onClick={onClose} aria-label="닫기">
        ×
      </button>
    </div>
  )
}

export default Toast
