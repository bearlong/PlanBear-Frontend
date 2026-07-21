import Image from 'next/image'
import { useState } from 'react'
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
import { FaMoneyBill, FaSearchengin, FaCheck } from 'react-icons/fa6'
import Link from 'next/link'
import styles from '@/styles/navbar.module.scss'
import { logger } from '@/utils/logger'
import useUserPermissions from '@/hooks/useUserPermissions'

export default function NavGroup({ moduleCode, title, items }) {
  const { hasModuleAccess } = useUserPermissions()
  const tooltipStyles = {
    '--cui-tooltip-color': '#888',
    '--cui-tooltip-font-size': '16px',
    '--cui-tooltip-bg': '#333333',
    '--cui-tooltip-max-width': 500,
  }

  const navItems = [
    {
      icon: FaMoneyBill,
      text: 'Application Creation',
      href: '/Procurement/Application/list',
    },
    {
      icon: FaSearchengin,
      text: 'Search Application',
      href: '/Procurement/Application/query',
    },
    {
      icon: FaCheck,
      text: 'Pending Approval',
      href: '/Procurement/Application/signature',
    },
  ]
  if (!hasModuleAccess(moduleCode)) {
    return null
  }
  return (
    <CNavGroup
      className={``}
      key={moduleCode}
      toggler={
        <CTooltip
          content={title}
          placement="right"
          style={tooltipStyles}
          animation={true}
          trigger="hover"
        >
          <div className={`h3 m-0 py-2 text-light ${styles.navTittle}`}>
            {title}
          </div>
        </CTooltip>
      }
    >
      {items.map(({ icon: Icon, text, href }) => (
        <CNavItem key={href} className={`p-3 m-0 ${styles.subnav}`}>
          <Link
            href={href}
            className="text-decoration-none text-light"
            onClick={() => {
              logger.info(`Click ${text}`, 'Sidebar')
            }}
          >
            <span className="d-flex align-items-center p fw-normal p-0 m-0">
              <Icon size={16} className="me-2" />
              {text}
            </span>
          </Link>
        </CNavItem>
      ))}
    </CNavGroup>
  )
}
