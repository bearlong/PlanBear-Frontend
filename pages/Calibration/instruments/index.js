import React, { useMemo, useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { CCard, CCardBody, CCardHeader, CContainer } from '@coreui/react'
import styles from '@/styles/calibration.module.scss'
import InstrumentTable from '@/components/calibration/instrumentTable'

export default function InstrumentsListPage() {
  const router = useRouter()

  const handleHref = (event, item) => {
    event.preventDefault()
    router.push({
      pathname: `/Calibration/instruments/${item.id}`,
      query: router.query,
    })
    return `/Calibration/instruments/${item.id}`
  }

  return (
    <>
      <Head>
        <title>Calibration Instruments</title>
      </Head>
      <CContainer fluid className={styles.pageShell}>
        <div className={styles.cardShell}>
          <CCard className={styles.card}>
            <CCardHeader className={styles.cardHeader}>
              <div>
                <p className={styles.eyebrow}>Calibration</p>
                <h2 className={styles.title}>Instruments</h2>
                <p className={styles.subTitle}>
                  Search and manage calibration instruments.
                </p>
              </div>
            </CCardHeader>
            <CCardBody className={styles.cardBody}>
              <InstrumentTable
                variant="manage"
                onSelect={(event, item) => handleHref(event, item)}
              />
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
    </>
  )
}
