import React, { useState, useEffect, useCallback } from 'react'
import { api } from '@/utils/api'
import {
  CButton,
  CFormInput,
  CFormCheck,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormTextarea,
  CInputGroup,
} from '@coreui/react'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import Swal from 'sweetalert2'
import styles from '@/styles/selectForm.module.scss'
import Pagination from '../common/pagination'

export default function SelectForm({
  item,
  getUpdateItem,
  visible,
  onCloseVisible,
  type,
}) {
  const [visibleUnit, setVisibleUnit] = useState(visible)
  const [inputValue, setInputValue] = useState([])
  const [query, setQuery] = useState('')
  const [subData, setSubData] = useState([])
  const [searchData, setSearchData] = useState([])
  const [search, setSearch] = useState('')
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSub, setPageSub] = useState(1)
  const [totalPagesSub, setTotalPagesSub] = useState(0)
  const [submitItem, setSubmitItem] = useState({
    firstItem: {},
    secondItem: {},
  })

  const handleCloseModal = (id = '') => {
    setVisibleUnit(false)
    onCloseVisible()
  }

  const handleInputKeyDown = (e, searchType) => {
    if (e.key === 'Enter') {
      if (searchType === 'search') {
        handleSearch(e.target.value, type, 1)
        setQuery(e.target.value)
      } else if (searchType === 'subSearch') {
        handleSearchSub()
      }
    }
  }

  const buildQueryString = (params) =>
    Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null) // 過濾 undefined 和 null 的參數
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join('&')

  const getData = async (query, vendor, parts, brand, type, page = 1) => {
    const params = { search: query, vendor, parts, brand }
    const queryString = buildQueryString(params)
    const url = api(`/${type}?${queryString}&page=${page}`)
    const method = 'GET'
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      const result = await response.json()

      return result
    } catch (err) {
      console.log(err)
    }
  }

  const handleSearch = async (query, type, page = 1, isSub = false) => {
    try {
      if (Object.keys(submitItem.firstItem).length === 0 && isSub) {
        return
      }
      const vendor = item.Vendor?.id
      const brand = item.Brand?.id
      const parts = item.Parts?.id
      let newType = type
      if (isSub && type === 'brands') {
        newType = 'parts'
      } else if (isSub && type === 'parts') {
        newType = 'brand'
      }
      const dataDB = await getData(query, vendor, parts, brand, newType, page)
      if (isSub) {
        setPageSub(page)
      } else {
        setPage(page)
      }

      if (dataDB.status === 'success') {
        if (isSub) {
          setSearchData(dataDB.data)
          setSubData(dataDB.data)
        } else {
          setData(dataDB.data)
        }
        // setData(dataDB.data)
        if (dataDB.totalPages && dataDB.totalPages !== totalPages) {
          if (isSub) {
            setTotalPagesSub(dataDB.totalPages)
          } else {
            setTotalPages(dataDB.totalPages)
          }
        }
      } else {
        throw new Error('No data found')
      }
    } catch (error) {
      console.error('handleSearch Error:', error)
      if (isSub) {
        setSearch('')
      } else {
        setSearch('')
      }

      Swal.fire({
        title: 'Error',
        text: error.message || 'Something went wrong while fetching data.',
        icon: 'error',
      })
    }
  }

  const handleSearchSub = () => {
    const query = search.trim()
    handleSearch(query, type, 1, true)

    // handleSelectParts()
    // if (query) {
    //   const filteredData = subData.filter((item) => {
    //     return Object.values(item).some((value) =>
    //       String(value).toLowerCase().includes(query.toLowerCase())
    //     )
    //   })
    //   setSearchData(filteredData)
    // } else {
    //   setSearchData(subData)
    // }
  }

  const handleClose = () => {
    resetInfo()
  }

  const resetInfo = () => {
    setInputValue([])
    setData([])
    setSubData([])
    setSearchData([])
    setTotalPages(0)
    setPage(1)
    setTotalPagesSub(0)
    setPageSub(1)
    setSearch('')
    setQuery('')
    setSubmitItem({
      firstItem: {},
      secondItem: {},
    })
  }

  const handleAddVendor = () => {
    if (Object.keys(submitItem.firstItem).length !== 0) {
      // 將選中的 Vendor 添加到輸入清單
      setInputValue([
        `${type === 'brands' ? `(${submitItem.firstItem.code})` : ''}${
          submitItem.firstItem.name
        }`,
      ])
    } else {
      Swal.fire({
        title: 'Please select vendor.',
        text: 'No vendor selected.',
        icon: 'error',
      })
    }
  }

  const updateItem = (item) => {
    if (Object.keys(item.firstItem).length !== 0) {
      getUpdateItem(item)
    }
  }

  useEffect(() => {
    setVisibleUnit(visible)
  }, [visible])

  return (
    <>
      <CModal
        alignment="center"
        visible={!!visibleUnit}
        onClose={() => handleCloseModal(item.id)}
        aria-labelledby={`model${item.id}`}
        backdrop="static"
        size="lg"
      >
        <CModalHeader className="text-center" closeButton={false}>
          <CModalTitle id={`model${item.id}`} className="primary h3 fw-bold">
            Select{' '}
            {type === 'vendors'
              ? 'Vendor'
              : type === 'parts'
              ? 'Parts'
              : 'Brand'}{' '}
            Form
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {!(type === 'vendors') && (
            <div className="mb-2 border  border-1 p-2 border-secondary-subtle">
              <h3 className="primary fw-bold">
                Input {type === 'parts' ? 'Parts' : 'Brand'} List
              </h3>
              <CFormTextarea
                id={`inputVendor${item.id}`}
                rows={3}
                disabled
                value={inputValue.join('\n')}
              ></CFormTextarea>
            </div>
          )}
          <div className="mb-2 border  border-1 p-2 border-secondary-subtle">
            <h4 className="primary fw-bold">
              Search{' '}
              {type === 'vendors'
                ? 'Vendor'
                : type === 'parts'
                ? 'Parts'
                : 'Brand'}{' '}
              Name
            </h4>
            <span className="h5">
              (Search EX:{' '}
              <span className="text-primary">TOKYO PARTS(東京元件)</span> Search
              Input: <span className="text-danger">T </span>
              <span className="text-danger-emphasis">ENTER</span> )
            </span>
            <CFormInput
              type="text"
              onKeyDown={(e) => {
                handleInputKeyDown(e, 'search')
              }}
              size="lg"
            />
          </div>
          <div className="mb-2 border  border-1 p-2 border-secondary-subtle">
            <h4 className="primary fw-bold">
              Select{' '}
              {type === 'vendors'
                ? 'Vendor'
                : type === 'parts'
                ? 'Parts'
                : 'Brand'}
            </h4>

            {data.map((item) => {
              return (
                <CFormCheck
                  className="h4"
                  key={item.id}
                  type="radio"
                  name={`vendor${item.id}`}
                  id={`vendor${item.id}`}
                  value={item}
                  label={
                    type !== 'parts' ? (
                      <>{`(${item.code.trim()})${item.name}`}</>
                    ) : (
                      <>
                        {item.name}
                        <span style={{ color: 'blue' }}>
                          {' '}
                          ({item.description})
                        </span>
                      </>
                    )
                  }
                  onChange={() => {
                    setSubmitItem({ ...submitItem, firstItem: item })
                  }}
                  checked={submitItem.firstItem === item}
                />
              )
            })}
            <Pagination
              totalPages={totalPages}
              page={page}
              onPageChange={(newPage) => handleSearch(query, type, newPage)}
            />
          </div>
          {!(type === 'vendors') && (
            <div className="mb-2 border  border-1 p-2 border-secondary-subtle">
              <h4 className="primary fw-bold">
                Select {type === 'parts' ? 'Brand' : 'Parts'}
              </h4>
              {subData.length > 0 ? (
                <div className="center-flex">
                  <CInputGroup className="mb-3">
                    <CButton color="primary" size="lg">
                      <FaMagnifyingGlass
                        size={16}
                        onClick={() => {
                          handleSearchSub()
                        }}
                      />
                    </CButton>
                    <CFormInput
                      onChange={(e) => {
                        setSearch(e.target.value)
                      }}
                      onKeyDown={(e) => {
                        handleInputKeyDown(e, 'subSearch')
                      }}
                      value={search}
                      size="lg"
                    />
                  </CInputGroup>
                </div>
              ) : (
                ''
              )}
              {searchData.map((p, i) => {
                return (
                  <CFormCheck
                    className="h4"
                    key={i}
                    type={`radio`}
                    name={`parts${item.id}`}
                    id={`parts${i}_${item.id}`}
                    value={p.id}
                    label={
                      type !== 'parts' ? (
                        <>
                          {p.name}
                          <span style={{ color: 'blue' }}>
                            {' '}
                            ({p.description})
                          </span>
                        </>
                      ) : (
                        <>{`(${p.code})${p.name}`}</>
                      )
                    }
                    onChange={() => {
                      setSubmitItem({ ...submitItem, secondItem: p })
                    }}
                    checked={submitItem.secondItem === p}
                  />
                )
              })}
              <Pagination
                totalPages={totalPagesSub}
                page={pageSub}
                onPageChange={(newPage) =>
                  handleSearch(search, type, newPage, true)
                }
              />
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              handleCloseModal(item.id)
              handleClose()
            }}
            size="lg"
          >
            Close
          </CButton>
          {!(type === 'vendors') && (
            <CButton
              color="primary"
              onClick={() => {
                handleAddVendor()
                handleSearch('', type, 1, true)
                setData([])
                setTotalPages(0)
                setPage(1)
                setQuery('')
              }}
              size="lg"
            >
              ADD Brand
            </CButton>
          )}
          <CButton
            color="primary"
            onClick={() => {
              updateItem(submitItem)
              handleCloseModal(item.id)
              handleClose()
            }}
            size="lg"
          >
            Send OK
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}
