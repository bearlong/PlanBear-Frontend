import Image from 'next/image'
import { useState, useEffect, useContext } from 'react'
import {
  CNavItem,
  CSidebar,
  CSidebarBrand,
  CSidebarHeader,
  CSidebarNav,
  CSidebarToggler,
  CNavGroup,
  CNavTitle,
  CTooltip,
} from '@coreui/react'
import toast, { Toaster } from 'react-hot-toast'
import { useFavorites } from '@/hooks/useFavorites'
import { FaRegStar, FaStar } from 'react-icons/fa6'
import { AuthContext } from '@/context/AuthContext'
import Link from 'next/link'
import styles from '@/styles/navbar.module.scss'
import { useRouter } from 'next/router'
import useAuth from '@/hooks/useAuth'
import { logger } from '@/utils/logger'
import { api } from '@/utils/api'
import { sidebarModules } from '@/configs/sidebarConfig'
import useUserPermissions from '@/hooks/useUserPermissions'
export default function Sidebar({ visible, setVisible }) {
  const { logout } = useAuth()
  const { hasModuleAccess } = useUserPermissions()
  const { user } = useContext(AuthContext)
  const { favoriteItems, loading, mutate } = useFavorites(user?.username)
  const router = useRouter()

  const tooltipStyles = {
    '--cui-tooltip-color': '#888',
    '--cui-tooltip-font-size': '16px',
    '--cui-tooltip-bg': '#333333',
    '--cui-tooltip-max-width': 500,
  }
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200)
    return () => clearTimeout(t)
  }, [])

  const handleVisibleChange = (v) => {
    if (!ready) return // Citrix 初期抖動丟掉
    setVisible(v)
  }

  const handleToggleFavorite = async (itemKey) => {
    const isFavorite = !!favoriteItems[itemKey]
    const favoriteCount = Object.keys(favoriteItems).length
    const MAX_FAVORITES = 8
    if (!isFavorite && favoriteCount >= MAX_FAVORITES) {
      const notify = () =>
        toast.error(
          `You can only have up to ${MAX_FAVORITES} favorite items.`,
          {
            style: {
              border: '1px solid #3a4a64',
              padding: '16px',
              fontSize: '16px',
            },
          }
        )
      notify()
      return
    }
    const action = isFavorite ? 'DELETE' : 'POST'
    mutate(
      {
        status: 'success',
        data: Object.entries(favoriteItems)
          .filter(([key]) => key !== itemKey)
          .map(([key]) => ({ function_key: key })),
      },
      false
    )
    const result = await toggleFavoriteAPI(itemKey, action)
    mutate()
    if (result.status !== 'success') {
      logger.error(`Failed to toggle favorite for ${itemKey}`, 'Sidebar')
      return
    }

    logger.info(`Toggled favorite for ${itemKey} to ${!isFavorite}`, 'Sidebar')
  }

  const toggleFavoriteAPI = async (itemKey, action) => {
    try {
      const url =
        action === 'DELETE' ? api(`/favorites/${itemKey}`) : api(`/favorites`)
      const options = {
        method: action,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }

      if (action === 'POST') {
        options.body = JSON.stringify({
          function_key: itemKey,
        })
      }
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()
      return result
    } catch (error) {
      logger.error(`Error toggling favorite: ${error.message}`, 'Sidebar')
      return { status: 'error', message: error.message }
    }
  }

  return (
    <>
      <CSidebar
        className={`border-end sidebar-fixed ${styles.sidebar}`}
        size="xl"
        visible={visible}
        onVisibleChange={handleVisibleChange}
      >
        <CSidebarHeader className="border-bottom">
          <CSidebarBrand className="text-decoration-none d-flex justify-content-center align-items-center w-100">
            <Image
              src="/img/plan-bear-long-resolution-logo-white-transparent.png"
              width={250}
              height={80}
              alt="logo"
            />
            {/* <div className="h1 m-0 text-light fw-bold">Phihong</div> */}
          </CSidebarBrand>
        </CSidebarHeader>
        <CSidebarNav className="p-0">
          <CNavTitle className="text-light">
            <div className="h2">Modules</div>
          </CNavTitle>
          <CNavItem
            href="/"
            className={`h3 m-0 py-2 text-light d-flex d-lg-none ${styles.navTittle}`}
            onClick={() => {
              logger.info('Click home', 'Sidebar')
            }}
          >
            Home
          </CNavItem>
          <CNavItem
            href="#"
            className={`h3 m-0 py-2 text-light d-flex d-lg-none ${styles.navTittle}`}
            onClick={() => {
              logger.info('Click logout', 'Sidebar')
              logout()
            }}
          >
            Logout
          </CNavItem>
          {sidebarModules
            .filter((module) => {
              // 如果 module.key 有值 → 檢查是否有權限
              if (!module.alwaysVisible) {
                return hasModuleAccess(module.key)
              }
              // module.key 為 null → 全員可見
              return true
            })
            .map((module) => (
              <CNavGroup
                key={module.key}
                toggler={
                  <CTooltip
                    content={module.label}
                    placement="right"
                    style={tooltipStyles}
                    animation={true}
                    trigger="hover"
                  >
                    <div
                      className={`h3 m-0 py-2 text-light ${styles.navTittle}`}
                    >
                      {module.label}
                    </div>
                  </CTooltip>
                }
              >
                {module.items
                  .filter((item) => {
                    // moduleKey 為 null → 全員可見
                    if (!item.moduleKey) return true
                    // moduleKey 有值 → 檢查權限
                    return hasModuleAccess(item.moduleKey)
                  })
                  .map((item) => (
                    <CNavItem
                      key={item.key}
                      className={`p-3 m-0 ${styles.subnav}`}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <Link
                          href={item.href}
                          className="text-decoration-none text-light"
                          onClick={() => {
                            logger.info(`Click ${item.text}`, 'Sidebar')
                          }}
                        >
                          <span className="d-flex align-items-center p fw-normal p-0 m-0">
                            <item.icon size={16} className="me-2" />
                            {item.text}
                          </span>
                        </Link>
                        <button
                          type="button"
                          className="bg-transparent border-0 text-warning p-0 ms-3"
                          aria-label={`Toggle favorite for ${item.text}`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleToggleFavorite(item.key)
                          }}
                        >
                          {favoriteItems && favoriteItems[item.key] ? (
                            <FaStar size={16} />
                          ) : (
                            <FaRegStar size={16} />
                          )}
                        </button>
                      </div>
                    </CNavItem>
                  ))}
              </CNavGroup>
            ))}
        </CSidebarNav>
        <CSidebarHeader className="border-top">
          <CSidebarToggler />
        </CSidebarHeader>
      </CSidebar>
      <Toaster position="top-center" reverseOrder={false} className="p" />
    </>
  )
}
