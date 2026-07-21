import Head from 'next/head'
import {
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
import { FaArrowUpRightFromSquare, FaDownload } from 'react-icons/fa6'
import useUserPermissions from '@/hooks/useUserPermissions'
import styles from '@/styles/userHelp.module.scss'

const userHelpFile = (fileName) => `/user-help/${encodeURIComponent(fileName)}`

const HELP_MODULES = [
  {
    moduleCode: null,
    moduleLabel: 'General',
    description: '所有使用者皆可查看的共用操作文件。',
    documents: [
      {
        id: 'release-note-v1-6-0',
        name: 'User Guide.pdf',
        href: userHelpFile('User Guide.pdf'),
      },
    ],
  },
  {
    moduleCode: 'Procurement',
    moduleLabel: 'Request for Quotation',
    description: '詢價與簽核流程相關操作文件。',
    documents: [
      {
        id: 'procurement-apply',
        name: 'RFQ User Guide.pdf',
        href: userHelpFile('RFQ User Guide.pdf'),
      },
    ],
  },
  {
    moduleCode: 'Calibration',
    moduleLabel: 'Calibration',
    description: '儀器資料維護與報告上傳相關操作文件。',
    documents: [
      {
        id: 'calibration-maintain',
        name: 'Instrument Calibration Guide.pdf',
        href: userHelpFile('Instrument Calibration Guide.pdf'),
      },
    ],
  },
]

export default function UserHelpPage() {
  const { hasModuleAccess } = useUserPermissions()

  const visibleModules = HELP_MODULES.filter(
    (module) => module.moduleCode === null || hasModuleAccess(module.moduleCode)
  )

  return (
    <>
      <Head>
        <title>User Help</title>
      </Head>
      <CContainer fluid className={styles.pageShell}>
        <div className={styles.contentShell}>
          <CCard className={styles.pageCard}>
            <CCardHeader className={styles.pageHeader}>
              <div>
                <h2 className={styles.pageTitle}>User Help</h2>
                <p className={styles.pageSubtitle}>
                  依據您目前可使用的模組，提供對應操作說明文件。
                </p>
              </div>
            </CCardHeader>
            <CCardBody className={styles.pageBody}>
              {visibleModules.length === 0 ? (
                <CCard className={styles.emptyCard}>
                  <CCardBody className="p-4">
                    <div className="h4 mb-2">目前沒有可顯示的說明文件</div>
                    <div className="text-muted">
                      您目前尚未被授權任何對應模組，若需協助請洽系統管理員。
                    </div>
                  </CCardBody>
                </CCard>
              ) : (
                <CRow className="g-4">
                  {visibleModules.map((module) => (
                    <CCol xs={12} key={module.moduleCode}>
                      <CCard className={styles.moduleCard}>
                        <CCardHeader className={styles.moduleHeader}>
                          <div>
                            <div className={styles.moduleTitle}>
                              {module.moduleLabel}
                            </div>
                            <div className={styles.moduleDescription}>
                              {module.description}
                            </div>
                          </div>
                        </CCardHeader>
                        <CCardBody className="p-0">
                          <CTable
                            hover
                            responsive
                            align="middle"
                            className={`mb-0 ${styles.helpTable}`}
                          >
                            <CTableHead>
                              <CTableRow>
                                <CTableHeaderCell
                                  className={`h5 px-4 py-3 ${styles.nameColumn}`}
                                >
                                  文件名稱
                                </CTableHeaderCell>
                                <CTableHeaderCell
                                  className={`h5 py-3 ${styles.actionColumn}`}
                                >
                                  操作
                                </CTableHeaderCell>
                              </CTableRow>
                            </CTableHead>
                            <CTableBody>
                              {module.documents.map((document) => (
                                <CTableRow key={document.id}>
                                  <CTableDataCell
                                    className={`px-4 py-3 ${styles.nameColumn}`}
                                  >
                                    <div className={styles.documentName}>
                                      {document.name}
                                    </div>
                                  </CTableDataCell>
                                  <CTableDataCell
                                    className={`py-3 ${styles.actionColumn}`}
                                  >
                                    <div className={styles.actionGroup}>
                                      <CButton
                                        as="a"
                                        href={document.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        color="primary"
                                        className={`btn-ph-primary ${styles.actionButton}`}
                                      >
                                        <FaArrowUpRightFromSquare
                                          size={14}
                                          className="me-2"
                                        />
                                        開啟
                                      </CButton>
                                      <CButton
                                        as="a"
                                        href={document.href}
                                        download
                                        color="secondary"
                                        variant="outline"
                                        className={`btn-ph-outline-primary ${styles.actionButton}`}
                                      >
                                        <FaDownload
                                          size={14}
                                          className="me-2"
                                        />
                                        下載
                                      </CButton>
                                    </div>
                                  </CTableDataCell>
                                </CTableRow>
                              ))}
                            </CTableBody>
                          </CTable>
                        </CCardBody>
                      </CCard>
                    </CCol>
                  ))}
                </CRow>
              )}
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
    </>
  )
}
