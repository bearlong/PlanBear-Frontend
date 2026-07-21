import { useEffect } from 'react'
import '@/styles/globals.scss'
import '@coreui/coreui/dist/css/coreui.min.css'
import '@/styles/public.scss'
// 載入認証用context
import { AuthProvider } from '@/context/AuthContext'
import MainLayout from '@/components/layout/default-layout/mainLayout'

export default function MyApp({ Component, pageProps }) {
  // 使用自訂在頁面層級的版面(layout)
  useEffect(() => {
    const bootstrap = async () => {
      if (typeof window !== 'undefined') {
        await import('bootstrap/dist/js/bootstrap')

        try {
          const res = await fetch('/runtime-config.json')
          const config = await res.json()
          window.__RUNTIME_CONFIG__ = config
          console.log('[Runtime Config]', config)
        } catch (err) {
          console.warn('[Runtime Config] Failed to load', err)
        }
      }
    }
    bootstrap()
  }, [])

  const getLayout =
    Component.getLayout || ((page) => <MainLayout>{page}</MainLayout>)

  return (
    <AuthProvider>
      {/* <LoaderProvider close={2} CustomLoader={CatLoader}> */}
      {getLayout(<Component {...pageProps} />)}
      {/* </LoaderProvider> */}
    </AuthProvider>
  )
}
