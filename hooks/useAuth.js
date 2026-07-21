import React, { useState, useContext } from 'react'
import { api } from '@/utils/api'
import { AuthContext } from '@/context/AuthContext'
import Swal from 'sweetalert2'
import { useRouter } from 'next/router'
import https from 'https'
import { logger } from '@/utils/logger'

const Auth = () => {
  const router = useRouter()
  const { setUser } = useContext(AuthContext)
  const login = async (username, password) => {
    const url = api('/login')
    logger.info(`Fetching login from ${url}`, 'AuthContext')
    const method = 'POST'
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()

      if (response.ok) {
        logger.info('Login API success', 'Auth')
      } else {
        logger.warn(`Login API failed with status ${response.status}`, 'Auth')
      }

      return result
    } catch (err) {
      logger.error('Login request exception', 'Auth', err)
      console.log(err)
    }
  }

  const MFA = async () => {
    const url = api('/login/MFA')
    logger.info(`Fetching MFA from ${url}`, 'Auth')
    const method = 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        agent: new https.Agent({ rejectUnauthorized: false }),
      })
      const result = await response.json()
      if (response.ok) {
        logger.info('MFA API success', 'AuthContext')
      } else {
        logger.warn(`MFA API failed with status ${response.status}`, 'Auth')
      }
      return result
    } catch (err) {
      logger.error('MFA request exception', 'Auth', err)
      throw err
    }
  }

  const logout = async () => {
    const url = api('/logout')
    logger.info(`Sending logout request to ${url}`, 'Auth')
    const method = 'POST'

    try {
      const response = await fetch(url, {
        method,
        credentials: 'include',
      })
      const result = await response.json()

      if (result.status === 'success') {
        logger.info('Logout successful', 'Auth')
        setUser(result.data.user)
        Swal.fire({
          title: 'success',
          text: result.message,
          icon: 'success',
          customClass: 'h5',
          timer: 1500, // 顯示1.5秒後自動關閉
          showConfirmButton: false,
        }).then(() => {
          router.push('/member/login') // 等待提示顯示後才跳轉
        })
      } else {
        logger.warn(`Logout failed: ${result.message}`, 'Auth')

        Swal.fire({
          title: 'Warning',
          text: result.message,
          icon: 'warning',
          customClass: 'h5',
        })
      }
    } catch (err) {
      logger.error('Logout request exception', 'Auth', err)
      throw err
    }
  }
  return { login, MFA, logout }
}

export default Auth
