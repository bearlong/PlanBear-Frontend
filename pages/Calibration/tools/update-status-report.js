import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CFormInput,
  CRow,
} from '@coreui/react'
import { FiArrowLeft, FiEdit3, FiPlus } from 'react-icons/fi'
import { FaArrowUpFromBracket, FaXmark } from 'react-icons/fa6'
import InstrumentTable from '@/components/calibration/instrumentTable'
import LogHistory from '@/components/calibration/logHistory'
import SelectModal from '@/components/calibration/selectModal'
import sharedStyles from '@/styles/calibration.module.scss'
import styles from '@/styles/calibration-tools.module.scss'
import { useToast } from '@/hooks/useToast'
import { calibrationService } from '@/services/Calibration/calibration.service'
import useFileManagement from '@/hooks/useFileManagement'
import { api } from '@/utils/api'
import Swal from 'sweetalert2'
import usePermissionGuard from '@/hooks/usePermissionGuard'

const fileIcons = {
  pdf: '/img/pdf.png',
  doc: '/img/word.png',
  docx: '/img/word.png',
  txt: '/img/txt.png',
  xls: '/img/excel.png',
  xlsx: '/img/excel.png',
  csv: '/img/excel.png',
  ppt: '/img/ppt.png',
  pptx: '/img/ppt.png',
  jpg: '/img/jpg.png',
  jpeg: '/img/jpg.png',
  png: '/img/jpg.png',
  zip: '/img/zip.png',
  rar: '/img/zip.png',
  default: '/img/other.png',
}

const truncateFileName = (name, length = 24) => {
  if (!name) return ''
  return name.length > length ? `${name.slice(0, length)}...` : name
}

const transformFiles = (files = []) =>
  files.map((file) => {
    const cleaned = (file.file_type || '').replace('.', '')
    return {
      id: file.id,
      file_url: file.file_url,
      file: { name: file.file_url },
      icon: fileIcons[cleaned] || fileIcons.default,
      existing: true,
    }
  })

