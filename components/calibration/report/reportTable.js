import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { FiBarChart2, FiList } from 'react-icons/fi'
import ClientOnly from '@/components/common/clientOnly'
import { api } from '@/utils/api'
import { useToast } from '@/hooks/useToast'
import styles from '@/styles/report.module.scss'
import Image from 'next/image'
import useImportExcerl from '@/hooks/useImportExcerl'
import ExpandableCountButton from '@/components/calibration/report/expandableCountButton'
import DetailSection from '@/components/calibration/report/detailSection'
import CommonDetailTable from '@/components/calibration/report/commonDetailTable'
import Pagination from '@/components/common/pagination'

const CHART_CONFIG = {
  estimate: {
    title: '預計完成件數 Chart',
    field: 'estimateCount',
  },
  actual: {
    title: '實際完成件數 Chart',
    field: 'actualCount',
  },
  delay: {
    title: '逾期未校正件數 Chart',
    field: 'delayCount',
  },
}

const formatDate = (value) => {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

const getCalibrationCost = (item) =>
  item?.calibration?.calibration_cost?.[0]?.cost ?? '-'

export default function ReportTable({ reportData, deptStatistics }) {
  const { downloadForExcel } = useImportExcerl()
  const toast = useToast()

  function truncateFileName(name, length = 20) {
    if (!name) return ''
    return name.length > length ? `${name.slice(0, length)}...` : name
  }
  const [pages, setPages] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedRow, setExpandedRow] = useState(null)
  const [chartType, setChartType] = useState(null)
  const [isModalReady, setIsModalReady] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const chartCanvasRef = useRef(null)
  const chartInstanceRef = useRef(null)

  const toggleExpandedRow = (dept, type) => {
    setExpandedRow((prev) =>
      prev?.dept === dept && prev?.type === type ? null : { dept, type }
    )
  }

  const handlePreviewFile = (file) => {
    if (!file?.file_url) {
      toast.error('File URL is missing.')
      return
    }

    const filename = encodeURIComponent(file.file.name)
    const url = api(`/data/files?filename=calibration/${filename}`)
    window.open(url, '_blank')
  }

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

  const downloaddeptStatisticsExcel = () => {
    console.log(deptStatistics)
    const title = [
      'No.',
      '部門',
      '預計完成件數',
      '實際完成件數',
      '逾期未校正件數',
      '達成率(%)',
    ]

    const data = deptStatistics.map((item, index) => {
      return [
        index + 1,
        item.dept,
        item.estimateCount,
        item.actualCount,
        item.delayCount,
        Number(item.achievementRate) || 0,
      ]
    })
    const finalData = [title, ...data]
    const today = new Date().toISOString().slice(0, 10)
    downloadForExcel(finalData, `Report Statistics_${today}.xlsx`, EXCEL_CONFIG)
  }

  const downloadTotalSummaryExcel = () => {
    const title = totalSummaryColumns.map((col) => col.label)
    const data = reportData.map((item) =>
      totalSummaryColumns.map((col) => {
        if (col.render) {
          return col.render(item)
        }
        return item[col.key] || '-'
      })
    )
    const finalData = [title, ...data]
    const today = new Date().toISOString().slice(0, 10)
    downloadForExcel(finalData, `Total Summary_${today}.xlsx`, EXCEL_CONFIG)
  }

  const chartRows = useMemo(() => {
    if (!chartType) return []
    const config = CHART_CONFIG[chartType]
    const maxValue = Math.max(
      ...deptStatistics.map((item) => item[config.field] || 0),
      0
    )
    return deptStatistics.map((item) => ({
      dept: item.dept,
      value: item[config.field] || 0,
    }))
  }, [chartType, deptStatistics])

  const estimateColumns = [
    { key: 'property_no', label: 'Property No' },
    {
      key: 'due_date',
      label: 'Estimate',
      render: (row) => formatDate(row.due_date),
    },
    {
      key: 'calibr_date',
      label: 'CalibrDate',
      render: (row) => formatDate(row.change_date || row.created_at),
    },
    {
      key: 'factory',
      label: 'Factory',
      render: (row) => row.factory || row.calibration?.factory || '-',
    },
    {
      key: 'dept',
      label: 'Dept',
      render: (row) => row.calibration?.dept || '-',
    },
    {
      key: 'model',
      label: 'Model',
      render: (row) => row.calibration?.model || '-',
    },
    {
      key: 'calibr_class',
      label: 'Calibr Class',
      render: (row) => row.calibration?.calibr_class || '-',
    },
  ]

  const delayColumns = [
    { key: 'id', label: 'ID' },
    { key: 'property_no', label: 'Property No' },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (row) => formatDate(row.due_date),
    },
    {
      key: 'calibr_date',
      label: 'CalibrDate',
      render: (row) => formatDate(row.change_date || row.created_at),
    },
    { key: 'factory', label: 'Factory', render: (row) => row.factory || '-' },
    { key: 'status', label: 'Status', render: (row) => row.status || '-' },
    { key: 'remark', label: 'Remark', render: (row) => row.remark || '-' },
  ]

  const totalSummaryColumns = [
    { key: 'property_no', label: 'Property No' },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (row) => formatDate(row.due_date),
    },
    {
      key: 'calibr_date',
      label: 'CalibrDate',
      render: (row) => formatDate(row.change_date || row.created_at),
    },
    { key: 'factory', label: 'Factory', render: (row) => row.factory || '-' },
    {
      key: 'dept',
      label: 'Dept',
      render: (row) => row.calibration?.dept || '-',
    },
    {
      key: 'model',
      label: 'Model',
      render: (row) => row.calibration?.model || '-',
    },
    {
      key: 'calibr_class',
      label: 'Calibr Class',
      render: (row) => row.calibration?.calibr_class || '-',
    },
    {
      key: 'calibration_cost',
      label: 'Calibration Cost',
      render: (row) => getCalibrationCost(row),
    },
  ]

  const handleChangePage = async (newPage) => {
    setPages(newPage)
  }

  const pagedReportData = useMemo(() => {
    const limit = 200
    return reportData.slice((pages - 1) * limit, pages * limit)
  }, [reportData, pages])

  useEffect(() => {
    if (!chartType || !chartCanvasRef.current || !isModalReady) return
    const timer = setTimeout(() => {
      const config = CHART_CONFIG[chartType]
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
      const backgroundColors = chartRows.map((_, i) => {
        const hue = (i * 360) / chartRows.length
        return `hsl(${hue}, 70%, 60%)`
      })

      chartInstanceRef.current = new Chart(chartCanvasRef.current, {
        type: 'bar',
        data: {
          labels: chartRows.map((item) => item.dept),
          datasets: [
            {
              label: config.title,
              data: chartRows.map((item) => item.value),
              backgroundColor: backgroundColors,
              borderColor: backgroundColors,
              borderWidth: 1,
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              ticks: {
                maxRotation: 0,
                minRotation: 0,
              },
              grid: {
                display: false,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
              },
            },
          },
        },
      })
    }, 50)

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
      clearTimeout(timer)
    }
  }, [chartRows, chartType, chartType, isModalReady])

  useEffect(() => {
    const limit = 200
    const total = reportData.length
    setTotalPages(Math.ceil(total / limit))
    setPages(1)
  }, [reportData])

  return (
    <>
      <CCard className={styles.sectionCard}>
        <CCardHeader className={styles.tableHeader}>
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <h5 className="mb-1">Calibration Statistics</h5>
            </div>
            <div className="d-flex align-items-center gap-2">
              <CButton
                color="success"
                variant="outline"
                className="d-flex align-items-center gap-2"
                onClick={() => downloaddeptStatisticsExcel()}
              >
                Download Excel
              </CButton>
              <CButton
                color="primary"
                variant="outline"
                className="btn-ph-outline-primary d-inline-flex align-items-center gap-2"
                onClick={() => setShowSummaryModal(true)}
              >
                <FiList />
                檢視總表
              </CButton>
            </div>
          </div>
        </CCardHeader>
        <CCardBody className="p-0">
          <div className="table-responsive">
            <CTable hover align="middle" className="mb-0">
              <CTableHead>
                <CTableRow className="text-center fw-bold h5">
                  <CTableHeaderCell className="py-3 ps-4">No.</CTableHeaderCell>
                  <CTableHeaderCell className="py-3">部門</CTableHeaderCell>
                  <CTableHeaderCell className="py-3">
                    <div className="d-inline-flex align-items-center gap-2">
                      <span>預計完成件數</span>
                      <CButton
                        color="primary"
                        variant="outline"
                        size="sm"
                        onClick={() => setChartType('estimate')}
                      >
                        <FiBarChart2 />
                      </CButton>
                    </div>
                  </CTableHeaderCell>
                  <CTableHeaderCell className="py-3">
                    <div className="d-inline-flex align-items-center gap-2">
                      <span>實際完成件數</span>
                      <CButton
                        color="success"
                        variant="outline"
                        size="sm"
                        onClick={() => setChartType('actual')}
                      >
                        <FiBarChart2 />
                      </CButton>
                    </div>
                  </CTableHeaderCell>
                  <CTableHeaderCell className="py-3">
                    <div className="d-inline-flex align-items-center gap-2">
                      <span>逾期未校正件數</span>
                      <CButton
                        color="danger"
                        variant="outline"
                        size="sm"
                        onClick={() => setChartType('delay')}
                      >
                        <FiBarChart2 />
                      </CButton>
                    </div>
                  </CTableHeaderCell>
                  <CTableHeaderCell className="py-3 pe-4">
                    達成率
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {deptStatistics.length === 0 && (
                  <CTableRow>
                    <CTableDataCell
                      colSpan={6}
                      className="text-center text-muted py-5"
                    >
                      No report data found for the selected conditions.
                    </CTableDataCell>
                  </CTableRow>
                )}

                {deptStatistics.map((item, index) => {
                  const showEstimateDetail =
                    expandedRow?.dept === item.dept &&
                    expandedRow?.type === 'estimate'
                  const showActualDetail =
                    expandedRow?.dept === item.dept &&
                    expandedRow?.type === 'actual'
                  const showDelayDetail =
                    expandedRow?.dept === item.dept &&
                    expandedRow?.type === 'delay'

                  return (
                    <Fragment key={item.dept}>
                      <CTableRow className="text-center align-middle p">
                        <CTableDataCell className="ps-4">
                          {index + 1}
                        </CTableDataCell>
                        <CTableDataCell className="fw-semibold">
                          {item.dept}
                        </CTableDataCell>
                        <CTableDataCell>
                          <ExpandableCountButton
                            count={item.estimateCount}
                            color="primary"
                            expanded={showEstimateDetail}
                            onClick={() =>
                              toggleExpandedRow(item.dept, 'estimate')
                            }
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <ExpandableCountButton
                            count={item.actualCount}
                            color="success"
                            expanded={showActualDetail}
                            onClick={() =>
                              toggleExpandedRow(item.dept, 'actual')
                            }
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <ExpandableCountButton
                            count={item.delayCount}
                            color="danger"
                            expanded={showDelayDetail}
                            onClick={() =>
                              toggleExpandedRow(item.dept, 'delay')
                            }
                          />
                        </CTableDataCell>
                        <CTableDataCell className="fw-semibold pe-4">
                          {item.achievementRate}%
                        </CTableDataCell>
                      </CTableRow>
                      {showEstimateDetail && (
                        <DetailSection title="預計完成件數">
                          <CommonDetailTable
                            columns={estimateColumns}
                            data={item.estimateItems}
                          />
                        </DetailSection>
                      )}

                      {showActualDetail && (
                        <DetailSection title="實際完成件數">
                          <CTable
                            small
                            responsive
                            align="middle"
                            className="mb-0 bg-white"
                          >
                            <CTableHead>
                              <CTableRow className="text-center">
                                <CTableHeaderCell>ID</CTableHeaderCell>
                                <CTableHeaderCell>Property No</CTableHeaderCell>
                                <CTableHeaderCell>Estimate</CTableHeaderCell>
                                <CTableHeaderCell>CalibrDate</CTableHeaderCell>
                                <CTableHeaderCell>
                                  Report/Files
                                </CTableHeaderCell>
                                <CTableHeaderCell>Factory</CTableHeaderCell>
                                <CTableHeaderCell>Status</CTableHeaderCell>
                                <CTableHeaderCell>Remark</CTableHeaderCell>
                              </CTableRow>
                            </CTableHead>
                            <CTableBody>
                              {item.actualItems.length === 0 && (
                                <CTableRow>
                                  <CTableDataCell
                                    colSpan={7}
                                    className="text-center text-muted py-4"
                                  >
                                    No actual completed records.
                                  </CTableDataCell>
                                </CTableRow>
                              )}
                              {item.actualItems.map((detail) => (
                                <CTableRow
                                  key={`actual-${detail.id}`}
                                  className="text-center"
                                >
                                  <CTableDataCell>{detail.id}</CTableDataCell>
                                  <CTableDataCell>
                                    {detail.property_no || '-'}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {formatDate(detail.due_date)}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {formatDate(
                                      detail.change_date || detail.created_at
                                    )}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {detail.calibration_log_file.map((file) => (
                                      <div
                                        className="d-flex align-items-center justify-content-center"
                                        key={index}
                                      >
                                        <button
                                          key={file.id}
                                          className="center-flex border border-2 border-dark p-2 rounded h5 fw-bold m-0"
                                          title={file.file.name}
                                          onClick={() =>
                                            handlePreviewFile(file)
                                          }
                                        >
                                          <div className={styles.imgbox}>
                                            <Image
                                              src={file.icon}
                                              alt="file-icon"
                                              width={20}
                                              height={20}
                                            />
                                          </div>
                                          {truncateFileName(file.file.name)}
                                        </button>
                                      </div>
                                    ))}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {detail.factory || '-'}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {detail.status || '-'}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {detail.remark || '-'}
                                  </CTableDataCell>
                                </CTableRow>
                              ))}
                            </CTableBody>
                          </CTable>
                        </DetailSection>
                      )}

                      {showDelayDetail && (
                        <DetailSection title="逾期未校正件數">
                          <CommonDetailTable
                            columns={delayColumns}
                            data={item.delayItems}
                            emptyText="No overdue records."
                          />
                        </DetailSection>
                      )}
                    </Fragment>
                  )
                })}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      <ClientOnly>
        <CModal
          visible={Boolean(chartType)}
          onClose={() => {
            setChartType(null)
            setIsModalReady(false)
          }}
          size="lg"
          alignment="center"
          onShow={() => setIsModalReady(true)}
        >
          <CModalHeader>
            <CModalTitle>
              {chartType ? CHART_CONFIG[chartType].title : ''}
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className={styles.chartPanel}>
              {chartRows.length === 0 && (
                <div className="text-center text-muted py-4">
                  No chart data available.
                </div>
              )}
              {chartRows.length > 0 && (
                <>
                  <div className={styles.chartCanvasShell}>
                    <canvas ref={chartCanvasRef} />
                  </div>
                  <div className={`${styles.chartSummaryList} p`}>
                    {chartRows.map((item) => (
                      <div
                        key={`${chartType}-summary-${item.dept}`}
                        className={styles.chartSummaryItem}
                      >
                        {item.dept}:{item.value}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CModalBody>
        </CModal>
      </ClientOnly>

      <ClientOnly>
        <CModal
          visible={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          size="xl"
        >
          <CModalHeader>
            <CModalTitle>
              <div className="d-flex align-items-center justify-content-between gap-2">
                Total Summary{' '}
                <CButton
                  color="success"
                  variant="outline"
                  className="d-flex align-items-center gap-2"
                  onClick={() => downloadTotalSummaryExcel()}
                >
                  Download Excel
                </CButton>
              </div>
            </CModalTitle>
          </CModalHeader>
          <CModalBody className="p-0">
            <div className="table-responsive p">
              <CommonDetailTable
                columns={totalSummaryColumns}
                data={pagedReportData}
                emptyText="No summary data found."
              />
              <Pagination
                page={pages}
                totalPages={totalPages}
                onPageChange={(newPage) => handleChangePage(newPage)}
              />
            </div>
          </CModalBody>
        </CModal>
      </ClientOnly>
    </>
  )
}
