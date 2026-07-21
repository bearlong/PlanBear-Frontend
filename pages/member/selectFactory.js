import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
} from 'react'
import { useRouter } from 'next/router'
import { CButton, CContainer, CFormSelect } from '@coreui/react'
import styles from '@/styles/selectFactory.module.scss'
import { FadeLoader } from 'react-spinners'
import { userFactoryService } from '@/services/userFactory.service'
import { AuthContext } from '@/context/AuthContext'
import { useToast } from '@/hooks/useToast'

export default function SelectFactory() {
  const router = useRouter()
  const toast = useToast()
  const { setUser, user } = useContext(AuthContext)
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [factories, setFactories] = useState([])
  const [selectedFactory, setSelectedFactory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMounted = useRef(true)

  const factoryOptions = useMemo(() => factories, [factories])

  const loadFactories = useCallback(async () => {
    setStatus('loading')
    setErrorMessage('')
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))
      const response = await userFactoryService.getFactoryLists()
      const factoryData = response?.data || []
      const FACTORY_CODES = factoryData.map((item) => item.factory)

      if (!isMounted.current) return
      if (!FACTORY_CODES.length) {
        throw new Error('Factory list is empty')
      }
      setFactories(FACTORY_CODES)
      setStatus('ready')
    } catch (error) {
      if (!isMounted.current) return
      setStatus('error')
      setErrorMessage(error?.message || '載入失敗')
    }
  }, [])

  useEffect(() => {
    loadFactories()
    return () => {
      isMounted.current = false
    }
  }, [loadFactories])

  const handleConfirm = async () => {
    if (!selectedFactory) {
      toast.error('請先選擇廠區')
      return
    }
    setIsSubmitting(true)
    try {
      const response = await userFactoryService.addUserFactory({
        factory: selectedFactory,
      })
      if (response.status === 'duplicate') {
        toast.error('廠區已存在，請選擇其他廠區')
        return
      }
      if (response.status === 'error') {
        throw new Error(response.message || '儲存失敗，請稍後再試')
      }
      const updatedUser = { ...user, factory: selectedFactory }
      setUser(updatedUser)
      toast.success('廠區設定成功')

      await new Promise((resolve) => setTimeout(resolve, 400))
      const nextParam = router.query.next
      const nextPath =
        typeof nextParam === 'string' && nextParam.trim()
          ? nextParam
          : Array.isArray(nextParam) && nextParam[0]
          ? nextParam[0]
          : '/'
      router.replace(nextPath)
    } catch (error) {
      toast.error(error?.message || '儲存失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (user && user.factory) {
      router.replace('/')
    }
  }, [user, router])

  return (
    <main className={styles.page}>
      <CContainer className={styles.card}>
        <h1 className={styles.title}>Select Factory</h1>
        <p className={styles.helper}>
          Please select your factory to complete the initial setup. You will be
          taken to the home page once this step is finished.
        </p>
        {status === 'A' && (
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
          </div>
        )}
        {status === 'error' && (
          <div className={styles.stateBox}>
            <span className={styles.errorText}>
              {errorMessage || '載入失敗'}
            </span>
            <CButton
              color="secondary"
              variant="outline"
              onClick={loadFactories}
            >
              重試
            </CButton>
          </div>
        )}
        {(status === 'ready' || status === 'loading') && (
          <>
            <div className={styles.field}>
              <CFormSelect
                id="factory-select"
                className={`p mt-4`}
                value={selectedFactory}
                onChange={(event) => setSelectedFactory(event.target.value)}
              >
                <option value="">Select your factory...</option>
                {factoryOptions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </CFormSelect>
            </div>
            <div className={`m-4 d-flex justify-content-center`}>
              <CButton
                color="primary"
                className="btn-ph-primary"
                onClick={handleConfirm}
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm'}
              </CButton>
            </div>
          </>
        )}
      </CContainer>
    </main>
  )
}
