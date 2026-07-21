import { Fragment, useState, useEffect } from 'react'
import Head from 'next/head'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
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
import { FiRefreshCw, FiSearch } from 'react-icons/fi'
import { useToast } from '@/hooks/useToast'
import { calibrationService } from '@/services/Calibration/calibration.service'
import sharedStyles from '@/styles/calibration.module.scss'
import styles from '@/styles/statistics.module.scss'
import useImportExcerl from '@/hooks/useImportExcerl'
import usePermissionGuard from '@/hooks/usePermissionGuard'

const createInitialFilters = () => ({ type: '', value: '' })

export default function StatisticsPage() {
  usePermissionGuard('Calibration')
  const { downloadForExcel } = useImportExcerl()
  const toast = useToast()
  const [selectOption, setSelectOption] = useState([])
  const [filters, setFilters] = useState(createInitialFilters)
  const [submittedFilters, setSubmittedFilters] = useState(createInitialFilters)
  const [statisticsData, setStatisticsData] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedRowKey, setExpandedRowKey] = useState('')

  const fetchOptions = async () => {
    try {
      const response = await calibrationService.getCalibrationStatisticOptions()

      if (response.status === 'success') {
        const options = [
          { label: 'Select E_Group', value: '' },
          { label: 'ALL', value: 'ALL|ALL' },
        ]
        options.push(...response.data)
        setSelectOption(options)
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    }
  }

  const setField = () => (event) => {
    const targetValue = event.target.value
    if (!targetValue) {
      setFilters(createInitialFilters())
      return
    }

    const [type, value] = targetValue.split('|')
    setFilters({ type, value })
  }

  const handleSearch = async () => {
    if (!filters.type || !filters.value) {
      toast.error('Please select E_Group before searching.')
      return
    }
    const result = await calibrationService.getStatistics(
      filters.type,
      filters.value
    )
    if (result.status === 'success') {
      console.log(result.data)
      setStatisticsData(result.data)
    }
    setSubmittedFilters(filters)
    setHasSearched(true)
    setExpandedRowKey('')
  }

  const handleReset = () => {
    const nextFilters = createInitialFilters()
    setFilters(nextFilters)
    setSubmittedFilters(nextFilters)
    setHasSearched(false)
    setExpandedRowKey('')
  }

  const handleDownloadStatisticExcel = (factory) => {
    const title = ['No.', 'Instrument Name', factory]
    const data = statisticsData.map((item, index) => [
      index + 1,
      `${item.groupName} / ${item.system}`,
      item.count,
    ])
    handleDownloadExcel(title, data, `Statistics_${factory}`)
  }

  const handleDownloadDetailExcel = (groupName, system, detailItems) => {
    const title = [
      'No.',
      'PropertyNo',
      'InstruName',
      'Factory',
      'Owner',
      'Dept',
      'Vendor',
      'Status',
      'Create Date',
      'Description',
    ]
    const data = detailItems.map((item, index) => [
      index + 1,
      item.property_no,
      item.instrument?.instru_name || '',
      item.factory,
      item.owner,
      item.dept,
      item.vendor,
      item.status,
      item.date ? item.date.slice(0, 10) : '',
      item.description,
    ])
    const fileName = `Details_${groupName}_${system}`
    handleDownloadExcel(title, data, fileName)
  }

  const handleDownloadExcel = (title, data, fileName) => {
    const EXCEL_CONFIG = {
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
    }
    const finalData = [title, ...data]
    const today = new Date().toISOString().slice(0, 10)
    downloadForExcel(finalData, `${fileName}_${today}.xlsx`, EXCEL_CONFIG)
  }

  const toggleItems = (rowKey) => {
    setExpandedRowKey((currentRowKey) =>
      currentRowKey === rowKey ? '' : rowKey
    )
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  return (
    <>
      <Head>
        <title>Calibration Statistics</title>
      </Head>
      <CContainer fluid className={sharedStyles.pageShell}>
        <div className={sharedStyles.cardShell}>
          <CCard className={sharedStyles.card}>
            <CCardHeader className={sharedStyles.cardHeader}>
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                  <p className={sharedStyles.eyebrow}>Calibration</p>
                  <h2 className={sharedStyles.title}>Statistic Search</h2>
                  <p className={sharedStyles.subTitle}>
                    Search instrument statistics by E_Group and review the total
                    distribution.
                  </p>
                </div>
              </div>
            </CCardHeader>

            <CCardBody className={sharedStyles.cardBody}>
              <CCard className={`${styles.sectionCard} mb-4`}>
                <CCardBody className="p-4">
                  <CRow className="g-3 align-items-end">
                    <CCol xs={12} xl={8}>
                      <CFormLabel className="text-muted mb-1 h6">
                        E_Group
                      </CFormLabel>
                      <CFormSelect
                        size="lg"
                        value={
                          filters.type && filters.value
                            ? `${filters.type}|${filters.value}`
                            : ''
                        }
                        options={selectOption}
                        onChange={setField('eGroup')}
                      />
                    </CCol>

                    <CCol xs={12} xl={4}>
                      <div className="d-flex flex-wrap justify-content-xl-end gap-2">
                        <CButton
                          color="primary"
                          size="lg"
                          className="btn-ph-primary d-inline-flex align-items-center gap-2"
                          onClick={handleSearch}
                        >
                          <FiSearch />
                          Search
                        </CButton>
                        <CButton
                          color="primary"
                          variant="outline"
                          size="lg"
                          className="btn-ph-outline-primary d-inline-flex align-items-center gap-2"
                          onClick={handleReset}
                        >
                          <FiRefreshCw />
                          Reset Filters
                        </CButton>
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              {hasSearched && (
                <CCard className={styles.resultCard}>
                  <CCardHeader className={styles.resultHeader}>
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                      <h4 className="mb-1">Statistic Search List</h4>
                      <CButton
                        color="success"
                        variant="outline"
                        className="d-flex align-items-center gap-2"
                        onClick={() =>
                          handleDownloadStatisticExcel(submittedFilters.value)
                        }
                      >
                        Download Excel
                      </CButton>
                    </div>
                    <p className="mb-0 text-muted">
                      E_Group: {submittedFilters.value} | Total Count:
                      {` ${statisticsData.reduce(
                        (sum, item) => sum + item.count,
                        0
                      )}`}
                    </p>
                  </CCardHeader>
                  <CCardBody className="p-0">
                    <div className="table-responsive">
                      <CTable hover align="middle" className="mb-0">
                        <CTableHead>
                          <CTableRow className="text-center fw-bold p">
                            <CTableHeaderCell className="py-3 ps-4">
                              No.
                            </CTableHeaderCell>
                            <CTableHeaderCell className="py-3">
                              Instrument Name
                            </CTableHeaderCell>
                            <CTableHeaderCell
                              className="py-3 pe-4"
                              style={{ width: '450px' }}
                            >
                              {submittedFilters.value}
                            </CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {statisticsData.length === 0 && (
                            <CTableRow>
                              <CTableDataCell
                                colSpan={3}
                                className="text-center text-muted py-5"
                              >
                                No statistic data found for the selected
                                conditions.
                              </CTableDataCell>
                            </CTableRow>
                          )}

                          {statisticsData.map((item, index) => {
                            const rowKey = `${item.groupName}-${item.system}`
                            const isExpanded = expandedRowKey === rowKey
                            const detailItems = item.items || []

                            return (
                              <Fragment key={rowKey}>
                                <CTableRow className="p">
                                  <CTableDataCell className="ps-4 text-center">
                                    {index + 1}
                                  </CTableDataCell>
                                  <CTableDataCell className="text-center">
                                    <div className={styles.instrumentCell}>
                                      <span className={styles.instrumentNameEn}>
                                        {item.groupName}
                                      </span>
                                      <span className={styles.instrumentNameZh}>
                                        {item.system}
                                      </span>
                                    </div>
                                  </CTableDataCell>
                                  <CTableDataCell className="pe-4 text-center">
                                    <button
                                      type="button"
                                      className={styles.countLink}
                                      aria-expanded={isExpanded}
                                      onClick={() => toggleItems(rowKey)}
                                    >
                                      {item.count}
                                    </button>
                                  </CTableDataCell>
                                </CTableRow>

                                {isExpanded && (
                                  <>
                                    <CButton
                                      color="success"
                                      variant="outline"
                                      className="d-flex align-items-center gap-2 mx-5 my-3"
                                      onClick={() =>
                                        handleDownloadDetailExcel(
                                          item.groupName,
                                          item.system,
                                          detailItems
                                        )
                                      }
                                    >
                                      Download Detail Excel
                                    </CButton>
                                    <CTableRow className={styles.detailRow}>
                                      <CTableDataCell colSpan={3}>
                                        <div className="table-responsive">
                                          <CTable
                                            hover
                                            align="middle"
                                            className={`${styles.detailTable} mb-0 h6`}
                                          >
                                            <CTableHead>
                                              <CTableRow className="text-center">
                                                <CTableHeaderCell>
                                                  No.
                                                </CTableHeaderCell>
                                                <CTableHeaderCell>
                                                  PropertyNo
                                                </CTableHeaderCell>
                                                <CTableHeaderCell>
                                                  InstruName
                                                </CTableHeaderCell>
                                                <CTableHeaderCell>
                                                  Factory
                                                </CTableHeaderCell>
                                                <CTableHeaderCell>
                                                  Owner
                                                </CTableHeaderCell>
                                                <CTableHeaderCell>
                                                  Detp
                                                </CTableHeaderCell>
                                                <CTableHeaderCell>
                                                  Vendor
                                                </CTableHeaderCell>
                                                <CTableHeaderCell>
                                                  Status
                                                </CTableHeaderCell>
                                                <CTableHeaderCell>
                                                  Create Date
                                                </CTableHeaderCell>
                                                <CTableHeaderCell>
                                                  Description
                                                </CTableHeaderCell>
                                              </CTableRow>
                                            </CTableHead>
                                            <CTableBody>
                                              {detailItems.length === 0 && (
                                                <CTableRow>
                                                  <CTableDataCell
                                                    colSpan={10}
                                                    className="text-center text-muted py-4"
                                                  >
                                                    No detail data found.
                                                  </CTableDataCell>
                                                </CTableRow>
                                              )}

                                              {detailItems.map(
                                                (detailItem, detailIndex) => (
                                                  <CTableRow
                                                    key={`${rowKey}-${detailItem.property_no}-${detailIndex}`}
                                                    className="text-center"
                                                  >
                                                    <CTableDataCell>
                                                      {detailIndex + 1}
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                      {detailItem.property_no}
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                      {
                                                        detailItem.instrument
                                                          ?.instru_name
                                                      }
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                      {detailItem.factory}
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                      {detailItem.owner}
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                      {detailItem.dept}
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                      {detailItem.vendor}
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                      {detailItem.status}
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                      {detailItem.date?.slice(
                                                        0,
                                                        10
                                                      )}
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                      {detailItem.description}
                                                    </CTableDataCell>
                                                  </CTableRow>
                                                )
                                              )}
                                            </CTableBody>
                                          </CTable>
                                        </div>
                                      </CTableDataCell>
                                    </CTableRow>
                                  </>
                                )}
                              </Fragment>
                            )
                          })}

                          {statisticsData.length > 0 && (
                            <CTableRow className={styles.totalRow}>
                              <CTableDataCell className="text-center fw-bold p">
                                Total
                              </CTableDataCell>
                              <CTableDataCell colSpan={1}></CTableDataCell>
                              <CTableDataCell className="text-center fw-bold pe-4 p">
                                {statisticsData.reduce(
                                  (sum, item) => sum + item.count,
                                  0
                                )}
                              </CTableDataCell>
                            </CTableRow>
                          )}
                        </CTableBody>
                      </CTable>
                    </div>
                  </CCardBody>
                </CCard>
              )}
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
    </>
  )
}
