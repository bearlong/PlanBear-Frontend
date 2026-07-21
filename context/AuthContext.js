import { createContext, useState, useEffect } from 'react'
import { api } from '@/utils/api'
import { useRouter } from 'next/router'
import Swal from 'sweetalert2'
import { logger } from '@/utils/logger'

// 創建 AuthContext，用於在應用中提供全局的身份驗證狀態
export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  // 狀態管理：token 和 user 信息
  const [user, setUser] = useState(undefined)
  const [isVerified, setIsVerified] = useState(false)
  const router = useRouter()
  const loginRoute = '/member/login' // 登入頁面的路徑
  const fetchUser = async () => {
    try {
      const url = api('/users/getUserInfo') // 獲取用戶信息的 API 路徑
      logger.info(`Fetching user info from ${url}`, 'AuthContext')
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })
      const result = await response.json()
      if (response.ok && result.status === 'success') {
        const { username, name } = result.data.user
        logger.info(`User authenticated: ${username}`, 'AuthContext')
        setUser(result.data.user)
        console.log(result.data.user)
        return true
      } else {
        logger.warn(`User fetch failed: ${result.message}`, 'AuthContext')
        if (router.pathname !== loginRoute) handleAuthError()
        return false
      }
    } catch (err) {
      logger.error('Fetch user failed', 'AuthContext', err)
      if (router.pathname !== loginRoute) handleAuthError()
      return false
    }
  }

  const handleAuthError = (message = 'Please login first') => {
    logger.warn(`Authentication error: ${message}`, 'AuthContext')
    Swal.fire({
      position: 'center',
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 1500,
      customClass: 'h5',
    })
    router.push('/member/login')
  }
  // // 在初始化完成後，根據 user 狀態進行頁面重定向
  useEffect(() => {
    if (!router.isReady || isVerified) return

    const isLoginPage = router.pathname === loginRoute
    const verifyUser = async () => {
      if (isLoginPage) {
        setIsVerified(true)
        return
      }
      logger.info('Verifying user...', 'AuthContext')
      const fetchedUser = await fetchUser() // 🚀 確保 fetchUser 是異步函式
      setIsVerified(true) // 🚀 確保 fetchUser 完成後再標記為已驗證

      if (!fetchedUser && router.pathname !== loginRoute) {
        logger.info('User not logged in, redirecting to login', 'AuthContext')
        router.push(loginRoute) // 🚀 確保 fetchUser 完成後再標記為已驗證
      }
    }

    if (!user) {
      verifyUser()
    }

    if (user && router.pathname === loginRoute) {
      logger.info(
        'User already logged in, redirecting to homepage',
        'AuthContext'
      )
      router.push('/') // 🚀 若已登入且仍停留在登入頁，導向首頁
    }
  }, [router.isReady, router.pathname, user])

  // 返回 AuthContext.Provider，提供 user、setUser、token 和 setToken 的上下文
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
      }}
    >
      {children} {/* 將子組件包裝在 Provider 中 */}
    </AuthContext.Provider>
  )
}