export default function UpdateStatusReportPage() {
  usePermissionGuard('Calibration-TPE') // 這個頁面需要 Calibration-TPE 權限
  const router = useRouter()
  const toast = useToast()
  const { handleFileUpload, handleDeleteFile, handlePreview } =
    useFileManagement()

  const [showModal, setShowModal] = useState(false)
  const [selectedInstrument, setSelectedInstrument] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedLog, setSelectedLog] = useState(null)
  const [editForm, setEditForm] = useState({
    due_date: '',
    change_date: '',
    AttachFile: [],
  })
  const [saving, setSaving] = useState(false)

  const existingFileIds = useMemo(
    () =>
      editForm.AttachFile.filter((file) => file.existing).map(
        (file) => file.id
      ),
    [editForm.AttachFile]
  )

  const formatDate = (value) => {
    if (!value) return '-'
    return value.toString().slice(0, 10)
  }

  const fetchHistory = async (instrumentId) => {
    const result = await calibrationService.getHistoryById(instrumentId)
    if (result.status === 'error') {
      toast.error(result.message || 'Failed to fetch history data.')
      setHistory([])
      return
    }
    const sortData = result.data.sort((a, b) => a.id - b.id)
    setHistory(sortData || [])
  }

  const handleSelectInstrument = async (event, instrument) => {
    event.preventDefault()
    setSelectedInstrument(instrument)
    setSelectedLog(null)
    setEditForm({
      due_date: '',
      change_date: '',
      AttachFile: [],
    })
    setShowModal(false)
    await fetchHistory(instrument.id)
  }

  const handleSelectLog = (record) => {
    setSelectedLog(record)
    setEditForm({
      due_date: record.due_date || '',
      change_date: record.change_date || '',
      AttachFile: transformFiles(record.calibration_log_file),
    })
  }

  const handleConfirm = async (record) => {
    const result = await Swal.fire({
      title: 'Confirm Delete?',
      html: `
            <div style="text-align:left;font-size:16px;">
            Deleting this record may impact calibration history,
  due date calculations, status tracking,
  and audit traceability.<br/><br/>
  
              <div><strong>Due Date</strong>: ${formatDate(
                record.due_date
              )}</div>
              <div style="margin-top:8px;"><strong>Calibration Date</strong>: ${formatDate(
                record.change_date
              )}</div>
              <div style="margin-top:8px;"><strong>Status</strong>: ${
                record.status
              }</div>
             </div>
  
            </div>
          `,
      icon: 'warning',
      confirmButtonText: 'Confirm',
      confirmButtonColor: '#dc3545',
      showCancelButton: true,
      customClass: {
        popup: 'h3',
        title: 'h3 text-danger',
        htmlContainer: 'p text-body-secondary text-center',
      },
    })

    if (!result.isConfirmed) return

    return true
  }

  const handleDeleteLog = async (record) => {
    const confirmed = await handleConfirm(record)
    if (!confirmed) return

    const result = await calibrationService.deleteCalibrationLog(record.id)
    if (result.status === 'success') {
      Swal.fire({
        title: 'Deleted!',
        text: 'The calibration log has been deleted.',
        icon: 'success',
        confirmButtonText: 'OK',
      })
      await fetchHistory(selectedInstrument.id)
    } else {
      Swal.fire({
        title: 'Error!',
        text: result.message || 'Failed to delete the calibration log.',
        icon: 'error',
        confirmButtonText: 'OK',
      })
    }
  }

  const handleAddFiles = (event) => {
    if (!selectedLog) return
    const next = handleFileUpload(
      selectedLog.id,
      [{ id: selectedLog.id, AttachFile: editForm.AttachFile }],
      event
    )
    setEditForm((prev) => ({
      ...prev,
      AttachFile: next[0]?.AttachFile || [],
    }))
  }

  const handleRemoveFile = (file) => {
    if (!selectedLog) return
    const next = handleDeleteFile(
      selectedLog.id,
      [{ id: selectedLog.id, AttachFile: editForm.AttachFile }],
      file.file || file
    )
    setEditForm((prev) => ({
      ...prev,
      AttachFile: next[0]?.AttachFile || [],
    }))
  }

  const handlePreviewFile = (report) => {
    if (report.preview) {
      handlePreview(report.preview)
      return
    }
    const filename = encodeURIComponent(report.file_url || report.file?.name)
    const url = api(`/data/files?filename=calibration/${filename}`)
    window.open(url, '_blank')
  }

  const handleSave = async () => {
    if (!selectedInstrument || !selectedLog) {
      toast.error('Please select an instrument and a history record first.')
      return
    }

    setSaving(true)
    const result = await calibrationService.updateHistoryLog(selectedLog.id, {
      due_date: editForm.due_date,
      change_date: editForm.change_date,
      AttachFile: editForm.AttachFile,
      keepFileIds: existingFileIds,
    })
    setSaving(false)

    if (result.status === 'error') {
      toast.error(result.message || 'Failed to update history record.')
      return
    }

    toast.success('History record updated successfully.')
    await fetchHistory(selectedInstrument.id)
  }

  useEffect(() => {
    if (!history.length) {
      setSelectedLog(null)
      setEditForm({
        due_date: '',
        change_date: '',
        AttachFile: [],
      })
      return
    }

    if (!selectedLog) return

    const matched = history.find((record) => record.id === selectedLog.id)
    if (!matched) {
      setSelectedLog(null)
      return
    }

    setSelectedLog(matched)
    setEditForm({
      due_date: matched.due_date || '',
      change_date: matched.change_date || matched.created_at || '',
      AttachFile: transformFiles(matched.calibration_log_file),
    })
  }, [history])

  return (
    <>
      <Head>
        <title>Update Status Report</title>
      </Head>
      <CContainer fluid className={sharedStyles.pageShell}>
        <div className={sharedStyles.cardShell}>
          <CCard className={sharedStyles.card}>
            <CCardHeader className={sharedStyles.cardHeader}>
              <div>
                <p className={sharedStyles.eyebrow}>Calibration</p>
                <h2 className={sharedStyles.title}>Update Status Report</h2>
                <p className={sharedStyles.subTitle}>
                  Select an instrument, choose a history record, and update its
                  due date, Calibration Date, and report files.
                </p>
              </div>
            </CCardHeader>
            <CCardBody className={sharedStyles.cardBody}>
              <CButton
                color="secondary"
                variant="outline"
                className="d-inline-flex align-items-center mb-4"
                size="lg"
                onClick={() => router.push('/Calibration/tools')}
              >
                <FiArrowLeft size={16} />
                Back to Select Tools
              </CButton>

              <CRow className="g-4">
                <CCol xs={12}>
                  <CCard className={styles.sectionCard}>
                    <CCardBody className="p-4">
                      <div className={styles.heroBlock}>
                        <div className={styles.heroIcon}>
                          <FiEdit3 size={22} />
                        </div>
                        <div>
                          <h3 className="h4 mb-2">
                            Select an instrument to load its log history.
                          </h3>
                          <div className="text-body-secondary p">
                            {selectedInstrument
                              ? `${selectedInstrument.property_no} / ${
                                  selectedInstrument.instrument?.instru_name ||
                                  '-'
                                }`
                              : 'No instrument selected yet.'}
                          </div>
                        </div>
                      </div>

                      <CButton
                        className="btn-ph-primary d-inline-flex align-items-center gap-2 mt-4"
                        size="lg"
                        onClick={() => setShowModal(true)}
                      >
                        <FiPlus size={16} />
                        Select Instrument
                      </CButton>
                    </CCardBody>
                  </CCard>
                </CCol>

                {selectedInstrument && (
                  <>
                    <CCol xs={12} xl={8}>
                      <CCard className={styles.sectionCard}>
                        <CCardHeader className={styles.sectionHeader}>
                          <div className="h4 m-0">Log History</div>
                        </CCardHeader>
                        <CCardBody className="p-4">
                          <LogHistory
                            history={history}
                            selectable
                            selectedLogId={selectedLog?.id}
                            onSelect={handleSelectLog}
                            onDelete={handleDeleteLog}
                          />
                        </CCardBody>
                      </CCard>
                    </CCol>
                    <CCol xs={12} xl={4}>
                      <CCard className={styles.sectionCard}>
                        <CCardHeader className={styles.sectionHeader}>
                          <div className="h4 m-0">Edit Record</div>
                        </CCardHeader>
                        <CCardBody className="p-4">
                          {selectedLog ? (
                            <>
                              <div className="mb-3">
                                <span className="p d-block mb-2">Due Date</span>
                                <CFormInput
                                  type="date"
                                  size="lg"
                                  value={editForm.due_date}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      due_date: event.target.value,
                                    }))
                                  }
                                />
                              </div>
                              {editForm.change_date && (
                                <div className="mb-3">
                                  <span className="p d-block mb-2">
                                    Calibration Date
                                  </span>
                                  <CFormInput
                                    type="date"
                                    size="lg"
                                    value={editForm.change_date}
                                    onChange={(event) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        change_date: event.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              )}
                              <div className="mb-3">
                                <div className="p mb-2">Report File</div>
                                <CButton
                                  color="info"
                                  className="p-0 btn-ph-primary align-self-center"
                                  size="lg"
                                >
                                  <label
                                    htmlFor="update-history-report-file"
                                    className="py-2 px-3 center-flex m-0 h5"
                                  >
                                    <FaArrowUpFromBracket
                                      size={14}
                                      className="p me-2"
                                    />
                                    Upload Report
                                  </label>
                                </CButton>
                                <CFormInput
                                  type="file"
                                  className="d-none"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.zip,.rar"
                                  id="update-history-report-file"
                                  onChange={handleAddFiles}
                                />
                              </div>
                              <div className="d-flex flex-column gap-2 mb-4">
                                {editForm.AttachFile.length === 0 ? (
                                  <span className="text-muted p">
                                    No report file.
                                  </span>
                                ) : (
                                  editForm.AttachFile.map((report, index) => (
                                    <div
                                      key={
                                        report.id || report.file?.name || index
                                      }
                                      className="d-flex align-items-center gap-2"
                                    >
                                      <button
                                        className="center-flex border border-2 border-dark p-2 rounded h5 fw-bold m-0"
                                        onClick={(event) => {
                                          event.preventDefault()
                                          handlePreviewFile(report)
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: 20,
                                            height: 20,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: 8,
                                          }}
                                        >
                                          <Image
                                            src={report.icon}
                                            alt="file-icon"
                                            width={20}
                                            height={20}
                                          />
                                        </div>
                                        {truncateFileName(
                                          report.file_url ?? report.file?.name
                                        )}
                                      </button>
                                      <FaXmark
                                        size={16}
                                        className="text-danger"
                                        onClick={(event) => {
                                          event.preventDefault()
                                          handleRemoveFile(report)
                                        }}
                                        cursor="pointer"
                                      />
                                    </div>
                                  ))
                                )}
                              </div>
                              <div className="d-flex justify-content-end">
                                <CButton
                                  className="btn-ph-primary"
                                  size="lg"
                                  onClick={handleSave}
                                  disabled={saving}
                                >
                                  {saving ? 'Saving...' : 'Save Changes'}
                                </CButton>
                              </div>
                            </>
                          ) : (
                            <div className="text-muted p">
                              Select one history row from the left table.
                            </div>
                          )}
                        </CCardBody>
                      </CCard>
                    </CCol>
                  </>
                )}
              </CRow>
            </CCardBody>
          </CCard>
        </div>
      </CContainer>

      <SelectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Select Instrument"
        footer={
          <CButton
            color="secondary"
            variant="ghost"
            size="lg"
            type="button"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </CButton>
        }
      >
        <InstrumentTable
          variant="select"
          onSelect={(event, instrument) =>
            handleSelectInstrument(event, instrument)
          }
        />
      </SelectModal>
    </>
  )
}
