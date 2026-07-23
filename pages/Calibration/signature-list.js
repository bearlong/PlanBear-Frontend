import { useEffect, useState, useContext } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useToast } from '@/hooks/useToast'
import { api } from '@/utils/api'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CContainer,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { calibrationService } from '@/services/Calibration/calibration.service'
import ClientOnly from '@/components/common/clientOnly'
import styles from '@/styles/calibration.module.scss'
import { AuthContext } from '@/context/AuthContext'
import usePermissionGuard from '@/hooks/usePermissionGuard'

export default function InstrumentDetailPage() {
  usePermissionGuard('Calibration_boss')
  const { user } = useContext(AuthContext)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [signatureDetail, setSignatureDetail] = useState([])
  const [signatureData, setSignatureData] = useState([])
  const [showDetail, setShowDetail] = useState(false)
  const [reviewMode, setReviewMode] = useState('view')
  const [rejectReason, setRejectReason] = useState('')
  const toast = useToast()

  const fetchSignature = async () => {
    setLoading(true)
    const query = {
      paginate: false,
      reportApproval: 'PENDING',
      factory: user?.factory || '',
    }
    const result = await calibrationService.getCalibrationList(query)
    if (result.status === 'error') {
      toast.error('Failed to fetch signature data.')
      setLoading(false)
      return
    }
    setSignatureData(result?.data?.enriched || [])
    setLoading(false)
  }

  const fetchSignatureDetail = async (id) => {
    setLoading(true)
    const result = await calibrationService.getSignatureFiles(id)
    if (result.status === 'error') {
      toast.error('Failed to fetch signature details.')
      setLoading(false)
      return
    }
    setLoading(false)
    console.log(result)
    setSignatureDetail(result?.data || {})
  }

  const formatDate = (dateString) => {
    const time = new Date(dateString)
    if (isNaN(time.getTime())) {
      return '-'
    }
    return time.toLocaleString()
  }

  const handleReportApproval = async (log_id) => {
    const result = await calibrationService.approveCalibrationReport(
      log_id,
      signatureDetail.calibration_id
    )
    if (result.status === 'error') {
      toast.error(result.message || 'Failed to approve report.')
      return
    }
    toast.success('Report approved successfully.')
    fetchSignature()
    setShowDetail(false)
    setReviewMode('view')
    setRejectReason('')
    // Refresh data after approval
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
      signatureDetail.calibration_id,
      rejectReason
    )
    if (result.status === 'error') {
      toast.error(result.message || 'Failed to approve report.')
      return
    }

    toast.success('Report approved successfully.')
    fetchSignature()
    // Refresh data after approval
    setShowDetail(false)
    setReviewMode('view')
    setRejectReason('')
  }

  useEffect(() => {
    if (!router.isReady) return
    if (!user) return

    fetchSignature()
  }, [router.isReady, router.query, user])
  return (
    <>
      <Head>
        <title>Signature List</title>
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
                    <h2 className={styles.title}>Document Signatures</h2>
                  </div>
                </div>
              </CCardHeader>
              <CCardBody className={styles.cardBody}>
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 h3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="text-muted">Sign Document's List</span>
                  </div>
                </div>
                <div className="border rounded-4 shadow-sm bg-white">
                  <CTable hover responsive align="middle" className="mb-0">
                    <CTableHead>
                      <CTableRow className="h5 text-center fw-bold">
                        <CTableHeaderCell scope="col" className="py-3">
                          Property No
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" className="py-3">
                          Category
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" className="py-3">
                          Name
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" className="py-3">
                          Class
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" className="py-3">
                          Cycle
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" className="py-3">
                          Dept
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" className="py-3">
                          Status
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" className="py-3">
                          Owner
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" className="py-3">
                          Factory
                        </CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {signatureData.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell
                            colSpan={9}
                            className="text-center py-4 p"
                          >
                            No pending approval documents found.
                          </CTableDataCell>
                        </CTableRow>
                      ) : (
                        signatureData.map((item) => (
                          <CTableRow key={item.id} className="text-center p">
                            <CTableDataCell>
                              <CButton
                                color="link"
                                onClick={() => {
                                  setReviewMode('view')
                                  setRejectReason('')
                                  setShowDetail(true)
                                  fetchSignatureDetail(item.id)
                                }}
                                className="p"
                              >
                                {item.property_no || '-'}
                              </CButton>
                            </CTableDataCell>
                            <CTableDataCell>
                              {item.instrument?.system || '-'}
                            </CTableDataCell>
                            <CTableDataCell>
                              {item.instrument?.instru_name || '-'}
                            </CTableDataCell>
                            <CTableDataCell>
                              {item.calibr_class || '-'}
                            </CTableDataCell>
                            <CTableDataCell>
                              {item.calibr_cycle
                                ? `${item.calibr_cycle} months`
                                : '-'}
                            </CTableDataCell>
                            <CTableDataCell>{item.dept || '-'}</CTableDataCell>
                            <CTableDataCell>
                              <CBadge
                                color={
                                  item.status === 'Usable'
                                    ? 'success'
                                    : item.status === 'Calibration'
                                    ? 'warning'
                                    : 'secondary'
                                }
                              >
                                {item.status || '-'}
                              </CBadge>
                            </CTableDataCell>
                            <CTableDataCell>{item.owner || '-'}</CTableDataCell>
                            <CTableDataCell>
                              {item.factory || '-'}
                            </CTableDataCell>
                          </CTableRow>
                        ))
                      )}
                    </CTableBody>
                  </CTable>
                </div>
              </CCardBody>
            </CCard>
          </div>
        </CContainer>
      )}
      <ClientOnly>
        <CModal
          visible={showDetail}
          onClose={() => {
            setShowDetail(false)
            setReviewMode('view')
            setRejectReason('')
          }}
          alignment="center"
          size="xl"
          backdrop="static"
        >
          <CModalHeader className="h3">Calibration Report</CModalHeader>
          <CModalBody>
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
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell className="ps-3">
                      {formatDate(signatureDetail.created_at) || '-'}
                    </CTableDataCell>
                    <CTableDataCell className="ps-3">
                      {signatureDetail.calibration_log_file?.length > 0 ? (
                        signatureDetail.calibration_log_file.map(
                          (file, index) => (
                            <div key={file.id || index}>
                              <button
                                className="btn btn-link p"
                                target="_blank"
                                onClick={() => {
                                  const filename = file.file_url

                                  const url =
                                    process.env.NEXT_PUBLIC_USE_MOCK === 'true'
                                      ? `/demo-files/calibration/${encodeURIComponent(
                                          filename
                                        )}`
                                      : api(
                                          `/data/files?filename=${encodeURIComponent(
                                            `calibration/${filename}`
                                          )}`
                                        )

                                  window.open(
                                    url,
                                    '_blank',
                                    'noopener,noreferrer'
                                  )
                                }}
                              >
                                {file.file_url || `Report ${index + 1}`}
                              </button>
                            </div>
                          )
                        )
                      ) : (
                        <span className="text-muted">No report file</span>
                      )}
                    </CTableDataCell>
                    <CTableDataCell></CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>
            {reviewMode === 'reject' && (
              <div className="mt-4">
                <p className="p mb-2">Please provide a reason for rejection:</p>
                <CFormInput
                  type="text"
                  className="p"
                  placeholder="Enter rejection reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              className="p me-3"
              onClick={() => {
                setShowDetail(false)
                setReviewMode('view')
                setRejectReason('')
              }}
            >
              Cancel
            </CButton>
            {reviewMode === 'view' ? (
              <>
                <CButton
                  color="primary"
                  size="lg"
                  className="btn-ph-primary me-3 p"
                  onClick={() => {
                    handleReportApproval(signatureDetail.id)
                  }}
                >
                  Agree
                </CButton>
                <CButton
                  color="danger"
                  size="lg"
                  className="btn-ph-danger p"
                  onClick={() => {
                    setReviewMode('reject')
                  }}
                >
                  Reject
                </CButton>
              </>
            ) : (
              <>
                <CButton
                  color="secondary"
                  className="p me-3"
                  onClick={() => {
                    setReviewMode('view')
                    setRejectReason('')
                  }}
                >
                  Back
                </CButton>
                <CButton
                  color="danger"
                  className="p"
                  onClick={() => {
                    handleReportReject(signatureDetail.id)
                  }}
                >
                  Submit Reject
                </CButton>
              </>
            )}
          </CModalFooter>
        </CModal>
      </ClientOnly>
    </>
  )
}
