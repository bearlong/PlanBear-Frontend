import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/useToast'
import { api } from '@/utils/api'
import { FaArrowUpFromBracket, FaXmark } from 'react-icons/fa6'
import Image from 'next/image'
import { CButton, CFormInput } from '@coreui/react'
import useFileManagement from '@/hooks/useFileManagement'
import { calibrationService } from '@/services/Calibration/calibration.service'
import styles from '@/styles/calibration.module.scss'

const formatDateInput = (value) => {
  if (!value) return ''
  return String(value).slice(0, 10)
}

const getTodayDate = () => new Date().toISOString().slice(0, 10)

const calculateDueDateFromToday = (months) => {
  const result = new Date()
  const cycleMonths = Number(months) || 0

  result.setMonth(result.getMonth() + cycleMonths)
  result.setDate(result.getDate() - 1)

  return result.toISOString().slice(0, 10)
}

export default function UpdateReport({
  instrumentData,
  history,
  fetchInstrument,
}) {
  const [reportForm, setReportForm] = useState({
    change_date: '',
    due_date: '',
    AttachFile: [],
  })
  const [rejectReason, setRejectReason] = useState('')
  const toast = useToast()
  const { handleFileUpload, handleDeleteFile, handlePreview } =
    useFileManagement()

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

  const reportApprovalStatus = useMemo(() => {
    if (!history?.length) return 'NONE'

    for (const record of history) {
      if (record.requires_report_approval === 'R') {
        return 'REJECTED'
      }
      if (record.requires_report_approval === 'T') {
        return 'PENDING'
      }
    }

    return 'NONE'
  }, [history])

  const targetReportLog = useMemo(() => {
    if (!history?.length) return null

    return (
      history.find(
        (record) =>
          record.requires_report_approval === 'R' ||
          record.requires_report_approval === 'T'
      ) || null
    )
  }, [history])

  const existingFileIds = useMemo(
    () =>
      reportForm.AttachFile.filter((file) => file.existing).map(
        (file) => file.id
      ),
    [reportForm.AttachFile]
  )

  function truncateFileName(name, length = 20) {
    if (!name) return ''
    return name.length > length ? `${name.slice(0, length)}...` : name
  }

  const handleAddReport = (e) => {
    const targetItemArr = [
      {
        id: instrumentData.id,
        AttachFile: reportForm.AttachFile || [],
        change_date: reportForm.change_date || '',
      },
    ]
    const newItem = handleFileUpload(instrumentData.id, targetItemArr, e)
    setReportForm((prev) => ({
      ...prev,
      AttachFile:
        newItem.find((item) => item.id === instrumentData.id)?.AttachFile || [],
    }))
  }

  const handleDeleteReport = (file) => {
    const targetItemArr = [
      {
        id: instrumentData.id,
        AttachFile: reportForm.AttachFile || [],
        change_date: reportForm.change_date || '',
      },
    ]

    const newItem = handleDeleteFile(instrumentData.id, targetItemArr, file)
    setReportForm((prev) => ({
      ...prev,
      AttachFile:
        newItem.find((item) => item.id === instrumentData.id)?.AttachFile || [],
    }))
  }

  const handleSubmitReport = async () => {
    if (
      !reportForm.change_date ||
      !reportForm.AttachFile ||
      reportForm.AttachFile.length === 0
    ) {
      toast.error(
        'Please provide a calibration date and at least one report file before submitting.'
      )
      return
    }

    const payload = {
      id: instrumentData.id,
      AttachFile: reportForm.AttachFile,
      change_date: reportForm.change_date,
      due_date: reportForm.due_date,
      status: 'Calibration',
      keepFileIds: existingFileIds,
    }
    const result = await calibrationService.addLogWithReport(payload)

    if (result.status === 'error') {
      toast.error(result.message || 'Failed to update instrument.')
      return
    }

    toast.success('Instrument updated successfully.')
    fetchInstrument(instrumentData.id) // 重新獲取儀器數據
    setReportForm({
      change_date: '',
      due_date: '',
      AttachFile: [],
    })
  }

  function transformFiles(files = []) {
    return files.map((file) => {
      const cleaned = (file.file_type || '').replace('.', '')
      return {
        id: file.id,
        file_url: file.file_url,
        file: { name: file.file_url },
        icon: fileIcons[cleaned] || fileIcons.default,
        existing: true,
      }
    })
  }

  useEffect(() => {
    const lastRecord = history?.[history?.length - 1]
    const isCalibrationStatus = instrumentData.status === 'Calibration'
    let changeDate =
      formatDateInput(lastRecord?.due_date) ||
      formatDateInput(instrumentData.due_date) ||
      ''
    let dueDate = ''
    let attachFiles = []
    let rejectReasonText = ''

    // const updatedFilesData = transformFiles(
    //   targetReportLog.calibration_log_file
    // )

    if (targetReportLog) {
      changeDate = formatDateInput(targetReportLog.change_date) || changeDate
      dueDate = formatDateInput(targetReportLog.due_date) || dueDate
      attachFiles = transformFiles(targetReportLog.calibration_log_file)
      rejectReasonText = targetReportLog.remark || ''
    } else if (isCalibrationStatus) {
      changeDate = getTodayDate()
      dueDate = calculateDueDateFromToday(instrumentData.calibr_cycle)
    }

    setRejectReason(rejectReasonText)
    setReportForm((prev) => ({
      ...prev,
      change_date: changeDate,
      due_date: dueDate,
      AttachFile: attachFiles,
    }))
  }, [
    history,
    targetReportLog,
    instrumentData.calibr_cycle,
    instrumentData.due_date,
    instrumentData.status,
  ])

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3 p">
        <div className="text-muted">
          Upload calibration reports and Update calibration date.
        </div>
      </div>
      {reportApprovalStatus === 'REJECTED' && (
        <span className="text-danger p mb-3">
          REJECTED REASON: {`${rejectReason}`}
        </span>
      )}
      <div className="mb-3">
        <span className="p">Change Plan Calibration Date</span>
        <CFormInput
          type="date"
          className="p w-auto"
          value={reportForm.change_date}
          onChange={(e) =>
            setReportForm((prev) => ({
              ...prev,
              change_date: e.target.value,
            }))
          }
          disabled={reportApprovalStatus === 'PENDING'}
        />
      </div>
      {instrumentData.status === 'Calibration' && (
        <div className="mb-3">
          <span className="p">New Plan Calibration Date</span>
          <CFormInput
            type="date"
            className="p w-auto"
            value={reportForm.due_date}
            onChange={(e) =>
              setReportForm((prev) => ({
                ...prev,
                due_date: e.target.value,
              }))
            }
            disabled={reportApprovalStatus === 'PENDING'}
          />
        </div>
      )}
      <div className="d-flex justify-content-start align-items-center gap-3 mb-3">
        <CButton
          color="info"
          className="p-0 btn-ph-primary align-self-center"
          size="lg"
          disabled={reportApprovalStatus === 'PENDING'}
        >
          <label
            htmlFor="file-uploadAP"
            className="py-2 px-3 center-flex  m-0 h5"
          >
            <FaArrowUpFromBracket size={14} className="p me-2" /> Upload Report
          </label>
        </CButton>
        <CFormInput
          type="file"
          className="d-none"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.zip,.rar"
          id="file-uploadAP"
          onChange={(e) => {
            handleAddReport(e)
          }}
        />
        {reportForm.AttachFile.length === 0 ? (
          <span className="text-muted p">No reports uploaded yet.</span>
        ) : (
          reportForm.AttachFile.map((report, index) => (
            <div className="d-flex align-items-center" key={index}>
              <button
                className="center-flex border border-2 border-dark p-2 rounded h5 fw-bold m-0"
                onClick={(e) => {
                  e.preventDefault()
                  if (report.preview) {
                    handlePreview(report.preview)
                  } else {
                    const filename = report.file_url

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

                    window.open(url, '_blank', 'noopener,noreferrer')
                  }
                }}
              >
                <div className={styles.imgbox}>
                  <Image
                    src={report.icon}
                    alt="file-icon"
                    width={20}
                    height={20}
                  />
                </div>
                {truncateFileName(report.file_url ?? report.file?.name)}
              </button>
              {reportApprovalStatus !== 'PENDING' && (
                <FaXmark
                  size={16}
                  className="text-danger"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteReport(report.file)
                  }}
                  cursor="pointer"
                />
              )}
            </div>
          ))
        )}
      </div>
      <div className="d-flex justify-content-start align-items-center gap-3">
        <CButton
          color="primary"
          size="lg"
          variant="outline"
          className="btn-ph-outline-primary h5"
          onClick={() => handleSubmitReport()}
          disabled={reportApprovalStatus === 'PENDING'}
        >
          Save Changes
        </CButton>
        {reportApprovalStatus === 'PENDING' && (
          <span className="text-danger p ms-3">Pending approval</span>
        )}
        {reportApprovalStatus === 'REJECTED' && (
          <span className="text-danger p ms-3">Rejected for changes</span>
        )}
      </div>
    </>
  )
}
