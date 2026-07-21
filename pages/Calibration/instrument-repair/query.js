import React, { useMemo, useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
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
  CBadge,
} from '@coreui/react'
import { FiEye, FiPlus, FiRefreshCw, FiSearch } from 'react-icons/fi'
import { instrumentRepairService } from '@/services/Calibration/instrumentRepair.service'
import styles from '@/styles/calibration.module.scss'
import Pagination from '@/components/common/pagination'

const initialFilters = {
  property_no: '',
  apply_no: '',
  instru_name: '',
  applicant: '',
  start_date: '',
  end_date: '',
  status: 'repairing',
  pages: 1,
}

const FilterField = ({ label, children }) => (
  <div>
    <CFormLabel className="text-muted mb-1 h6">{label}</CFormLabel>
    {children}
  </div>
)

export default function InstrumentRepairQueryPage() {
  const router = useRouter()
  const [filters, setFilters] = useState(initialFilters)
  const [results, setResults] = useState([])
  const [pages, setPages] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts] = useState(0)

  const resultSummary = useMemo(() => {
    return `${counts} record${counts > 1 ? 's' : ''}`
  }, [counts])

  const fetchResults = async (searchParams) => {
    try {
      const result = await instrumentRepairService.getRepairList(searchParams)
      console.log(result)
      setResults(result.data)
      setCounts(result.count)
      setTotalPages(result.totalPages)
    } catch (error) {
      console.error('Error fetching repair list:', error)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSearch = async () => {
    try {
      const searchParams = {
        ...filters,
        pages: 1,
      }
      fetchResults(searchParams)
    } catch (error) {
      console.error('Error fetching repair list:', error)
    }
  }

  const handleReset = () => {
    setFilters(initialFilters)
    fetchResults(initialFilters)
  }

  const handleChangePage = (newPage) => {
    setPages(newPage)
    fetchResults({ ...filters, pages: newPage })
  }

  const handleView = (applyNo) => {
    router.push(`/Calibration/instrument-repair/${applyNo}`)
  }

  useEffect(() => {
    fetchResults(initialFilters)
  }, [])

  return (
    <>
      <Head>
        <title>Gauge Instrument Repair Application Query</title>
      </Head>

      <CContainer fluid className={styles.pageShell}>
        <div className={styles.cardShell}>
          <CCard className={styles.card}>
            <CCardHeader className={styles.cardHeader}>
              <div className="d-flex flex-column gap-2">
                <div>
                  <p className={styles.eyebrow}>Calibration</p>
                  <h2 className={styles.title}>
                    Repair Requests Application Query
                  </h2>
                  <p className={styles.subTitle}>
                    Search repair applications and review current request
                    status.
                  </p>
                </div>
              </div>
            </CCardHeader>

            <CCardBody className={styles.cardBody}>
              <CCard className="border-0 shadow-sm mb-4">
                <CCardHeader className="bg-white border-bottom-0 pt-4 px-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                    <div>
                      <p className="text-muted mb-0">
                        Filter by application number, applicant, date, and
                        repair status.
                      </p>
                    </div>
                    <CButton
                      color="primary"
                      size="lg"
                      className="btn-ph-primary d-inline-flex align-items-center gap-2 px-3"
                      onClick={() =>
                        router.push('/Calibration/instrument-repair')
                      }
                    >
                      <FiPlus />
                      New Repair
                    </CButton>
                  </div>
                </CCardHeader>
                <CCardBody className="pt-2 px-4 pb-4">
                  <CRow className="g-3">
                    <CCol md={6} xl={3}>
                      <FilterField label="Property No">
                        <CFormInput
                          value={filters.property_no}
                          onChange={(event) =>
                            handleFilterChange(
                              'property_no',
                              event.target.value
                            )
                          }
                          placeholder="Enter property no"
                        />
                      </FilterField>
                    </CCol>
                    <CCol md={6} xl={3}>
                      <FilterField label="Apply No">
                        <CFormInput
                          value={filters.apply_no}
                          onChange={(event) =>
                            handleFilterChange('apply_no', event.target.value)
                          }
                          placeholder="Enter apply no"
                        />
                      </FilterField>
                    </CCol>
                    <CCol md={6} xl={3}>
                      <FilterField label="Instrument Name">
                        <CFormInput
                          value={filters.instru_name}
                          onChange={(event) =>
                            handleFilterChange(
                              'instru_name',
                              event.target.value
                            )
                          }
                          placeholder="Enter instrument name"
                        />
                      </FilterField>
                    </CCol>
                    <CCol md={6} xl={3}>
                      <FilterField label="Applicant">
                        <CFormInput
                          value={filters.applicant}
                          onChange={(event) =>
                            handleFilterChange('applicant', event.target.value)
                          }
                          placeholder="Enter applicant username"
                        />
                      </FilterField>
                    </CCol>
                    <CCol md={6} xl={3}>
                      <FilterField label="Apply Date Start">
                        <CFormInput
                          type="date"
                          value={filters.start_date}
                          onChange={(event) =>
                            handleFilterChange('start_date', event.target.value)
                          }
                        />
                      </FilterField>
                    </CCol>
                    <CCol md={6} xl={3}>
                      <FilterField label="Apply Date End">
                        <CFormInput
                          type="date"
                          value={filters.end_date}
                          onChange={(event) =>
                            handleFilterChange('end_date', event.target.value)
                          }
                        />
                      </FilterField>
                    </CCol>
                    <CCol md={6} xl={3}>
                      <FilterField label="Status">
                        <CFormSelect
                          value={filters.status}
                          onChange={(event) =>
                            handleFilterChange('status', event.target.value)
                          }
                        >
                          <option value="All">All</option>
                          <option value="repairing">Repairing</option>
                          <option value="finished">Finished</option>
                        </CFormSelect>
                      </FilterField>
                    </CCol>
                    <CCol xs={12}>
                      <div className="d-flex flex-wrap justify-content-end gap-2 pt-2">
                        <CButton
                          color="primary"
                          size="lg"
                          className="btn-ph-primary d-flex align-items-center gap-2"
                          onClick={handleSearch}
                        >
                          <FiSearch />
                          Search
                        </CButton>
                        <CButton
                          color="primary"
                          variant="outline"
                          size="lg"
                          className="btn-ph-outline-primary d-flex align-items-center gap-2"
                          onClick={handleReset}
                        >
                          <FiRefreshCw />
                          Reset
                        </CButton>
                      </div>
                    </CCol>
                  </CRow>
                </CCardBody>
              </CCard>

              <CCard className="border-0 shadow-sm">
                <CCardHeader className="bg-white border-bottom-0 pt-4 px-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div>
                      <p className="text-muted mb-0">
                        Showing current repair application records
                      </p>
                    </div>
                    <span className="text-muted small p">{resultSummary}</span>
                  </div>
                </CCardHeader>
                <CCardBody className="pt-2 px-4 pb-4">
                  <div className="border rounded-4 shadow-sm bg-white overflow-hidden">
                    <CTable hover responsive align="middle" className="mb-0">
                      <CTableHead>
                        <CTableRow className="text-center fw-bold h4">
                          <CTableHeaderCell className="py-3">
                            Apply No
                          </CTableHeaderCell>
                          <CTableHeaderCell className="py-3">
                            Property No
                          </CTableHeaderCell>
                          <CTableHeaderCell className="py-3">
                            Instrument Name
                          </CTableHeaderCell>
                          <CTableHeaderCell className="py-3">
                            Applicant
                          </CTableHeaderCell>
                          <CTableHeaderCell className="py-3">
                            Apply Date
                          </CTableHeaderCell>
                          <CTableHeaderCell className="py-3">
                            Status
                          </CTableHeaderCell>
                          <CTableHeaderCell className="py-3">
                            Action
                          </CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {results.length > 0 ? (
                          results.map((item) => {
                            return item.gauge_instrument_repair_item.map(
                              (subItem) => (
                                <CTableRow
                                  key={subItem.id}
                                  className="text-center p fw-normal"
                                >
                                  <CTableDataCell className="fw-semibold">
                                    {item.apply_no}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {subItem.property_no}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {subItem.instru_name}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {item.applicant_info}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {item.created_at.slice(0, 10)}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CBadge
                                      className="h6 ms-3"
                                      color={
                                        item.status === 'finished'
                                          ? 'secondary'
                                          : 'success'
                                      }
                                    >
                                      {item.status}
                                    </CBadge>
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CButton
                                      color="primary"
                                      variant="outline"
                                      className="btn-ph-outline-primary d-inline-flex align-items-center gap-2"
                                      size="lg"
                                      onClick={() => handleView(item.apply_no)}
                                    >
                                      <FiEye />
                                      View
                                    </CButton>
                                  </CTableDataCell>
                                </CTableRow>
                              )
                            )
                          })
                        ) : (
                          <CTableRow>
                            <CTableDataCell
                              colSpan={7}
                              className="text-center py-4 text-muted"
                            >
                              No repair applications found.
                            </CTableDataCell>
                          </CTableRow>
                        )}
                      </CTableBody>
                    </CTable>
                    {results.length > 0 && (
                      <Pagination
                        totalPages={totalPages}
                        page={pages}
                        onPageChange={(newPage) => handleChangePage(newPage)}
                      />
                    )}
                  </div>
                </CCardBody>
              </CCard>
            </CCardBody>
          </CCard>
        </div>
      </CContainer>
    </>
  )
}
