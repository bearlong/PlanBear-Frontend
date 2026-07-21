import { Children, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { CModal, CModalHeader, CModalBody, CModalFooter } from '@coreui/react'
import styles from '@/styles/calibration.module.scss'
import ClientOnly from '@/components/common/clientOnly'

export default function SelectModal({
  open = { open },
  onClose = { close },
  title = { title },
  children,
  footer,
}) {
  return (
    <ClientOnly>
      <CModal
        visible={open}
        onClose={onClose}
        alignment="center"
        size="xl"
        backdrop="static"
      >
        <CModalHeader>
          <h5 className="m-0 h4 fw-bold">{title}</h5>
        </CModalHeader>
        <CModalBody>{children}</CModalBody>
        <CModalFooter className="d-flex justify-content-between">
          {footer}
        </CModalFooter>
      </CModal>
    </ClientOnly>
  )
}
