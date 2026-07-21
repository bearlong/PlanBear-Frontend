import { useState } from 'react'
import { useRouter } from 'next/router'
import Header from './header'
import dynamic from 'next/dynamic'

export default function MainLayout({ children }) {
  const router = useRouter()
  const { pathname } = router
  const Sidebar = dynamic(() => import('./sidebar'), { ssr: false })
  // 處理切換狀態

  const [visible, setVisible] = useState(true)
  const isLoginPage =
    pathname === '/member/login' ||
    pathname === '/member/selectFactory' ||
    pathname === '/member/select-role'
  const contentClass =
    visible && !isLoginPage ? 'withSidebar' : 'withoutSidebar'

  return (
    <>
      <div className=" bg">
        {!isLoginPage ? (
          <>
            <Header visible={visible} setVisible={setVisible} />
            <Sidebar visible={visible} setVisible={setVisible} />
          </>
        ) : (
          <></>
        )}
        <div className={contentClass}>{children}</div>
      </div>
    </>
  )
}
