import { useEffect, useState, useContext } from 'react'
import Head from 'next/head'
import { CCard, CCardBody, CCardHeader, CContainer } from '@coreui/react'
import styles from '@/styles/instrument-factory.module.scss'
import InstrumentFactoryTable from '@/components/calibration/instrumentFactoryTable'
import usePermissionGuard from '@/hooks/usePermissionGuard'

export default function InstrumentFactoryPage() {
  usePermissionGuard('Calibration')

  return (
    <>
      <Head>
        <title>Instrument Factory</title>
      </Head>
      <CContainer className={styles.pageShell} fluid>
        <div className={styles.cardShell}>
          <CCard className={styles.card}>
            <CCardHeader className={styles.cardHeader}>
              <div>
                <p className={styles.eyebrow}>Calibration</p>
                <h2 className={styles.title}>Calibration Laboratory</h2>
                <p className={styles.subTitle}>
                  Manage vendor details, contacts, and site information.
                </p>
              </div>
            </CCardHeader>
            <CCardBody className={styles.cardBody}>
              <InstrumentFactoryTable variant="manage" />
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
    </>
  )
}
