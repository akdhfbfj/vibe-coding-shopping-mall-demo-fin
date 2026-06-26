import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getMe } from '@/api/users.js'
import { clearAuth, getStoredToken, getStoredUser, saveAuth } from '@/utils/authStorage.js'

export function useAuthSession(setUser) {
  const location = useLocation()

  useEffect(() => {
    const token = getStoredToken()

    if (!token) {
      setUser(null)
      return
    }

    const storedUser = getStoredUser()
    if (storedUser) {
      setUser(storedUser)
    }
  }, [location.pathname, setUser])

  useEffect(() => {
    const token = getStoredToken()

    if (!token) {
      setUser(null)
      return
    }

    const storedUser = getStoredUser()
    if (storedUser) {
      setUser(storedUser)
    }

    getMe()
      .then((userData) => {
        setUser(userData)
        saveAuth(token, userData, Boolean(localStorage.getItem('token')))
      })
      .catch(() => {
        clearAuth()
        setUser(null)
      })
  }, [setUser])
}
