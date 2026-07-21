import { useContext, useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react'
import { FiRefreshCw, FiSearch } from 'react-icons/fi'
import { AuthContext } from '@/context/AuthContext'
import { useToast } from '@/hooks/useToast'
import { calibrationService } from '@/services/Calibration/calibration.service'
import sharedStyles from '@/styles/calibration.module.scss'
import styles from '@/styles/report.module.scss'
import ReportTable from '@/components/calibration/report/reportTable'
import usePermissionGuard from '@/hooks/usePermissionGuard'

const REPORT_TYPE_OPTIONS = [
  { label: 'Calibration Date', value: 'change_date' },
  { label: 'Estimate Date', value: 'due_date' },
]

const CALIBRATION_CLASS_OPTIONS = [
  { label: 'ALL', value: '' },
  { label: 'Internal Calibration', value: 'Internal Calibration' },
  { label: 'External Calibration', value: 'External Calibration' },
]

const hasCalibrationLogFile = (item) =>
  Array.isArray(item?.calibration_log_file) &&
  item.calibration_log_file.length > 0

const isOverdueUncalibratedRecord = (item) => {
  if (!item?.due_date || hasCalibrationLogFile(item)) return false

  const dueDate = new Date(item.due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (Number.isNaN(dueDate.getTime())) {
    return false
  }

  return dueDate < today
}

const MAX_DATE_RANGE_YEARS = 15

const getDateRangeError = ({ dateFrom, dateTo }) => {
  if (!dateFrom || !dateTo) {
    return 'Date From and Date To are required.'
  }

  const fromDate = new Date(dateFrom)
  const toDate = new Date(dateTo)

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return 'Invalid date range.'
  }

  if (toDate <= fromDate) {
    return 'Date To must be greater than Date From.'
  }

  const maxToDate = new Date(fromDate)
  maxToDate.setFullYear(maxToDate.getFullYear() + MAX_DATE_RANGE_YEARS)

  if (toDate > maxToDate) {
    return `Date range cannot exceed ${MAX_DATE_RANGE_YEARS} years.`
  }

  return ''
}

const formatDateInputValue = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CalibrationReportPage() {
  usePermissionGuard('Calibration')
  const toast = useToast()
  const { user } = useContext(AuthContext)

  const createInitialFilters = () => ({
    factory: user?.factory || '',
    dateType: 'change_date',
    calibrationClass: 'Internal Calibration',
    dateFrom: '',
    dateTo: '',
  })
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

  const [filters, setFilters] = useState(createInitialFilters)
  const [reportData, setReportData] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = async (filter) => {
    try {
      const result = await calibrationService.searchLogByFilters(filter)
      if (result.status !== 'success') {
        toast.error('Failed to fetch report data. Please try again later.')
        setReportData([])
        return
      }

      const dataWithFiles = Array.isArray(result.data)
        ? result.data.map((item) => ({
            ...item,
            calibration_log_file: transformFiles(item.calibration_log_file),
          }))
        : []

      setReportData(dataWithFiles)
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Failed to fetch report data. Please try again later.')
      setReportData([])
    }
  }

  const setField = (key) => (event) => {
    const value = event.target.value
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSearch = async () => {
    const dateRangeError = getDateRangeError(filters)
    if (dateRangeError) {
      toast.error(dateRangeError)
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    try {
      await fetchData(filters)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    const nextFilters = createInitialFilters()
    setFilters(nextFilters)
    setReportData([])
    setHasSearched(false)
  }

  const deptStatistics = useMemo(() => {
    const grouped = reportData.reduce((accumulator, item) => {
      const dept = item?.calibration?.dept || 'Unassigned'
      const isActual = hasCalibrationLogFile(item)
      const isDelayed = isOverdueUncalibratedRecord(item)

      if (!accumulator[dept]) {
        accumulator[dept] = {
          dept,
          estimateItems: [],
          actualItems: [],
          delayItems: [],
        }
      }

      accumulator[dept].estimateItems.push(item)
      if (isActual) {
        accumulator[dept].actualItems.push(item)
      }
      if (isDelayed) {
        accumulator[dept].delayItems.push(item)
      }
      return accumulator
    }, {})

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        estimateCount: item.estimateItems.length,
        actualCount: item.actualItems.length,
        delayCount: item.delayItems.length,
        achievementRate:
          item.estimateItems.length > 0
            ? (
                (item.actualItems.length / item.estimateItems.length) *
                100
              ).toFixed(2)
            : '0.00',
      }))
      .sort((a, b) =>
        b.estimateCount !== a.estimateCount
          ? b.estimateCount - a.estimateCount
          : a.dept.localeCompare(b.dept)
      )
  }, [reportData])

  const summaryCards = useMemo(() => {
    return [
      {
        key: 'totalRecords',
        label: '預計完成總數',
        value: reportData.length,
        tone: 'dark',
      },
      {
        key: 'departments',
        label: '部門數量',
        value: deptStatistics.length,
        tone: 'dark',
      },

      {
        key: 'completedRecords',
        label: '實際完成數量',
        value: deptStatistics.reduce((sum, item) => sum + item.actualCount, 0),
        tone: 'dark',
      },
    ]
  }, [deptStatistics, reportData])

  const maxDateTo = useMemo(() => {
    if (!filters.dateFrom) return undefined

    const maxToDate = new Date(filters.dateFrom)
    if (Number.isNaN(maxToDate.getTime())) return undefined

    maxToDate.setFullYear(maxToDate.getFullYear() + MAX_DATE_RANGE_YEARS)
    return formatDateInputValue(maxToDate)
  }, [filters.dateFrom])

  useEffect(() => {
    if (!user?.factory) return
    setFilters((prev) => ({ ...prev, factory: user.factory }))
  }, [user])

  return (
    <>
      <Head>
        <title>Calibration Report</title>
      </Head>
      <CContainer fluid className={sharedStyles.pageShell}>
        <div className={sharedStyles.cardShell}>
          <CCard className={sharedStyles.card}>
            <CCardHeader className={sharedStyles.cardHeader}>
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <p className={sharedStyles.eyebrow}>Calibration</p>
                  <h2 className={sharedStyles.title}>Report Search</h2>
                  <p className={sharedStyles.subTitle}>
                    Review calibration statistics by factory, date type, and
                    calibration class.
                  </p>
                </div>
                <div className={styles.headerMeta}>
                  <span className={styles.headerMetaLabel}>
                    Current Factory
                  </span>
                  <strong>{filters.factory}</strong>
                </div>
              </div>
            </CCardHeader>
            <CCardBody className={sharedStyles.cardBody}>
              <CCard className={`${styles.sectionCard} mb-4`}>
                <CCardBody className="p-4">
                  <CRow className="g-3">
                    <CCol xs={12} md={6} xl={3}>
                      <CFormLabel className="text-muted mb-1 h6">
                        Factory
                      </CFormLabel>
                      <CFormInput value={filters.factory} size="lg" readOnly />
                    </CCol>
                    <CCol xs={12} md={6} xl={3}>
                      <CFormLabel className="text-muted mb-1 h6">
                        Report Type
                      </CFormLabel>
                      <CFormSelect
                        size="lg"
                        value={filters.dateType}
                        options={REPORT_TYPE_OPTIONS}
                        onChange={setField('dateType')}
                      />
                    </CCol>
                    <CCol xs={12} md={6} xl={3}>
                      <CFormLabel className="text-muted mb-1 h6">
                        Calibration Class
                      </CFormLabel>
                      <CFormSelect
                        size="lg"
                        value={filters.calibrationClass}
                        options={CALIBRATION_CLASS_OPTIONS}
                        onChange={setField('calibrationClass')}
                      />
                    </CCol>
                    <CCol xs={12} md={6} xl={3}>
                      <CFormLabel className="text-muted mb-1 h6">
                        Date From
                      </CFormLabel>
                      <CFormInput
                        type="date"
                        size="lg"
                        required
                        value={filters.dateFrom}
                        max={filters.dateTo || undefined}
                        onChange={setField('dateFrom')}
                      />
                    </CCol>
                    <CCol xs={12} md={6} xl={3}>
                      <CFormLabel className="text-muted mb-1 h6">
                        Date To
                      </CFormLabel>
                      <CFormInput
                        type="date"
                        size="lg"
                        required
                        value={filters.dateTo}
                        min={filters.dateFrom || undefined}
                        max={maxDateTo}
                        onChange={setField('dateTo')}
                      />
                    </CCol>
                    <CCol xs={12} xl={9}>
                      <div className="d-flex flex-wrap justify-content-xl-end align-items-end gap-2 h-100">
                        <CButton
                          color="primary"
                          size="lg"
                          className="btn-ph-primary d-inline-flex align-items-center gap-2"
                          onClick={handleSearch}
                          disabled={isLoading}
                        >
                          {isLoading ? <CSpinner size="sm" /> : <FiSearch />}
                          {isLoading ? 'Searching...' : 'Search'}
                        </CButton>
                        <CButton
                          color="primary"
                          variant="outline"
                          size="lg"
                          className="btn-ph-outline-primary d-inline-flex align-items-center gap-2"
                          onClick={handleReset}
                          disabled={isLoading}
                        >
                          <FiRefreshCw />
                          Reset Filters
                        </CButton>
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              {(hasSearched || isLoading) && (
                <>
                  {isLoading && (
                    <div className="d-flex justify-content-center align-items-center gap-2 py-4 text-muted">
                      <CSpinner />
                      <span>Loading report data...</span>
                    </div>
                  )}
                  <CRow className="g-3 mb-4">
                    {summaryCards.map((card) => (
                      <CCol xs={12} xl={4} key={card.key}>
                        <CCard
                          className={`${styles.summaryCard} border-0 h-100`}
                        >
                          <CCardBody>
                            <div className="text-muted small text-uppercase mb-2 p">
                              <CBadge color={card.tone}>{card.label}</CBadge>
                            </div>
                            <div className={styles.summaryValue}>
                              {card.value}
                            </div>
                          </CCardBody>
                        </CCard>
                      </CCol>
                    ))}
                  </CRow>
                  <ReportTable
                    reportData={reportData}
                    deptStatistics={deptStatistics}
                  />
                </>
              )}
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
    </>
  )
}
