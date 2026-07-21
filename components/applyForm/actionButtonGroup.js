import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CButton } from '@coreui/react'
import styles from '@/styles/signId.module.scss'
import { logger } from '@/utils/logger'
import useUserPermissions from '@/hooks/useUserPermissions'

export default function ActionButtonGroup({
  signInfo,
  versionList,
  onPrint = () => {},
  onCopyForm = () => {},
  onDownloadExcel = () => {},
  onResend = () => {},
  onDestroy = () => {},
  isControl = false,
}) {
  const { canUserDo } = useUserPermissions()
  const status = signInfo?.status || 'default'
  const maxVersion = Math.max(...versionList)

  const isReject =
    signInfo.status === 'reject' && signInfo.version !== maxVersion
  const COMMON = [
    {
      label: 'Close',
      color: 'secondary',
      href: '/Procurement/Application/query',
      className: `d-none d-lg-block ${styles.ch15}`,
    },
  ]

  const BUTTONS_MAP = {
    reject: [
      ...COMMON,
      {
        label: 'Resend Application',
        color: 'primary',
        onClick: onResend,
        className: `btn-ph-primary ${styles.ch20}`,
      },
      {
        label: 'Destroy Application',
        color: 'danger',
        variant: 'outline',
        onClick: onDestroy,
        className: styles.ch20,
        formActions: 'delete',
      },
    ],

    close: [
      ...COMMON,
      {
        label: 'Print',
        color: 'primary',
        variant: 'outline',
        className: `btn-ph-outline-primary ${styles.ch15}`,
        onClick: onPrint,
        formActions: 'print',
      },
      {
        label: 'Copy All Form',
        color: 'success',
        variant: 'outline',
        className: `btn-ph-outline-primary ${styles.ch15}`,
        onClick: onCopyForm,
      },
      {
        label: 'Download',
        color: 'success',
        variant: 'outline',
        className: `btn-ph-outline-primary ${styles.ch15}`,
        onClick: onDownloadExcel,
        formActions: 'export',
      },
    ],
    default: COMMON,
  }
  const buttons =
    isControl && !isReject
      ? BUTTONS_MAP[status] || BUTTONS_MAP.default
      : BUTTONS_MAP.default
  return (
    <div
      className="d-grid
    d-lg-flex
    gap-3
    justify-content-center
    grid-template-columns"
    >
      {buttons.map((btn, i) => {
        const hasAccess =
          !btn.formActions || canUserDo('Application', btn.formActions)
        if (!hasAccess) return null // 🔒 無權限就不顯示
        return btn.href ? (
          <Link
            key={i}
            href={btn.href}
            onClick={() => {
              logger.info(`Click ${btn.label}`, 'ActionButtonGroup')
            }}
          >
            <CButton
              color={btn.color}
              variant={btn.variant}
              className={btn.className}
            >
              {btn.label}
            </CButton>
          </Link>
        ) : (
          <CButton
            key={i}
            color={btn.color}
            variant={btn.variant}
            className={btn.className || styles.ch15}
            onClick={() => {
              logger.info(`Click ${btn.label}`, 'ActionButtonGroup')
              btn.onClick()
            }}
          >
            {btn.label}
          </CButton>
        )
      })}
    </div>
  )
}
