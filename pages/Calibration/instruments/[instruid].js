import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useToast } from '@/hooks/useToast'
import { api } from '@/utils/api'
import useUserPermissions from '@/hooks/useUserPermissions'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CNav,
  CNavItem,
  CNavLink,
  CRow,
  CSpinner,
  CTabContent,
  CTabPane,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import ClientOnly from '@/components/common/clientOnly'
import { calibrationService } from '@/services/Calibration/calibration.service'
import styles from '@/styles/calibration.module.scss'
import Swal from 'sweetalert2'
import InformationEdit from '@/components/calibration/informationEdit'
import LogHistory from '@/components/calibration/logHistory'
import UpdateReport from '@/components/calibration/updateReport'

const formatDate = (value) => {
  if (!value) return '-'
  return value.toString().slice(0, 10)
}

const displaySubInstruId = (value) => {
  if (value === null || value === 'undefined') return '-'
  return value
}

export default function InstrumentDetailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [instrumentData, setInstrumentData] = useState({})
  const [activeTab, setActiveTab] = useState('info')
  const [showEditModal, setShowEditModal] = useState(false)
  const [history, setHistory] = useState([])

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const toast = useToast()
  const { hasModuleAccess, handlePermissionGuard } = useUserPermissions()

  const fetchInstrument = async (id) => {
    setLoading(true)
    const result = await calibrationService.getCalibrationById(id)

    if (result.status === 'error') {
      setLoading(false)
      return
    }
    setInstrumentData(result.data)
    fetchHistory(result.data.id)
    setLoading(false)
  }

  const fetchHistory = async (id) => {
    const result = await calibrationService.getHistoryById(id)

    if (result.status === 'error') {
      toast.error('Failed to fetch history data.')
      return
    }
    const sortData = result.data.sort((a, b) => a.id - b.id)
    setHistory(sortData)
  }

  const handleReportApproval = async (log_id) => {
    const result = await calibrationService.approveCalibrationReport(
      log_id,
      instrumentData.id
    )
    if (result.status === 'error') {
      toast.error(result.message || 'Failed to approve report.')
      return
    }
    toast.success('Report approved successfully.')
    fetchInstrument(instrumentData.id) // Refresh data after approval
  }

  const handleReportReject = async (log_id) => {
    if (!rejectReason) {
      toast.error(
        'Please provide a reason for rejection before approving the report.'
      )
      return
    }

    const result = await calibrationService.rejectCalibrationReport(
      log_id,
      instrumentData.id,
      rejectReason
    )
    if (result.status === 'error') {
      toast.error(result.message || 'Failed to approve report.')
      return
    }

    toast.success('Report approved successfully.')
    fetchInstrument(instrumentData.id) // Refresh data after approval
    setShowRejectModal(false)
    setRejectReason('')
  }

  const handleConfirm = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this instrument?',
      icon: 'warning',
      showCancelButton: true,
      customClass: {
        htmlContainer: 'p',
        title: 'h2',
        popup: 'h3',
        confirmButton: 'btn btn-primary btn-ph-primary me-3 p',
        cancelButton: 'btn btn-secondary p',
      },
      confirmButtonText: 'Yes, proceed',
      cancelButtonText: 'No, cancel',
    })

    return result.isConfirmed
  }
  const handleDelete = async () => {
    const handleConfirmResult = await handleConfirm()
    if (!handleConfirmResult) return
    const result = await calibrationService.deleteCalibrationInstrument(
      instrumentData.id
    )
    if (result.status === 'error') {
      toast.error(result.message || 'Failed to delete instrument.')
      return
    }
    toast.success('Instrument deleted successfully.')
    router.push('/Calibration/instruments')
  }

  const infoRows = useMemo(() => {
    if (!instrumentData) return []
    return [
      { label: 'Porperty No(財產編號)', value: instrumentData.property_no },
      {
        label: 'Description(儀器說明)',
        value: instrumentData.description || '-',
      },
      {
        label: 'Instrument Name (儀器名稱)',
        value: instrumentData.instrument?.instru_name,
      },
      {
        label: 'Instrument System(儀器量別)',
        value: instrumentData.instrument?.system,
      },
      { label: 'Instrument SN(儀器序號)', value: instrumentData.instru_sn },
      { label: 'Vendor(廠牌)', value: instrumentData.vendor },
      { label: 'Model(型號)', value: instrumentData.model },
      {
        label: 'Calibration Class(校驗類別)',
        value: instrumentData.calibr_class,
      },
      {
        label: 'Calibration Organization(外教單位)',
        value: instrumentData.calibration_org?.name,
      },
      {
        label: 'Calibration Cycle(校驗週期)',
        value: `${instrumentData.calibr_cycle} months`,
      },
      { label: 'Date(入廠日期)', value: formatDate(instrumentData.date) },
      { label: 'Manager(保管人)', value: instrumentData.owner },
      { label: 'Department(保管單位)', value: instrumentData.dept },
      { label: 'Status(使用狀態)', value: instrumentData.status },
      {
        label: 'Customhouse oversee(是否海關監管)',
        value: instrumentData.oversee ? 'Y' : 'N',
      },
      {
        label: 'Standard type(是否為標準件)',
        value: instrumentData.standard ? 'Y' : 'N',
      },
      {
        label: 'Is Common Instrument(是否為共用儀器)',
        value: instrumentData.is_common ? 'Y' : 'N',
      },
      {
        label: 'Is Medical Equipment(是否為醫材設備)',
        value: instrumentData.is_medical_equipment ? 'Y' : 'N',
      },
      {
        label: 'Change Date(上次校驗日期)',
        value: formatDate(instrumentData.change_date),
      },
      {
        label: 'Document No(操作手冊編號)',
        value: instrumentData.doc_no || '-',
      },
      {
        label: 'Sub Instrument ID(子財產編號)',
        value: displaySubInstruId(instrumentData.sub_instru_id),
      },
    ]
  }, [instrumentData])

  if (!instrumentData) {
    return (
      <CContainer fluid className={styles.pageShell}>
        <div className={styles.cardShell}>
          <CCard className={styles.card}>
            <CCardBody className={styles.cardBody}>
              <h4 className="mb-2">Instrument Not Found</h4>
              <p className="text-muted">
                We could not locate the instrument you requested.
              </p>
              <CButton
                color="primary"
                size="lg"
                className="btn-ph-primary"
                onClick={() => router.push('/Calibration/instruments')}
              >
                Back to List
              </CButton>
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
    )
  }

  useEffect(() => {
    if (!router.isReady) return
    const { instruid } = router.query
    if (instruid) {
      fetchInstrument(instruid)
    }
  }, [router.isReady, router.query])
  return (
    <>
      <Head>
        <title>Instrument</title>
      </Head>
      {loading ? (
        <CContainer fluid className={styles.pageShell}>
          <div className={styles.cardShell}>
            <CCard className={styles.card}>
              <CCardBody className={styles.cardBody}>
                <div className="d-flex align-items-center gap-3">
                  <CSpinner />
                  <span className="text-muted">Loading instrument...</span>
                </div>
              </CCardBody>
            </CCard>
          </div>
        </CContainer>
      ) : (
        <CContainer fluid className={styles.pageShell}>
          <div className={styles.cardShell}>
            <CCard className={styles.card}>
              <CCardHeader className={styles.cardHeader}>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <div>
                    <p className={styles.eyebrow}>Calibration</p>
                    <h2 className={styles.title}>
                      {instrumentData.property_no}
                    </h2>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <CButton
                      color="secondary"
                      size="lg"
                      onClick={() =>
                        router.push({
                          pathname: '/Calibration/instruments',
                          query: router.query,
                        })
                      }
                    >
                      Back
                    </CButton>
                  </div>
                </div>
              </CCardHeader>
              <CCardBody className={styles.cardBody}>
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 h3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted">Status</span>
                    <CBadge
                      color={
                        instrumentData.status === 'Usable'
                          ? 'success'
                          : 'secondary'
                      }
                    >
                      {instrumentData.status}
                    </CBadge>
                  </div>
                </div>

                <CNav variant="tabs" className="mb-3 p">
                  <CNavItem>
                    <CNavLink
                      active={activeTab === 'info'}
                      onClick={() => setActiveTab('info')}
                    >
                      Information
                    </CNavLink>
                  </CNavItem>
                  <CNavItem>
                    <CNavLink
                      active={activeTab === 'history'}
                      onClick={() => setActiveTab('history')}
                    >
                      History
                    </CNavLink>
                  </CNavItem>
                  <CNavItem>
                    {hasModuleAccess('Calibration') && (
                      <CNavLink
                        active={activeTab === 'reports'}
                        onClick={() => setActiveTab('reports')}
                      >
                        Report / Files
                      </CNavLink>
                    )}
                  </CNavItem>
                  <CNavItem>
                    {hasModuleAccess('Calibration_boss') && (
                      <CNavLink
                        active={activeTab === 'signature'}
                        onClick={() => setActiveTab('signature')}
                      >
                        Signature
                      </CNavLink>
                    )}
                  </CNavItem>
                </CNav>
                <CTabContent>
                  <CTabPane visible={activeTab === 'info'}>
                    <CRow className="g-3 p">
                      {hasModuleAccess('Calibration') && (
                        <CCol md={12}>
                          <CButton
                            color="primary me-3"
                            size="lg"
                            className="btn-ph-primary"
                            onClick={() => setShowEditModal(true)}
                          >
                            Edit
                          </CButton>
                          <CButton
                            color="danger"
                            size="lg"
                            onClick={() => {
                              if (handleConfirm() === false) return
                              handleDelete()
                            }}
                          >
                            Del
                          </CButton>
                        </CCol>
                      )}
                      {infoRows.map((item) => (
                        <CCol md={6} key={item.label}>
                          <div className="text-muted small">{item.label}</div>
                          <div className="fw-semibold">{item.value || '-'}</div>
                        </CCol>
                      ))}
                    </CRow>
                  </CTabPane>
                  <CTabPane visible={activeTab === 'history'}>
                    <LogHistory history={history} />
                  </CTabPane>
                  <CTabPane visible={activeTab === 'reports'}>
                    <UpdateReport
                      instrumentData={instrumentData}
                      history={history}
                      fetchInstrument={fetchInstrument}
                    />
                  </CTabPane>
                  <CTabPane visible={activeTab === 'signature'}>
                    <div className="border rounded-4 shadow-sm bg-white p">
                      <CTable hover responsive align="middle" className="mb-0">
                        <CTableHead>
                          <CTableRow>
                            <CTableHeaderCell className="py-3 ps-3">
                              Update date (變更日期)
                            </CTableHeaderCell>
                            <CTableHeaderCell className="py-3 ps-3">
                              Report File (報告文件)
                            </CTableHeaderCell>
                            <CTableHeaderCell className="py-3">
                              Action (審核)
                            </CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {history.length === 0 ? (
                            <CTableRow>
                              <CTableDataCell
                                colSpan={3}
                                className="text-center py-4"
                              >
                                <span className="text-muted">
                                  No history records yet.
                                </span>
                              </CTableDataCell>
                            </CTableRow>
                          ) : (
                            history
                              .filter(
                                (item) => item.requires_report_approval === 'T'
                              )
                              .map((record) => (
                                <CTableRow key={record.id}>
                                  <CTableDataCell className="ps-3">
                                    {record.created_at}
                                  </CTableDataCell>
                                  <CTableDataCell className="ps-3">
                                    {record.calibration_log_file?.length > 0 ? (
                                      record.calibration_log_file.map(
                                        (file, index) => (
                                          <div key={file.id || index}>
                                            <button
                                              className="btn btn-link p"
                                              target="_blank"
                                              onClick={() => {
                                                const url = api(
                                                  `/data/files?filename=calibration/${file.file_url}`
                                                )
                                                window.open(url, '_blank')
                                              }}
                                            >
                                              {file.file_url ||
                                                `Report ${index + 1}`}
                                            </button>
                                          </div>
                                        )
                                      )
                                    ) : (
                                      <span className="text-muted">
                                        No report file
                                      </span>
                                    )}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CButton
                                      color="primary"
                                      size="lg"
                                      className="btn-ph-primary"
                                      onClick={() => {
                                        handleReportApproval(record.id)
                                      }}
                                    >
                                      agree
                                    </CButton>
                                    <CButton
                                      color="danger"
                                      size="lg"
                                      className="btn-ph-danger ms-2"
                                      onClick={() => {
                                        setShowRejectModal(true)
                                      }}
                                    >
                                      reject
                                    </CButton>
                                  </CTableDataCell>
                                </CTableRow>
                              ))
                          )}
                        </CTableBody>
                      </CTable>
                    </div>
                  </CTabPane>
                </CTabContent>
              </CCardBody>
            </CCard>
          </div>
        </CContainer>
      )}
      <InformationEdit
        instrumentData={instrumentData}
        history={history}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        fetchInstrument={fetchInstrument}
      />
      <ClientOnly>
        <CModal
          visible={showRejectModal}
          onClose={() => {
            setShowRejectModal(false)
            setRejectReason('')
          }}
          alignment="center"
          size="xl"
          backdrop="static"
        >
          <CModalHeader className="h3">Reject Calibration Report</CModalHeader>
          <CModalBody>
            <p className="p">
              Are you sure you want to reject this calibration report? This
              action cannot be undone.
            </p>
            <p className="p">Please provide a reason for rejection:</p>
            <CFormInput
              type="text"
              className="p"
              placeholder="Enter rejection reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              className="p me-3"
              onClick={() => {
                setShowRejectModal(false)
                setRejectReason('')
              }}
            >
              Cancel
            </CButton>
            <CButton
              color="danger"
              className="p"
              onClick={() => {
                handleReportReject(
                  history.find((r) => r.requires_report_approval === 'T')?.id
                )
              }}
            >
              Reject
            </CButton>
          </CModalFooter>
        </CModal>
      </ClientOnly>
    </>
  )
}
