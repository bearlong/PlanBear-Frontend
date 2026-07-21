import Image from 'next/image'
import { useState, useEffect } from 'react'
import {
  CNav,
  CNavItem,
  CFormCheck,
  CButton,
  CCloseButton,
  COffcanvas,
  COffcanvasBody,
  COffcanvasHeader,
  COffcanvasTitle,
} from '@coreui/react'
import {
  FaAsterisk,
  FaMoneyBill,
  FaSearchengin,
  FaCheck,
} from 'react-icons/fa6'
import Link from 'next/link'
import styles from '@/styles/navbar.module.scss'

export default function Navbar({ title, items, visible, setVisible }) {
  const [isChecked, setIsChecked] = useState(false)
  const icon = {
    money: FaMoneyBill,
    search: FaSearchengin,
    check: FaCheck,
  }
  const itemHeight = 45
  const containerHeight = isChecked ? items.length * itemHeight : 0

  // 處理切換狀態
  const handleCheckChange = () => {
    setIsChecked((prev) => !prev)
  }

  useEffect(() => {
    if (!visible) {
      setIsChecked(false)
    }
  }, [visible])
  return (
    <>
      <CFormCheck
        button={{ color: 'primary', variant: 'outline' }}
        id={title}
        autoComplete="off"
        checked={isChecked}
        onChange={handleCheckChange}
        label={
          <>
            <span className="d-flex align-items-center h3 m-0">
              <FaAsterisk size={16} className="me-2" />
              {title}
            </span>
          </>
        }
      />

      <CNav
        className={`flex-column h3 justify-content-start align-items-start mt-3 d-flex flex-nowrap ${styles.navber}`}
        variant="underline"
        style={{ maxHeight: `${containerHeight}px` }}
      >
        {items.map((item, i) => {
          const IconComponent = icon[item.icon]
          return (
            <CNavItem key={i}>
              <Link
                href={item.href}
                className="text-decoration-none"
                onClick={() => setVisible(false)}
              >
                <span className="d-flex align-items-center h3 mb-3">
                  {IconComponent && (
                    <IconComponent size={16} className="me-2" />
                  )}
                  {item.displayName}
                </span>
              </Link>
            </CNavItem>
          )
        })}
      </CNav>
    </>
  )
}
