import { useEffect, useMemo, useState, useContext } from 'react'
import Head from 'next/head'
import {
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
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { FiSearch } from 'react-icons/fi'
import { calibrationService } from '@/services/Calibration/calibration.service'
import calibrationStyles from '@/styles/calibration.module.scss'
import { useRouter } from 'next/router'
import styles from '@/styles/calibration-time-calculation.module.scss'
import { AuthContext } from '@/context/AuthContext'
import useImportExcerl from '@/hooks/useImportExcerl'
import Pagination from '@/components/common/pagination'
import usePermissionGuard from '@/hooks/usePermissionGuard'

const CALIBRATION_CLASS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'NCR', value: 'NCR' },
  { label: 'Internal Calibration', value: 'Internal Calibration' },
  { label: 'External Calibration', value: 'External Calibration' },
  { label: 'On-Site', value: 'On-Site' },
]

const normalizeDate = (value) => {
  if (!value) return ''
  return String(value).slice(0, 10)
}

export default function CalibrationTimeCalculationPage() {
  usePermissionGuard('Calibration')

  const initialFilters = {
    dateFrom: '',
    dateTo: '',
    calibrationClass: '',
    factory: '',
  }
  const { downloadForExcel } = useImportExcerl()
  const { user } = useContext(AuthContext)
  const router = useRouter()
  const [filters, setFilters] = useState(initialFilters)
  const [hasSearched, setHasSearched] = useState(false)
  const [logData, setLogData] = useState([])
  const [pages, setPages] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  // Initialize frontend filters from query string for a more realistic UX.

  const resultCountLabel = useMemo(() => {
    if (!hasSearched) return 'Enter search conditions and click Search.'
    return `${logData.length} result(s) found.`
  }, [logData.length])

  const handleChange = (event, field) => {
    const value = event.target.value
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const getnextUsableChangeDate = (data) => {
    const logs = [...(data.calibration?.calibration_log ?? [])].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    )
    const currentIndex = logs.findIndex((log) => log.id === data.id)
    const nextUsableChangeDate =
      currentIndex >= 0
        ? logs.slice(currentIndex + 1).find((log) => log.status === 'Usable')
            ?.change_date ?? null
        : null

    return normalizeDate(nextUsableChangeDate) || null
  }

  const calculationTime = (receiveDate, finishDate) => {
    if (!receiveDate || !finishDate) return null
    const start = new Date(normalizeDate(receiveDate))
    const end = new Date(normalizeDate(finishDate))
    const diffTime = end - start
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} day(s)`
  }

  const handleSearch = async () => {
    setHasSearched(true)

    const result = await calibrationService.getCalculationTimeData(filters)
    console.log(result)
    if (result.status === 'success') {
      const data = result.data.data.map((item) => {
        const receiveDate = item.created_at
        const finishDate = item.change_date
        return {
          ...item,
          calibration_time: calculationTime(receiveDate, finishDate),
          change_date: receiveDate,
          calibration_finish_date: finishDate,
        }
      })
      setPages(1)
      setTotalPages(result.data.totalPages)
      setLogData(data)
    }
  }

  const handleChangePage = async (newPage) => {
    const filtersWithPage = {
      ...filters,
      pages: newPage,
    }

    const result = await calibrationService.getCalculationTimeData(
      filtersWithPage
    )

    if (result.status === 'success') {
      const data = result.data.data.map((item) => {
        const receiveDate = item.created_at
        const finishDate = item.change_date
        return {
          ...item,
          calibration_time: calculationTime(receiveDate, finishDate),
          change_date: receiveDate,
          calibration_finish_date: finishDate,
        }
      })
      setPages(newPage)
      setTotalPages(result.data.totalPages)
      setLogData(data)
    }

    // await fetchInstruments(filteredParams)
  }

  const handleReset = async () => {
    initialFilters.factory = user?.factory || ''
    setFilters(initialFilters)
    setHasSearched(false)
    setLogData([])
    setPages(1)
    setTotalPages(1)
  }

  const handleDownloadExcel = () => {
    const title = [
      'No.',
      'Property No',
      'Calibration Time',
      'Receive Date',
      'Calibration Finish Date',
      'Verifier',
      'Calibration Cost',
    ]

    // 定義欄位名稱的標題
    function formatDate(date) {
      return date ? date.slice(0, 10) : null
    }

    // 組織表格資料的內容
    const data = logData.map((item, index) => {
      return [
        index + 1,
        item.property_no,
        item.calibration_time || '-',
        item.change_date ? formatDate(item.change_date) : '-',
        item.calibration_finish_date
          ? formatDate(item.calibration_finish_date)
          : '-',
        item.calibman,
        item.calibration.calibration_cost[0]?.cost || '-',
      ]
    })

    // 將標題與資料合併，形成完整的資料表
    const finalData = [title, ...data]
    const today = new Date().toISOString().slice(0, 10) // 取得今天的日期，格式為 YYYY-MM-DD
    // 呼叫下載函式
    downloadForExcel(finalData, `Calibration time calculation_${today}.xlsx`, {
      headerStyle: {
        font: {
          bold: true,
          color: { argb: 'FFFFFFFF' },
        },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '336600' },
        },
        alignment: {
          vertical: 'middle',
          horizontal: 'center',
        },
      },
      bodyStyle: {
        alignment: {
          vertical: 'middle',
          horizontal: 'left',
        },
      },
    })
  }

  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!router.isReady) return
    if (!user) return

    setFilters((prev) => ({
      ...prev,
      factory: user?.factory || '',
    }))
  }, [router.isReady, user])

  return (
    <>
      <Head>
        <title>Calibration Time Calculation</title>
      </Head>
      <CContainer fluid className={calibrationStyles.pageShell}>
        <div className={calibrationStyles.cardShell}>
          <CCard className={calibrationStyles.card}>
            <CCardHeader className={calibrationStyles.cardHeader}>
              <div>
                <p className={calibrationStyles.eyebrow}>Calibration</p>
                <h2 className={calibrationStyles.title}>Calibration Metrics</h2>
                <p className={calibrationStyles.subTitle}>
                  Search calibration processing records by date range and class.
                </p>
              </div>
            </CCardHeader>
            <CCardBody className={calibrationStyles.cardBody}>
              <CCard className={styles.sectionCard}>
                <CCardBody className={styles.sectionBody}>
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                    <div>
                      <h3 className="h4 mb-1">Search Filters</h3>
                      <p className="text-muted mb-0">
                        Frontend-only search mockup for calibration time
                        calculation.
                      </p>
                    </div>
                    <div className="d-flex gap-2">
                      <CButton
                        color="primary"
                        className="btn-ph-primary d-flex align-items-center gap-2"
                        size="lg"
                        onClick={handleSearch}
                      >
                        <FiSearch />
                        Search
                      </CButton>
                      <CButton
                        color="primary"
                        variant="outline"
                        className="btn-ph-outline-primary"
                        size="lg"
                        onClick={handleReset}
                      >
                        Reset
                      </CButton>
                    </div>
                  </div>

                  <CRow className="g-3">
                    <CCol xs={12} md={6} xl={4}>
                      <CFormLabel className="text-muted mb-1 h6">
                        Date From
                      </CFormLabel>
                      <CFormInput
                        type="date"
                        size="lg"
                        value={filters.dateFrom}
                        onChange={(event) => handleChange(event, 'dateFrom')}
                      />
                    </CCol>
                    <CCol xs={12} md={6} xl={4}>
                      <CFormLabel className="text-muted mb-1 h6">
                        Date To
                      </CFormLabel>
                      <CFormInput
                        type="date"
                        size="lg"
                        value={filters.dateTo}
                        onChange={(event) => handleChange(event, 'dateTo')}
                      />
                    </CCol>
                    <CCol xs={12} md={6} xl={4}>
                      <CFormLabel className="text-muted mb-1 h6">
                        Calibration Class
                      </CFormLabel>
                      <CFormSelect
                        size="lg"
                        value={filters.calibrationClass}
                        options={CALIBRATION_CLASS_OPTIONS}
                        onChange={(event) =>
                          handleChange(event, 'calibrationClass')
                        }
                      />
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              <CCard className={styles.sectionCard}>
                <CCardBody className={styles.sectionBody}>
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <div>
                      <h3 className="h4 mb-1">
                        Calibration time calculation Search List
                      </h3>
                      <p className="text-muted mb-0">{resultCountLabel}</p>
                    </div>
                    {logData.length > 0 && (
                      <CButton
                        color="success"
                        size="lg"
                        variant="outline"
                        className="d-flex align-items-center gap-2"
                        onClick={handleDownloadExcel}
                      >
                        Download Excel
                      </CButton>
                    )}
                  </div>

                  {hasSearched ? (
                    <div className="border rounded-4 shadow-sm bg-white">
                      <CTable
                        hover
                        responsive
                        align="middle"
                        className="mb-0 p"
                      >
                        <CTableHead>
                          <CTableRow className="h6 text-center fw-bold">
                            <CTableHeaderCell scope="col" className="py-3">
                              No.
                            </CTableHeaderCell>
                            <CTableHeaderCell scope="col" className="py-3">
                              Property No
                            </CTableHeaderCell>
                            <CTableHeaderCell scope="col" className="py-3">
                              Calibration Time
                            </CTableHeaderCell>
                            <CTableHeaderCell scope="col" className="py-3">
                              Receive Date
                            </CTableHeaderCell>
                            <CTableHeaderCell scope="col" className="py-3">
                              Calibration Finish Date
                            </CTableHeaderCell>
                            <CTableHeaderCell scope="col" className="py-3">
                              Verifier
                            </CTableHeaderCell>
                            <CTableHeaderCell scope="col" className="py-3">
                              Calibration Cost
                            </CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {logData.length === 0 ? (
                            <CTableRow>
                              <CTableDataCell
                                colSpan={7}
                                className="text-center py-4 text-muted"
                              >
                                No records match the current search criteria.
                              </CTableDataCell>
                            </CTableRow>
                          ) : (
                            logData.map((item, index) => (
                              <CTableRow
                                key={item.id}
                                className="text-center align-middle"
                              >
                                <CTableDataCell>{index + 1}</CTableDataCell>
                                <CTableDataCell className="fw-semibold">
                                  {item.property_no}
                                </CTableDataCell>
                                <CTableDataCell>
                                  {item.calibration_time || '-'}
                                </CTableDataCell>
                                <CTableDataCell>
                                  {normalizeDate(item.change_date) || '-'}
                                </CTableDataCell>
                                <CTableDataCell>
                                  {normalizeDate(
                                    item.calibration_finish_date
                                  ) || '-'}
                                </CTableDataCell>
                                <CTableDataCell>{item.calibman}</CTableDataCell>
                                <CTableDataCell>
                                  {item.calibration.calibration_cost[0]?.cost ||
                                    '-'}
                                </CTableDataCell>
                              </CTableRow>
                            ))
                          )}
                        </CTableBody>
                      </CTable>
                      {logData.length > 0 && (
                        <Pagination
                          page={pages}
                          totalPages={totalPages}
                          onPageChange={(newPage) => handleChangePage(newPage)}
                        />
                      )}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <p className="mb-1 fw-semibold">No search executed yet</p>
                      <p className="text-muted mb-0">
                        Set conditions above and click Search to show the result
                        list.
                      </p>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
    </>
  )
}
