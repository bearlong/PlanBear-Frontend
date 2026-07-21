import { useMemo, useState, useEffect, useContext } from 'react'
import Head from 'next/head'
import { CCard, CCardBody, CCardHeader, CContainer } from '@coreui/react'
import usePermissionGuard from '@/hooks/usePermissionGuard'
import styles from '@/styles/instrument-names.module.scss'
import { AuthContext } from '@/context/AuthContext'
import InstrumentNameTable from '@/components/calibration/instrumentNameTable'

export default function InstrumentNamesPage() {
  usePermissionGuard('Calibration')

  return (
    <>
      <Head>
        <title>Maintain Instrument List</title>
      </Head>
      <CContainer className={styles.pageShell} fluid>
        <div className={styles.cardShell}>
          <CCard className={styles.card}>
            <CCardHeader className={styles.cardHeader}>
              <div>
                <p className={styles.eyebrow}>Calibration</p>
                <h2 className={styles.title}>Instrument Catalog</h2>
              </div>
            </CCardHeader>
            <CCardBody className={styles.cardBody}>
              <InstrumentNameTable variant="manage" />
            </CCardBody>
          </CCard>
        </div>
      </CContainer>

      {/* <ClientOnly>
        <CModal
          visible={Boolean(showSystemList && !showModal)}
          onClose={() => setShowSystemList(false)}
          alignment="center"
          size="xl"
          backdrop="static"
        >
          <CModalHeader>
            <h3 className="m-0 h3 fw-bold">Edit Instrument System</h3>
          </CModalHeader>
          <CModalBody>
            <span className="p fw-light">
              This action cannot be undone. Are you sure you want to delete this
              instrument entry?
            </span>
          </CModalBody>
          <CModalFooter className="d-flex justify-content-between">
            <CButton
              color="secondary"
              variant="ghost"
              onClick={() => setShowSystemList(false)}
              size="lg"
            >
              Cancel
            </CButton>
            <CButton color="danger" onClick={handleDelete} size="lg">
              Delete
            </CButton>
          </CModalFooter>
        </CModal>
      </ClientOnly> */}
    </>
  )
}
