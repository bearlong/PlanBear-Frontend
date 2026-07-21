import React, { useMemo, useState, useEffect } from 'react'
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
import { instrumentRepairService } from '@/services/Calibration/instrumentRepair.service'
import { FiArrowLeft, FiCheck, FiSave } from 'react-icons/fi'
import useFileManagement from '@/hooks/useFileManagement'
import { useToast } from '@/hooks/useToast'
import InstrumentRepairReport from '@/components/calibration/instrumentRepairReport'
import styles from '@/styles/calibration.module.scss'
import useUserPermissions from '@/hooks/useUserPermissions'

const DetailField = ({ label, value }) => (
  <div className="border rounded-4 p-3 h-100 bg-white">
    <p className="text-muted small mb-1">{label}</p>
    <div className="fw-semibold">{value || '-'}</div>
  </div>
)

export default function InstrumentRepairDetailPage() {
  const [repairDetails, setRepairDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [repairStatusForms, setRepairStatusForms] = useState([])
  const [errors, setErrors] = useState({})
  const [submittingType, setSubmittingType] = useState('')
  const [deleteFileId, setDeleteFileId] = useState([])
  const { hasModuleAccess, handlePermissionGuard } = useUserPermissions()

  const { handleFileUpload, handleDeleteFile } = useFileManagement()
  const toast = useToast()

  const fileIcons = {
    // 文書類
    pdf: '/img/pdf.png',
    doc: '/img/word.png',
    docx: '/img/word.png',
    txt: '/img/txt.png',

    // 試算表類
    xls: '/img/excel.png',
    xlsx: '/img/excel.png',
    csv: '/img/excel.png',

    // 簡報類
    ppt: '/img/ppt.png',
    pptx: '/img/ppt.png',

    // 圖片類
    jpg: '/img/jpg.png',
    jpeg: '/img/jpg.png',
    png: '/img/jpg.png',

    // 壓縮檔案類
    zip: '/img/zip.png',
    rar: '/img/zip.png',

    // 預設
    default: '/img/other.png',
  }

  function transformFiles(files) {
    return files.map((file) => {
      const cleaned = file.file_type.replace('.', '')
      return {
        id: file.id,
        file: { name: file.file_url },
        icon: fileIcons[cleaned] || fileIcons.default,
      }
    })
  }

  const fetchRepairDetails = async (applyNo) => {
    setLoading(true)
    setFetchError('')
    try {
      const result = await instrumentRepairService.getRepairDetails(applyNo)
      console.log(result)
      const data = result?.data || null

      setRepairDetails(data)
      setRepairStatusForms(
        data?.gauge_instrument_repair_item?.map((item, index) => ({
          id: item.id,
          property_no: item.property_no,
          instru_name: item.instru_name,
          repair_order_number: item.repair_order_number || '',
          repair_date: item.repair_date?.slice(0, 10) || '',
          revised_date: item.revised_date?.slice(0, 10) || '',
          memo: item.memo || '',
          AttachFile: transformFiles(
            item.gauge_instrument_repair_item_file || []
          ),
        })) || []
      )
    } catch (error) {
      console.error('Failed to fetch repair details:', error)
      setRepairDetails(null)
      setRepairStatusForms([])
      setFetchError('Failed to fetch repair details.')
    } finally {
      setLoading(false)
    }
  }

  const router = useRouter()
  const { applyNo } = router.query

  const detail = useMemo(() => {
    if (!applyNo || Array.isArray(applyNo)) {
      return null
    }

    if (!repairDetails) {
      return null
    }

    return {
      id: repairDetails.id,
      applyNo: repairDetails.apply_no,
      applicant: repairDetails.applicant_info || repairDetails.applicant,
      requester: repairDetails.requester_info || repairDetails.requester,
      applyDate: repairDetails.created_at?.slice(0, 10) || '',
      demandUnit: repairDetails.requester_dept,
      status: repairDetails.status,
      instruments:
        repairDetails.gauge_instrument_repair_item?.map((item) => ({
          id: item.id,
          property_no: item.property_no,
          instru_name: item.instru_name,
          model: item.model,
          faultDescription: item.fault_condition_description,
        })) || [],
    }
  }, [applyNo, repairDetails])

  const isFinished = repairDetails?.status === 'finished'

  useEffect(() => {
    if (applyNo && !Array.isArray(applyNo)) {
      fetchRepairDetails(applyNo)
    }
  }, [applyNo])

  const handleRepairStatusChange = (rowId, field, value) => {
    setRepairStatusForms((prev) =>
      prev.map((item) =>
        item.id === rowId ? { ...item, [field]: value } : item
      )
    )
    setErrors((prev) => {
      const next = { ...prev }
      if (next[rowId]?.[field]) {
        next[rowId] = { ...next[rowId], [field]: '' }
      }
      return next
    })
  }

  const handleUploadFileChange = (target, e) => {
    const targetItemArr = [
      {
        id: target.id,
        AttachFile:
          repairStatusForms.find((item) => item.id === target.id)?.AttachFile ||
          [],
      },
    ]
    const newItem = handleFileUpload(target.id, targetItemArr, e)

    setRepairStatusForms((prev) =>
      prev.map((item) =>
        item.id === target.id
          ? {
              ...item,
              AttachFile:
                newItem.find((item) => item.id === target.id)?.AttachFile || [],
            }
          : item
      )
    )
  }

  const handleDeleteReport = (target, report) => {
    const targetItemArr = [
      {
        id: target.id,
        AttachFile: target.AttachFile || [],
      },
    ]

    const newItem = handleDeleteFile(target.id, targetItemArr, report.file)
    if (!report.preview) {
      const newDeletedFile = [report.id, report.file.name]
      setDeleteFileId([...deleteFileId, newDeletedFile])
      console.log(deleteFileId)
    }
    setRepairStatusForms((prev) =>
      prev.map((item) =>
        item.id === target.id
          ? {
              ...item,
              AttachFile:
                newItem.find((item) => item.id === target.id)?.AttachFile || [],
            }
          : item
      )
    )
  }

  const handleClearReports = (target) => {
    const deletedFileIds = target.AttachFile.map((file) => [
      file.id,
      file.file.name,
    ]).filter(Boolean)

    setDeleteFileId([...deleteFileId, ...deletedFileIds])

    setRepairStatusForms((prev) =>
      prev.map((item) =>
        item.id === target.id
          ? {
              ...item,
              AttachFile: [],
            }
          : item
      )
    )
  }

  const validateForm = () => {
    const nextErrors = {}

    repairStatusForms.forEach((item) => {
      const itemErrors = {}

      if (!item.repair_order_number?.trim()) {
        itemErrors.repair_order_number = 'Repair No. is required.'
      }

      if (!item.repair_date) {
        itemErrors.repair_date = 'Repair Date is required.'
      }

      if (!item.revised_date) {
        itemErrors.revised_date = 'Revised Date is required.'
      }

      if (!item.memo?.trim()) {
        itemErrors.memo = 'Repair Status Description is required.'
      }

      if (Object.keys(itemErrors).length > 0) {
        nextErrors[item.id] = itemErrors
      }
    })

    return nextErrors
  }

  const handleSubmit = async (type) => {
    if (!detail) return

    if (type === 'finish') {
      const nextErrors = validateForm()
      setErrors(nextErrors)

      if (Object.keys(nextErrors).length > 0) {
        toast.error(
          'Please complete all required repair fields before finishing.'
        )
        return
      }
    } else {
      setErrors({})
    }

    setSubmittingType(type)

    try {
      const payload = {
        apply_no: detail.id,
        status: type === 'finish' ? 'finished' : 'repairing',
        gauge_instrument_repair_item: repairStatusForms.map((item) => ({
          id: item.id,
          repair_order_number: item.repair_order_number,
          repair_date: item.repair_date,
          revised_date: item.revised_date,
          memo: item.memo,
          AttachFile: item.AttachFile || [],
        })),
        delete_file_id: deleteFileId,
      }
      console.log(payload)
      const result = await instrumentRepairService.updateRepairStatus(payload)
      if (result.status === 'error') {
        console.error('Failed to update repair status:', result)
        toast.error(result.message || 'Failed to update repair status.')
        return
      }
      if (type === 'finish') {
        setRepairDetails((prev) => prev && { ...prev, status: 'finished' })
      }
      console.log('Repair status submit payload:', payload)
      toast.success(
        type === 'finish'
          ? 'Repair form passed validation and is ready to finish.'
          : 'Repair draft is ready to save.'
      )
    } catch (error) {
      console.error('Failed to submit repair status:', error)
      toast.error('Failed to submit repair status.')
    } finally {
      setSubmittingType('')
    }
  }

  return (
    <>
      <Head>
        <title>Gauge Instrument Repair Application Detail</title>
      </Head>

      <CContainer fluid className={styles.pageShell}>
        <div className={styles.cardShell}>
          <CCard className={styles.card}>
            <CCardHeader className={styles.cardHeader}>
              <div className="d-flex flex-column gap-2">
                <div>
                  <p className={styles.eyebrow}>Calibration</p>
                  <h2 className={styles.title}>
                    Repair Requests Application Detail
                  </h2>
                  <p className={styles.subTitle}>
                    Apply No:{' '}
                    {Array.isArray(applyNo)
                      ? applyNo[0]
                      : applyNo || 'Loading...'}
                  </p>
                </div>
              </div>
            </CCardHeader>

            <CCardBody className={styles.cardBody}>
              {loading ? (
                <div className="border rounded-4 bg-white p-5 text-center text-muted">
                  Loading repair application details...
                </div>
              ) : detail ? (
                <>
                  <CCard className="border-0 shadow-sm mb-4">
                    <CCardHeader className="bg-white border-bottom-0 pt-4 px-4">
                      <div className="d-flex">
                        <h5 className="mb-0">Application Information</h5>{' '}
                        <CBadge
                          className="h6 ms-3"
                          color={
                            detail.status === 'finished'
                              ? 'secondary'
                              : 'success'
                          }
                        >
                          {detail.status}
                        </CBadge>
                      </div>
                    </CCardHeader>
                    <CCardBody className="pt-2 px-4 pb-4">
                      <CRow className="g-3 p">
                        <CCol md={6} xl={3}>
                          <DetailField
                            label="Applicant"
                            value={detail.applicant}
                          />
                        </CCol>
                        <CCol md={6} xl={3}>
                          <DetailField
                            label="Requester"
                            value={detail.requester}
                          />
                        </CCol>
                        <CCol md={6} xl={3}>
                          <DetailField
                            label="Apply Date"
                            value={detail.applyDate}
                          />
                        </CCol>
                        <CCol md={6} xl={3}>
                          <DetailField
                            label="Demand Unit"
                            value={detail.demandUnit}
                          />
                        </CCol>
                      </CRow>
                    </CCardBody>
                  </CCard>

                  <CCard className="border-0 shadow-sm">
                    <CCardHeader className="bg-white border-bottom-0 pt-4 px-4">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <h5 className="mb-0 p">Instrument List</h5>
                        <span className="text-muted small p">
                          {detail.instruments.length} item
                          {detail.instruments.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </CCardHeader>
                    <CCardBody className="pt-2 px-4 pb-4">
                      <div className="border rounded-4 shadow-sm bg-white overflow-hidden">
                        <CTable
                          hover
                          responsive
                          align="middle"
                          className="mb-0"
                        >
                          <CTableHead>
                            <CTableRow className="text-center align-middle border-bottom border-2">
                              <CTableHeaderCell className="py-3 px-3 text-uppercase small fw-bold text-secondary bg-light h5">
                                Property No
                              </CTableHeaderCell>
                              <CTableHeaderCell className="py-3 px-3 text-uppercase small fw-bold text-secondary bg-light h5">
                                Instrument Name
                              </CTableHeaderCell>
                              <CTableHeaderCell className="py-3 px-3 text-uppercase small fw-bold text-secondary bg-light h5">
                                Model
                              </CTableHeaderCell>
                              <CTableHeaderCell className="py-3 px-4 text-uppercase small fw-bold text-dark bg-warning bg-opacity-25 border-start h5">
                                Fault Condition Description
                              </CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {detail.instruments.map((item) => (
                              <CTableRow
                                key={
                                  item.id ||
                                  `${detail.applyNo}-${item.property_no}`
                                }
                              >
                                <CTableDataCell className="text-center fw-semibold p-3 align-middle p fw-normal">
                                  {item.property_no}
                                </CTableDataCell>
                                <CTableDataCell className="text-center p-3 fw-normal align-middle p fw-normal">
                                  {item.instru_name}
                                </CTableDataCell>
                                <CTableDataCell className="text-center p-3 fw-normal align-middle p fw-normal">
                                  {item.model}
                                </CTableDataCell>
                                <CTableDataCell className="p-3 border-start bg-warning bg-opacity-10">
                                  <div className="lh-base text-body p fw-normal align-middle text-center">
                                    {item.faultDescription || '-'}
                                  </div>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                      </div>
                    </CCardBody>
                  </CCard>

                  {hasModuleAccess('Calibration') && (
                    <InstrumentRepairReport
                      data={{
                        repairStatusForms: repairStatusForms,
                        errors: errors,
                        isFinished: isFinished,
                      }}
                      actions={{
                        onClearReports: handleClearReports,
                        onUploadReports: handleUploadFileChange,
                        onDeleteReports: handleDeleteReport,
                        onRepairStatusChange: handleRepairStatusChange,
                      }}
                    />
                  )}
                  <div className="d-flex flex-wrap justify-content-end gap-2 mt-4">
                    <CButton
                      color="secondary"
                      variant="outline"
                      className="d-flex align-items-center gap-2"
                      onClick={() =>
                        router.push('/Calibration/instrument-repair/query')
                      }
                    >
                      <FiArrowLeft />
                      Back to Query
                    </CButton>

                    {hasModuleAccess('Calibration') && (
                      <>
                        <CButton
                          color="primary"
                          variant="outline"
                          className="btn-ph-outline-primary d-flex align-items-center gap-2"
                          onClick={() => handleSubmit('draft')}
                          disabled={isFinished || submittingType !== ''}
                        >
                          <FiSave />
                          {submittingType === 'draft'
                            ? 'Saving...'
                            : 'Save Draft'}
                        </CButton>
                        <CButton
                          color="success"
                          className="d-flex align-items-center gap-2 text-white"
                          onClick={() => handleSubmit('finish')}
                          disabled={isFinished || submittingType !== ''}
                        >
                          <FiCheck />
                          {submittingType === 'finish'
                            ? 'Finishing...'
                            : 'Finish Repair'}
                        </CButton>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="border rounded-4 bg-white p-5 text-center text-muted">
                  {fetchError ||
                    `No repair application found for apply no ${
                      applyNo || '-'
                    }.`}
                </div>
              )}
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
    </>
  )
}
