import React, { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from '@/styles/login.module.scss'
import { useRouter } from 'next/router'
import useAuth from '@/hooks/useAuth'
import { AuthContext } from '@/context/AuthContext'
import { CButton, CContainer, CRow, CCol, CFormInput } from '@coreui/react'
import Swal from 'sweetalert2'
import { FaEyeSlash, FaEye } from 'react-icons/fa6'
import { FadeLoader } from 'react-spinners'
import { logger } from '@/utils/logger'
import https from 'https'

export default function Login() {
  const router = useRouter()
  const { setUser, user } = useContext(AuthContext)
  const errorMasInit = { username: '', password: '' }
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [MFALoading, setMFALoading] = useState(false)
  const [checkPassword, setCheckPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState(errorMasInit)
  const { login, MFA } = useAuth()
  const handleCheckPassword = (e) => {
    setCheckPassword(!checkPassword)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrorMsg = validateForm()

    // 檢查是否有錯誤訊息
    const hasError = Object.values(newErrorMsg).some((msg) => msg !== '')
    if (hasError) {
      logger.error(`username or password is empty`, 'LoginForm')
      showWarningMessage('Please fill out all required fields.')
      return
    }
    const result = await login(username, password)
    if (result.status !== 'success') {
      logger.error(result.message, 'LoginForm')
      console.log(result)
      showWarningMessage(result.message)
      setPassword('')
      return
    }
    if (result.data) {
      logger.info('First login success, MFA', 'LoginForm')
      setUser(result.data.user)
      router.push(
        result.data.user.needsRoleSelection ? '/member/select-role' : '/'
      )
      return
    }

    // 進行MFA驗證
    setMFALoading(true)
    try {
      const MFAResult = await MFA()
      if (MFAResult.status === 'success') {
        logger.info('Login success', 'LoginForm')

        setUser(MFAResult.data.user)
        router.push('/')
      } else {
        logger.error(MFAResult.message, 'LoginForm')
        showWarningMessage(MFAResult.message)
        setPassword('')
      }
    } catch (error) {
      logger.error('MFA error', 'LoginForm')
      showWarningMessage('An error occurred during MFA.')
      setPassword('')
    } finally {
      setMFALoading(false)
    }
  }

  const validateForm = () => {
    const newErrorMsg = { ...errorMasInit }
    if (!username) newErrorMsg.username = 'Username is required'
    if (!password) newErrorMsg.password = 'Password is required'
    setErrorMsg(newErrorMsg)
    return newErrorMsg
  }

  const showWarningMessage = (message) => {
    Swal.fire({
      title: 'Warning',
      text: message,
      icon: 'warning',
      customClass: 'h5',
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (!router.isReady) return // 確保 route 準備好再執行
    logger.info('Router is ready', 'Login')
    if (user) {
      logger.info(`User detected, redirecting to '/'`, 'Login')
      if (user.needsRoleSelection) {
        router.push('/member/select-role')
      } else if (!user.factory) {
        router.push('/member/selectFactory')
      } else {
        router.push('/')
      }
    }
  }, [router, user])
  return (
    <>
      <main
        className={
          'login d-flex flex-column justify-content-center align-items-center min-vh-100'
        }
      >
        <div
          className={` px-4 pt-5 container d-flex justify-content-center mb-5`}
        >
          <div className="d-inline-block text-center">
            <Image
              className="me-2 "
              src="/img/plan-bear-long-resolution-logo-black-transparent.png"
              width={500}
              height={30}
              alt="logo"
            />
          </div>
        </div>
        {MFALoading ? (
          <>
            <div className="d-flex flex-column justify-content-center align-items-center gap-3">
              <FadeLoader
                color={'#0d5cab'}
                height={15}
                loading
                margin={2}
                radius={2}
                speedMultiplier={1}
                width={5}
              />
              <span className="h3 my-3">請於手機APP確認授權 </span>
              <span className="h3 my-3"> 等待MFA驗證中...</span>
            </div>
          </>
        ) : (
          <CContainer className={`pb-3 mb-5 ${styles.loginForm}`}>
            <CRow className="h3 gap-3 justify-content-around mb-3">
              <CCol sm="3">
                <span className="fw-bold">Username：</span>
              </CCol>
              <CCol sm="7">
                <CFormInput
                  onKeyDown={handleKeyDown}
                  onChange={(e) => {
                    setUsername(e.target.value)
                  }}
                  value={username}
                  size="lg"
                />

                <div className={`text-danger ${styles.errorBox}`}>
                  {errorMsg.username}
                </div>
              </CCol>
              <CCol sm="3">
                <span className="fw-bold">Password：</span>
              </CCol>
              <CCol sm="7">
                <div className="position-relative">
                  <CFormInput
                    type={checkPassword ? 'text' : 'password'}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => {
                      setPassword(e.target.value)
                    }}
                    value={password}
                    size="lg"
                  />
                  <div
                    className={`position-absolute ${styles.passwordToggleIcon}`}
                  >
                    {checkPassword ? (
                      <FaEye
                        onClick={handleCheckPassword}
                        title="Show password"
                      />
                    ) : (
                      <FaEyeSlash
                        onClick={handleCheckPassword}
                        title="Hide password"
                      />
                    )}
                  </div>
                </div>
                <div className={`text-danger ${styles.errorBox}`}>
                  {errorMsg.password}
                </div>
              </CCol>
            </CRow>
            <div className="d-flex justify-content-center mb-3">
              <CButton
                size="lg"
                color="primary"
                className="btn-ph-primary"
                onClick={handleSubmit}
              >
                Login
              </CButton>
            </div>
          </CContainer>
        )}
        <div className={styles.demoInfo}>
          <p className="fw-semibold mb-1">Demo Environment</p>
          <p className="mb-2">This portfolio runs in Demo Mode.</p>
          <p className="mb-1">Username: Any account</p>
          <p className="mb-0">Password: 1234</p>
        </div>
      </main>
    </>
  )
}
