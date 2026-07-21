import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import {
  CButton,
  CContainer,
  CRow,
  CCol,
  CFormSelect,
  CTable,
  CFormInput,
  CFormLabel,
} from '@coreui/react'
import styles from '@/styles/signature.module.scss'
import Swal from 'sweetalert2'
import useCompareInfo from '@/hooks/useCompareInfo'
import { AuthContext } from '@/context/AuthContext'
import { logger } from '@/utils/logger'
import Pagination from '@/components/common/pagination'
import usePermissionGuard from '@/hooks/usePermissionGuard'

export default function Query() {
  usePermissionGuard('Procurement')
  const router = useRouter()
  const { user } = React.useContext(AuthContext)
  const { getCompareData, loading, error } = useCompareInfo()
  const isMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

  const columns = [
    {
      key: 'SignNo',
      label: 'Sign No.',
      _props: { scope: 'col' },
    },
    {
      key: 'ApplyNo',
      label: 'Apply No.',
      _props: { scope: 'col' },
    },
    {
      key: 'ApplyName',
      label: 'Apply Name',
      _props: { scope: 'col' },
    },
    {
      key: 'Status',
      label: 'Status',
      _props: { scope: 'col' },
    },
    {
      key: 'ApplyDate',
      label: 'Apply Date',
      _props: { scope: 'col' },
    },
  ]

  const [items, setItems] = useState([])
  const [pages, setPages] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [search, setSearch] = useState({
    apply_no: '',
    searchUsername: '',
    status: '',
    dateStart: '',
    dateEnd: '',
    partsno: '',
  })

  const handleSearchChange = (e, value) => {
    const newSearch = { ...search, [value]: e.target.value }
    setSearch(newSearch)
  }

  const handleSubmitSearch = async () => {
    if (new Date(search.dateEnd) < new Date(search.dateStart)) {
      return Swal.fire({
        title: 'Invalid Date Range',
        text: 'The end date cannot be earlier than the start date.',
        icon: 'error',
      })
    }
    const { username } = user
    const { status, ...searchArr } = search

    const dataDB = await getCompareData(username, status, searchArr, 1)
    logger.info(`Search Submit`, 'Query')
    if (dataDB.status === 'success') {
      const latestData = Object.values(
        dataDB.data.reduce((acc, item) => {
          const key = item.apply_no
          if (!acc[key] || item.version > acc[key].version) {
            acc[key] = item
          }
          return acc
        }, {})
      )
      const sortedSigns = latestData.sort((a, b) => {
        const numA = parseInt(a.sign_number.replace('SG', ''), 10)
        const numB = parseInt(b.sign_number.replace('SG', ''), 10)
        return numA - numB
      })

      setItems(sortedSigns)
      setTotalPages(dataDB.totalPages)
      setPages(1)
    } else {
      setItems([])
    }
  }

  const handlePageChange = async (newPage) => {
    if (new Date(search.dateEnd) < new Date(search.dateStart)) {
      return Swal.fire({
        title: 'Invalid Date Range',
        text: 'The end date cannot be earlier than the start date.',
        icon: 'error',
      })
    }
    const { username } = user
    const { status, ...searchArr } = search

    const dataDB = await getCompareData(username, status, searchArr, newPage)
    logger.info(`Search Submit`, 'Query')
    if (dataDB.status === 'success') {
      const latestData = Object.values(
        dataDB.data.reduce((acc, item) => {
          const key = item.apply_no
          if (!acc[key] || item.version > acc[key].version) {
            acc[key] = item
          }
          return acc
        }, {})
      )
      const sortedSigns = latestData.sort((a, b) => {
        const numA = parseInt(a.sign_number.replace('SG', ''), 10)
        const numB = parseInt(b.sign_number.replace('SG', ''), 10)
        return numA - numB
      })

      setItems(sortedSigns)
      setPages(newPage)
    }
  }

  return (
    <>
      <main className="print-area">
        <div className={`pt-3 container d-flex justify-content-center`}>
          <h1 className={`fw-bold text-center primary center-flex mb-3`}>
            <Image
              className="me-2 "
              src="/img/logo.png"
              width={30}
              height={30}
              alt="logo"
            />
            Request for Quotation Search
          </h1>
        </div>
        <CContainer className="primary pt-3">
          <CRow className="mb-3 h3">
            <CCol className="center-flex" xs={12} lg={4}>
              <div className="w-100">
                <CFormLabel className="h4 fw-normal mb-3">
                  Apply No.：
                </CFormLabel>
                <CFormInput
                  type="text"
                  onChange={(e) => {
                    handleSearchChange(e, 'apply_no')
                  }}
                  size="lg"
                  value={search.apply_no || ''}
                />
              </div>
            </CCol>
            <CCol className="center-flex" xs={12} lg={4}>
              <div className="w-100">
                <CFormLabel className="h4 fw-normal mb-3">status：</CFormLabel>
                <CFormSelect
                  options={[
                    { label: '', value: '' },
                    { label: 'Sign', value: 'Sign' },
                    { label: 'close', value: 'close' },
                    { label: 'reject', value: 'reject' },
                    { label: 'resend', value: 'resend' },
                    { label: 'destroy', value: 'destroy' },
                  ]}
                  onChange={(e) => {
                    handleSearchChange(e, 'status')
                  }}
                  size="lg"
                  value={search.status || ''}
                />
              </div>
            </CCol>
            <CCol className={`center-flex`} xs={12} lg={4}>
              <div className="w-100">
                <CFormLabel className="h4 fw-normal mb-3">Part No：</CFormLabel>
                <CFormInput
                  type="text"
                  onChange={(e) => {
                    handleSearchChange(e, 'partsno')
                  }}
                  size="lg"
                  value={search.partsno || ''}
                />
              </div>
            </CCol>
          </CRow>
          <CRow className="mb-3 h3">
            <CCol className="center-flex  mb-3 mb-lg-0" xs={12} lg={8}>
              <div className="w-100">
                <CFormLabel className="h4 fw-normal mb-3">
                  ApplyDate：
                </CFormLabel>
                <div className="center-flex">
                  <CFormInput
                    type="date"
                    onChange={(e) => {
                      handleSearchChange(e, 'dateStart')
                    }}
                    size="lg"
                    value={search.dateStart || ''}
                  />
                  <span className="mx-2">~</span>
                  <CFormInput
                    type="date"
                    onChange={(e) => {
                      handleSearchChange(e, 'dateEnd')
                    }}
                    size="lg"
                    value={search.dateEnd || ''}
                  />
                </div>
              </div>
            </CCol>
            <CCol className={`center-flex`} xs={12} lg={4}>
              <div className="w-100">
                <CFormLabel className="h4 fw-normal mb-3">
                  username：
                </CFormLabel>
                <CFormInput
                  type="text"
                  onChange={(e) => {
                    handleSearchChange(e, 'searchUsername')
                  }}
                  size="lg"
                  value={search.searchUsername || ''}
                />
              </div>
            </CCol>
          </CRow>
          <CRow className="h3">
            <CCol className="p-0 center-flex mb-3" xs={12} lg={4}>
              <CButton
                color="primary"
                className={`btn-ph-primary ${styles.ch15}`}
                onClick={handleSubmitSearch}
              >
                Search
              </CButton>
            </CCol>
          </CRow>
        </CContainer>
        <CContainer>
          {items.length === 0 ? (
            <div className="text-center p">
              <h2>No matching results found.</h2>
            </div>
          ) : (
            <div>
              <CTable
                className={`p fw-normal text-center mb-5 ${styles.signList} `}
                columns={columns}
                items={items.map((item, i) => ({
                  ...item,
                  SignNo: <>{item.sign_number}</>,
                  ApplyNo: (
                    <>
                      <Link href={`/Procurement/Application/${item.apply_no}`}>
                        {item.apply_no}
                      </Link>
                    </>
                  ),
                  ApplyName: <>{item.buyer}</>,
                  Status: <>{item.status}</>,
                  ApplyDate: <>{item.apply_date}</>,

                  _cellProps: { id: { scope: 'row' } },
                }))}
                bordered
                borderColor="primary"
                tableHeadProps={{
                  color: 'primary',
                }}
                color="light"
              />
              {totalPages > 1 && (
                <Pagination
                  totalPages={totalPages}
                  page={pages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          )}
        </CContainer>
      </main>
    </>
  )
}
