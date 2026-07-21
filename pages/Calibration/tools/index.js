import { useEffect, useMemo, useState, useContext } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { FiArrowRight, FiTool } from 'react-icons/fi'
import sharedStyles from '@/styles/calibration.module.scss'
import styles from '@/styles/calibration-tools.module.scss'
import useUserPermissions from '@/hooks/useUserPermissions'
import { AuthContext } from '@/context/AuthContext'
import usePermissionGuard from '@/hooks/usePermissionGuard'

// Guide page options are centralized here so future routes can be maintained
// from one place without touching the rendering logic below.
const TOOL_DESTINATIONS = [
  {
    id: 1,
    title: 'Has Received Instrument',
    description: '已收到儀器',
    href: '/Calibration/tools/received-instrument',
    permissions: null,
    badge: 'Receive',
  },
  {
    id: 2,
    title: 'Change the calibration status Date, Calibration Report',
    description: '修改校正狀態日期,校驗報告',
    href: '/Calibration/tools/update-status-report',
    permissions: 'Calibration-TPE', // 需要 Calibration 模組權限才能看到這個選項
    badge: 'Report',
  },
  {
    id: 3,
    title: 'Property Number Change',
    description: '變更財產編號',
    href: '/Calibration/tools/property-no-change',
    permissions: null,

    badge: 'Property',
  },
  {
    id: 4,
    title: 'Calibration Cost',
    description: '校驗費用',
    href: '/Calibration/tools/calibration-cost',
    permissions: null,
    badge: 'Cost',
  },
]

export default function CalibrationToolsPage() {
  usePermissionGuard('Calibration')
  const router = useRouter()
  const { hasModuleAccess, handlePermissionGuard } = useUserPermissions()
  const { user } = useContext(AuthContext)
  const handleNavigate = (href) => {
    router.push(href)
  }

  return (
    <>
      <Head>
        <title>Select Tools</title>
      </Head>
      <CContainer fluid className={sharedStyles.pageShell}>
        <div className={sharedStyles.cardShell}>
          <CCard className={sharedStyles.card}>
            <CCardHeader className={sharedStyles.cardHeader}>
              <div>
                <p className={sharedStyles.eyebrow}>Calibration</p>
                <h2 className={sharedStyles.title}>Select Tools</h2>
                <p className={sharedStyles.subTitle}>
                  Please choose your destination from the links.
                </p>
              </div>
            </CCardHeader>
            <CCardBody className={sharedStyles.cardBody}>
              <CRow className="g-4">
                <CCol xs={12}>
                  <CCard
                    className={`${styles.sectionCard} ${styles.listCard} p`}
                  >
                    <CCardBody className="p-0">
                      <CTable
                        hover
                        responsive
                        align="middle"
                        className={`mb-0 ${styles.destinationTable}`}
                      >
                        <CTableHead className={styles.tableHead}>
                          <CTableRow>
                            <CTableHeaderCell className="h5">
                              Tool Name
                            </CTableHeaderCell>
                            <CTableHeaderCell className="h5">
                              Description
                            </CTableHeaderCell>

                            <CTableHeaderCell className="text-center h5">
                              Action
                            </CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {TOOL_DESTINATIONS.filter((item) => {
                            if (!item.permissions) return true
                            return hasModuleAccess(item.permissions) === true
                          }).map((item) => (
                            <CTableRow
                              key={item.id}
                              className={styles.tableRow}
                            >
                              <CTableDataCell>
                                <div
                                  className={`ms-3 d-flex align-items-center gap-2 ${styles.titleCell}`}
                                >
                                  {item.title}
                                </div>
                              </CTableDataCell>

                              <CTableDataCell
                                className={`text-muted ${styles.descriptionCell}`}
                              >
                                {item.description}
                              </CTableDataCell>

                              <CTableDataCell className="text-center">
                                <CButton
                                  className={`btn-ph-primary d-inline-flex align-items-center gap-2 ${styles.openButton}`}
                                  onClick={() => handleNavigate(item.href)}
                                >
                                  Open
                                  <FiArrowRight size={16} />
                                </CButton>
                              </CTableDataCell>
                            </CTableRow>
                          ))}
                        </CTableBody>
                      </CTable>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
    </>
  )
}
