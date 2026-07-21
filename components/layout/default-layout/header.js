import { useContext } from 'react'
import {
  CButton,
  CCollapse,
  CHeader,
  CContainer,
  CHeaderBrand,
  CHeaderNav,
  CForm,
  CFormInput,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
} from '@coreui/react'
import {
  FaChevronDown,
  FaCircleUser,
  FaDoorOpen,
  FaGear,
  FaHouseChimney,
  FaKey,
  FaMagnifyingGlass,
} from 'react-icons/fa6'
import Link from 'next/link'
import styles from '@/styles/navbar.module.scss'
import useAuth from '@/hooks/useAuth'
import { logger } from '@/utils/logger'
import { AuthContext } from '@/context/AuthContext'

export default function Header({ visible, setVisible }) {
  const { logout } = useAuth()
  const { user } = useContext(AuthContext)
  const version = process.env.NEXT_PUBLIC_VERSION || 'v0.0.0'

  const headerUserLabel = user?.name || user?.username || 'User'
  const dropdownUserTitle =
    user?.username && user?.name
      ? `${user.username} ${user.name}`
      : headerUserLabel
  const userDetails = [
    { label: '工號', value: user?.code || user?.employee_no || user?.emp_no },
    { label: '部門', value: user?.dept_name || user?.dept },
    { label: '廠別', value: user?.factory },
  ].filter((item) => item.value)

  return (
    <>
      <CHeader
        className={`${styles.header} ${
          visible ? 'withSidebar' : 'withoutSidebar'
        }`}
        position="sticky"
      >
        <CContainer fluid>
          <CHeaderBrand>
            <button
              className={`${styles['hamburger-menu']} border-0`}
              onClick={() => setVisible(!visible)}
            >
              <div />
              <div />
              <div />
            </button>
          </CHeaderBrand>
          <CCollapse className="header-collapse" visible={true}>
            <CHeaderNav className="gap-4">
              {/* <CForm className="d-none d-lg-flex center-flex">
                <CFormInput
                  className="me-2"
                  type="search"
                  placeholder="Search"
                  size="lg"
                  disabled
                  title="coming soon"
                />
                <CButton
                  type="submit"
                  color="success"
                  variant="outline"
                  className="btn-ph-outline-primary"
                  size="lg"
                  disabled
                  title="coming soon"
                >
                  <FaMagnifyingGlass size={16} />
                </CButton>
              </CForm> */}
              {/* <CDropdown
                variant="nav-item"
                className="p fw-normal"
                title="coming soon"
              >
                <CDropdownToggle color="secondary" disabled>
                  Language
                </CDropdownToggle>
                <CDropdownMenu className="h6">
                  <CDropdownItem>English</CDropdownItem>
                  <CDropdownItem>繁體中文</CDropdownItem>
                  <CDropdownItem>简体中文</CDropdownItem>
                </CDropdownMenu>
              </CDropdown> */}
              <Link className="p fw-normal center-flex" href="/member/userHelp">
                User Help
              </Link>
              <div className="d-none d-lg-flex align-items-center gap-2">
                <Link
                  href="/"
                  className="btn center-flex btn-ph-outline-primary border-0"
                  onClick={() => {
                    logger.info('Click home', 'Header')
                  }}
                >
                  <FaHouseChimney size={20} className="me-2" />
                  <span className="p fw-normal">Home</span>
                </Link>
                <CDropdown variant="nav-item" alignment="end">
                  <CDropdownToggle
                    caret={false}
                    className={`${styles.userMenuToggle} btn-ph-outline-primary border-0`}
                  >
                    <FaCircleUser size={18} className={styles.userMenuIcon} />
                    <span
                      className={`${styles.userMenuText} p fw-normal`}
                      title={dropdownUserTitle}
                    >
                      {headerUserLabel}
                    </span>
                    <FaChevronDown
                      size={12}
                      className={styles.userMenuChevron}
                    />
                  </CDropdownToggle>
                  <CDropdownMenu
                    alignment="end"
                    className={`${styles.userMenuDropdown} p`}
                  >
                    <div className={styles.userMenuProfile}>
                      <div
                        className={`${styles.userMenuProfileTitle} h5 fw-bold`}
                        title={dropdownUserTitle}
                      >
                        {dropdownUserTitle}
                      </div>
                      {userDetails.length > 0 && (
                        <div className={`p ${styles.userMenuMeta}`}>
                          {userDetails.map((item) => (
                            <div
                              key={item.label}
                              className={styles.userMenuMetaRow}
                            >
                              <span>{item.label}：</span>
                              <span>{item.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* <CDropdownDivider />
                    <CDropdownItem disabled className={styles.userMenuItem}>
                      <FaGear size={14} className="me-2" />
                      個人設定
                    </CDropdownItem>
                    <CDropdownItem disabled className={styles.userMenuItem}>
                      <FaKey size={14} className="me-2" />
                      變更密碼
                    </CDropdownItem> */}
                    <CDropdownDivider />
                    <CDropdownItem
                      className={`${styles.userMenuItem} primary p`}
                      onClick={() => {
                        logger.info('Click logout', 'Header')
                        logout()
                      }}
                    >
                      <FaDoorOpen size={14} className="me-2" />
                      登出
                    </CDropdownItem>
                  </CDropdownMenu>
                </CDropdown>
              </div>
            </CHeaderNav>
          </CCollapse>
        </CContainer>
      </CHeader>
      <div className={styles['version']}>{version}</div>
    </>
  )
}
