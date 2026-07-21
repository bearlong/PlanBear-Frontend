import React, { useState, useEffect } from 'react'
import {
  CButton,
  CContainer,
  CRow,
  CCol,
  CButtonGroup,
  CFormInput,
  CFormSelect,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormTextarea,
  CFormCheck,
} from '@coreui/react'
import styles from '@/styles/application.module.scss'
import { api } from '@/utils/api'
import Image from 'next/image'
import { FaXmark } from 'react-icons/fa6'
import useFileManagement from '@/hooks/useFileManagement'
import CheckFactory from './checkFactory'
import SelectForm from './selectForm'
import Swal from 'sweetalert2'

export default function AddParts({
  itemAP,
  setItemAP,
  handleGetRateKeyDown,
  handleAddPARTS,
  handleConfirmDeleteRow,
  handleCloseModalAP,
  sapSourcer,
}) {
  const rate = {
    USD: {
      USD: 1,
      TWD: 32.418,
      RMB: 7.14,
      JPY: 141.65,
      GBP: 0.78,
      HKD: 7.82,
      VND: 23485,
      CNY: 7.14,
      EUR: 0.91,
    },
    TWD: {
      USD: 0.03085,
      TWD: 1,
      RMB: 0.22,
      JPY: 4.37,
      GBP: 0.024,
      HKD: 0.24,
      VND: 725,
      CNY: 0.22,
      EUR: 0.028,
    },
    RMB: {
      USD: 0.14,
      TWD: 4.55,
      RMB: 1,
      JPY: 19.85,
      GBP: 0.11,
      HKD: 1.09,
      VND: 3295,
      CNY: 1,
      EUR: 0.13,
    },
    JPY: {
      USD: 0.007,
      TWD: 0.23,
      RMB: 0.05,
      JPY: 1,
      GBP: 0.0055,
      HKD: 0.055,
      VND: 166,
      CNY: 0.05,
      EUR: 0.0065,
    },
    GBP: {
      USD: 1.28,
      TWD: 41.68,
      RMB: 8.97,
      JPY: 181.6,
      GBP: 1,
      HKD: 9.99,
      VND: 30060,
      CNY: 8.97,
      EUR: 1.17,
    },
    HKD: {
      USD: 0.13,
      TWD: 4.13,
      RMB: 0.91,
      JPY: 18.17,
      GBP: 0.1,
      HKD: 1,
      VND: 3010,
      CNY: 0.91,
      EUR: 0.12,
    },
    VND: {
      USD: 0.000043,
      TWD: 0.00138,
      RMB: 0.0003,
      JPY: 0.006,
      GBP: 0.000033,
      HKD: 0.00033,
      VND: 1,
      CNY: 0.0003,
      EUR: 0.000039,
    },
    CNY: {
      USD: 0.14,
      TWD: 4.55,
      RMB: 1,
      JPY: 19.85,
      GBP: 0.11,
      HKD: 1.09,
      VND: 3295,
      CNY: 1,
      EUR: 0.13,
    },
    EUR: {
      USD: 1.1,
      TWD: 35.74,
      RMB: 7.54,
      JPY: 156.1,
      GBP: 0.85,
      HKD: 8.53,
      VND: 25870,
      CNY: 7.54,
      EUR: 1,
    },
  }

  const { handleFileUpload, handleDeleteFile, handlePreview } =
    useFileManagement()
  const [visibleModal, setVisibleModal] = useState({
    Factory: false,
    Vendor: false,
    Brand: false,
  })
  const [sourcerOption, setSourcerOption] = useState([])
  const [selectedCountries, setSelectedCountries] = useState([])
  const [prevQuery, setPrevQuery] = useState(null)

  const handleInput = (id, fieldName, value) => {
    const newItem = itemAP.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          [fieldName]: value,
        }
      }
      return item
    })
    setItemAP(newItem)
  }
  const handleDeletePart = (id) => {
    const newItem = itemAP.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          Vendor: '',
          Parts: '',
          Description: '',
          LastPutPrice: '',
          CurrencyOld: 'NTD',
          CostDown: '',
        }
      }
      return item
    })
    setItemAP(newItem)
  }

  const getUpdateVendor = (value) => {
    const vendorValue = value.firstItem

    const currency = vendorValue.currency || 'USD'
    const newItem = itemAP.map((item) => {
      if (item.id === 'AP') {
        return {
          ...item,
          Vendor: {
            display: `(${vendorValue.code})${vendorValue.name}`, // 顯示用
            code: vendorValue.code, // 傳輸後端用
          },
          CurrencyOld: currency,
          CurrencyNew: currency,
          CostDown: '',
        }
      }
      return item
    })

    setItemAP(newItem)
  }

  const getUpdateBrand = (value) => {
    const brand = value.firstItem
    const parts = value.secondItem
    const newItem = itemAP.map((item) => {
      if (item.id === 'AP') {
        return {
          ...item,
          Brand: {
            display: `(${brand.code})${brand.name}`, // 顯示用
            code: brand.code, // 傳輸後端用
          },
          Parts: parts.name,
          Description: parts.description,
          CostDown: '',
        }
      }
      return item
    })
    setItemAP(newItem)
  }

  const openModal = (value) => {
    setVisibleModal((prevState) => ({
      ...prevState,
      [value]: true,
    }))
  }

  const closeModal = (value) => {
    setVisibleModal((prevState) => ({
      ...prevState,
      [value]: false,
    }))
  }

  const getUpdateFactory = (id, value) => {
    const updatedFactoryData = {
      display: value.name, // 將 name 改為 display
      code: value.code, // 保持 code 不變
    }
    const newItem = itemAP.map((item) => {
      if (item.id === id) {
        return { ...item, Factory: updatedFactoryData }
      }
      return item
    })

    setItemAP(newItem)
  }

  const getLastPrice = async (
    factoryCode,
    brandCode,
    vendorCode,
    buyerCode,
    parts
  ) => {
    const url = new URL(api('/last-price'))

    // 將查詢參數加到 URL
    url.search = new URLSearchParams({
      factoryCode,
      brandCode,
      vendorCode,
      buyerCode,
      parts,
    }).toString()
    const method = 'GET'
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Failed to fetch last price')

      return await response.json()
    } catch (err) {
      console.error('Error fetching last price:', err)
      return null
    }
  }

  const getOriginCountry = async () => {
    const url = new URL(api('/origin-countries'))

    const method = 'GET'
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch last price')

      return await response.json()
    } catch (err) {
      console.error('Error fetching last price:', err)
      return null
    }
  }

  const handleOriginCountry = async () => {
    if (selectedCountries.length > 0) return
    const originCountry = await getOriginCountry()
    console.log(originCountry)
    if (originCountry.status === 'success') {
      setSelectedCountries(originCountry.data)
    }
  }

  const handleUpdateCountry = (e) => {
    const value = e.target.value
    if (itemAP[0].PlaceOfOrigin.includes(value)) return
    const newItem = itemAP.map((item) => {
      if (item.id === 'AP') {
        return {
          ...item,
          PlaceOfOrigin: [...item.PlaceOfOrigin, e.target.value],
        }
      }
      return item
    })
    setItemAP(newItem)
  }

  const handleDeleteCountry = (value) => {
    const newItemPlaceOfOrigin = itemAP[0].PlaceOfOrigin.filter(
      (item) => item !== value
    )
    const newItem = itemAP.map((item) => {
      if (item.id === 'AP') {
        return { ...item, PlaceOfOrigin: newItemPlaceOfOrigin }
      }
      return item
    })
    setItemAP(newItem)
  }

  useEffect(() => {
    if (sapSourcer) {
      setSourcerOption(sapSourcer)
    }
  }, [sapSourcer])

  useEffect(() => {
    if (!itemAP.length) return
    const { Buyer, Factory, Parts, Brand, Vendor } = itemAP[0] || {}
    if (
      !Factory?.code ||
      !Brand?.code ||
      !Vendor?.code ||
      !Buyer?.code ||
      !Parts
    )
      return
    // 檢查這些欄位是否都有值且不為空
    const currentQuery = JSON.stringify({
      Factory: Factory.code,
      Brand: Brand.code,
      Vendor: Vendor.code,
      Buyer: Buyer.code,
      Parts,
    })
    // 如果條件沒有變動，則不執行 API 請求
    if (currentQuery === prevQuery) return
    if (!prevQuery) return
    const fetchLastPrice = async () => {
      const data = await getLastPrice(
        Factory.code,
        Brand.code,
        Vendor.code,
        Buyer.code,
        Parts
      )
      if (data.status === 'success') {
        const { currency, lastprice } = data.data || {}
        setItemAP((prev) =>
          prev.map((item) =>
            item.id === 'AP'
              ? {
                  ...item,
                  LastPutPrice: lastprice || '0',
                  CurrencyOld: currency || 'USD',
                  UnitPrice: '',
                  CostDown: '',
                }
              : item
          )
        )
      }
    }
    fetchLastPrice()
  }, [
    itemAP[0]?.Buyer?.code,
    itemAP[0]?.Factory?.code,
    itemAP[0]?.Brand?.code,
    itemAP[0]?.Vendor?.code,
    itemAP[0]?.Parts,
  ])

  useEffect(() => {
    const { Buyer, Factory, Parts, Brand, Vendor } = itemAP[0] || {}
    const currentQuery = JSON.stringify({
      Factory: Factory.code,
      Brand: Brand.code,
      Vendor: Vendor.code,
      Buyer: Buyer.code,
      Parts,
    })
    // 如果條件沒有變動，則不執行 API 請求
    setPrevQuery(currentQuery)
  }, [itemAP[0]])
  return (
    <>
      (
      <CModal
        alignment="center"
        size="lg"
        visible={true}
        onClose={() => handleCloseModalAP()}
        aria-labelledby={`modelAP`}
        backdrop="static"
      >
        <CModalHeader className="text-center center-flex" closeButton={false}>
          <CModalTitle id={`modelAP`} className="primary h3 ">
            <Image
              className="me-2 "
              src="/img/logo.png"
              width={30}
              height={30}
              alt="logo"
            />
            Multiple EDIT TOOLS
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CContainer className="border h3 border-3">
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                APPLY NO
              </CCol>
              <CCol className="py-4 border border-3">
                {itemAP.find((i) => i.id === 'AP')?.apply_no}
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                Buyer
              </CCol>
              <CCol className="py-4 border border-3">
                <CFormSelect
                  aria-label="Default select example"
                  options={[
                    { label: '', value: '' },
                    ...sourcerOption.map((item) => {
                      return {
                        label: item.name,
                        value: JSON.stringify(item),
                      }
                    }),
                  ]}
                  onChange={(e) => {
                    const selectedItem = JSON.parse(e.target.value)
                    handleInput('AP', 'Buyer', selectedItem)
                  }}
                  value={
                    JSON.stringify(itemAP.find((i) => i.id === 'AP')?.Buyer) ||
                    ''
                  }
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                Factory
              </CCol>
              <CCol className="py-4 border border-3">
                {' '}
                <div className="center-flex position-relative">
                  <CFormInput
                    type="text"
                    value={
                      itemAP.find((i) => i.id === 'AP')?.Factory.display || ''
                    }
                    onChange={(e) => {
                      handleInput('AP', 'Factory', e.target.value)
                    }}
                  />
                  <CButton
                    color="primary"
                    onClick={() => {
                      if (!itemAP[0].Buyer) {
                        Swal.fire({
                          title: 'Please select buyer first!',
                          text: 'You need to choose a buyer to proceed.',
                          icon: 'error',
                        })
                        return
                      }
                      openModal('Factory')
                    }}
                  >
                    Select
                  </CButton>

                  <CheckFactory
                    item={{ id: 'AP', Factory: itemAP[0].Factory }}
                    getUpdateFactory={getUpdateFactory}
                    visible={visibleModal.Factory}
                    onCloseVisible={() => {
                      closeModal('Factory')
                    }}
                  />
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                VENDOR
              </CCol>
              <CCol className="py-4 border border-3">
                <div className="d-flex  justify-content-center align-items-center">
                  <CFormInput
                    type="text"
                    disabled
                    onChange={(e) =>
                      handleInput('AP', 'Vendor', e.target.value)
                    }
                    value={
                      itemAP.find((i) => i.id === 'AP')?.Vendor.display || ''
                    }
                  />
                  <CButtonGroup role="group" aria-label="Basic example">
                    <CButton
                      color="primary"
                      onClick={() => {
                        if (!itemAP[0].Factory) {
                          Swal.fire({
                            title: 'Please select factory first!',
                            text: 'You need to choose a factory to proceed.',
                            icon: 'error',
                          })
                          return
                        }
                        openModal('Vendor')
                      }}
                    >
                      Select
                    </CButton>
                    <CButton
                      color="primary"
                      onClick={() => {
                        handleDeletePart('AP')
                      }}
                    >
                      Del
                    </CButton>
                  </CButtonGroup>
                </div>
                <SelectForm
                  item={itemAP[0]}
                  getUpdateItem={getUpdateVendor}
                  visible={visibleModal.Vendor}
                  onCloseVisible={() => {
                    closeModal('Vendor')
                  }}
                  type={'vendors'}
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                Brand
              </CCol>
              <CCol className="py-4 border border-3">
                <div className="d-flex  justify-content-center align-items-center">
                  <CFormInput
                    type="text"
                    disabled
                    onChange={(e) => handleInput('AP', 'Brand', e.target.value)}
                    value={
                      itemAP.find((i) => i.id === 'AP')?.Brand.display || ''
                    }
                  />
                  <CButtonGroup role="group" aria-label="Basic example">
                    <CButton
                      color="primary"
                      onClick={() => {
                        if (!itemAP[0].Vendor) {
                          Swal.fire({
                            title: 'Please select vendor first!',
                            text: 'You need to choose a vendor to proceed.',
                            icon: 'error',
                          })
                          return
                        }
                        openModal('Brand')
                      }}
                    >
                      Select
                    </CButton>
                    <CButton
                      color="primary"
                      onClick={() => {
                        handleDeletePart('AP')
                      }}
                    >
                      Del
                    </CButton>
                  </CButtonGroup>
                  <SelectForm
                    item={itemAP[0]}
                    getUpdateItem={getUpdateBrand}
                    visible={visibleModal.Brand}
                    onCloseVisible={() => {
                      closeModal('Brand')
                    }}
                    type={'brands'}
                  />
                </div>
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                PART NO
              </CCol>
              <CCol className="py-4 border border-3">
                <CFormTextarea
                  id={`inputVendorAP`}
                  rows={3}
                  disabled
                  value={itemAP.find((i) => i.id === 'AP')?.Parts || ''}
                ></CFormTextarea>
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                Order Sharerate
              </CCol>
              <CCol className="py-4 border border-3 d-flex">
                <CFormInput
                  className={styles.ch7}
                  type="text"
                  maxLength={4}
                  onChange={(e) =>
                    handleInput('AP', 'OrderSharerate', e.target.value)
                  }
                  value={
                    itemAP.find((i) => i.id === 'AP')?.OrderSharerate || ''
                  }
                />
                ％
              </CCol>
            </CRow>

            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                LAST PRICE
              </CCol>
              <CCol className="py-4 border border-3 d-flex">
                <CFormInput
                  type="text"
                  className={styles.ch10}
                  onChange={(e) =>
                    handleInput('AP', 'LastPutPrice', e.target.value)
                  }
                  value={itemAP.find((i) => i.id === 'AP')?.LastPutPrice || ''}
                  disabled
                />
                <CFormSelect
                  aria-label="Default select example"
                  className={styles.ch10}
                  options={[
                    { label: 'USD', value: 'USD' },
                    { label: 'TWD', value: 'TWD' },
                    { label: 'RMB', value: 'RMB' },
                    { label: 'JPY', value: 'JPY' },
                    { label: 'GBP', value: 'GBP' },
                    { label: 'HKD', value: 'HKD' },
                    { label: 'VND', value: 'VND' },
                    { label: 'CNY', value: 'CNY' },
                    { label: 'EUR', value: 'EUR' },
                  ]}
                  onChange={(e) =>
                    handleInput('AP', 'CurrencyOld', e.target.value)
                  }
                  value={itemAP.find((i) => i.id === 'AP')?.CurrencyOld || ''}
                  disabled
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                UNIT PRICE
              </CCol>
              <CCol className="py-4 border border-3">
                <div className="d-flex justify-content-start align-items-center mb-2">
                  <CFormInput
                    type="text"
                    className={styles.ch10}
                    id="AP"
                    onChange={(e) =>
                      handleInput('AP', 'UnitPrice', e.target.value)
                    }
                    onKeyDown={handleGetRateKeyDown}
                    value={itemAP.find((i) => i.id === 'AP')?.UnitPrice || ''}
                  />
                  <CFormSelect
                    aria-label="Default select example"
                    className={styles.ch10}
                    options={[
                      { label: 'USD', value: 'USD' },
                      { label: 'TWD', value: 'TWD' },
                      { label: 'RMB', value: 'RMB' },
                      { label: 'JPY', value: 'JPY' },
                      { label: 'GBP', value: 'GBP' },
                      { label: 'HKD', value: 'HKD' },
                      { label: 'VND', value: 'VND' },
                      { label: 'CNY', value: 'CNY' },
                      { label: 'EUR', value: 'EUR' },
                    ]}
                    onChange={(e) =>
                      handleInput('AP', 'CurrencyNew', e.target.value)
                    }
                    value={itemAP.find((i) => i.id === 'AP')?.CurrencyNew || ''}
                  />
                  <p className="m-0 p-0">Rate:</p>
                  <CFormInput
                    type="text"
                    className={styles.ch10}
                    onChange={(e) => handleInput('AP', 'Rate', e.target.value)}
                    value={
                      rate[itemAP[0].CurrencyOld][itemAP[0].CurrencyNew] || ''
                    }
                  />
                </div>
                <CFormInput
                  type="date"
                  className="mb-2"
                  onChange={(e) =>
                    handleInput('AP', 'EffectiveDate', e.target.value)
                  }
                  value={itemAP.find((i) => i.id === 'AP')?.EffectiveDate || ''}
                />
                <CFormTextarea
                  id={`inputVendorAP`}
                  rows={3}
                  onChange={(e) =>
                    handleInput('AP', 'EffectiveRemark', e.target.value)
                  }
                  value={
                    itemAP.find((i) => i.id === 'AP')?.EffectiveRemark || ''
                  }
                ></CFormTextarea>
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                Cost Down
              </CCol>
              <CCol className="py-4 border border-3 d-flex">
                <CFormInput
                  className={styles.ch10}
                  type="text"
                  disabled
                  onChange={(e) => handleInput('AP', 'Brand', e.target.value)}
                  value={itemAP[0].CostDown}
                />
                ％
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                MOQ
              </CCol>
              <CCol className="py-4 border border-3">
                <CFormInput
                  type="text"
                  maxLength={4}
                  onChange={(e) => handleInput('AP', 'Moq', e.target.value)}
                  value={itemAP.find((i) => i.id === 'AP')?.Moq || ''}
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                MPQ
              </CCol>
              <CCol className="py-4 border border-3">
                <CFormInput
                  type="text"
                  maxLength={4}
                  onChange={(e) => handleInput('AP', 'Mpq', e.target.value)}
                  value={itemAP.find((i) => i.id === 'AP')?.Mpq || ''}
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                LEAD TIME
              </CCol>
              <CCol className="py-4 border border-3">
                <CFormInput
                  type="text"
                  maxLength={4}
                  onChange={(e) =>
                    handleInput('AP', 'LeadTime', e.target.value)
                  }
                  value={itemAP.find((i) => i.id === 'AP')?.LeadTime || ''}
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                Vendor Quotation No.
              </CCol>
              <CCol className="py-4 border border-3">
                <CFormInput
                  type="text"
                  onChange={(e) =>
                    handleInput('AP', 'VendorQuotationNo', e.target.value)
                  }
                  value={
                    itemAP.find((i) => i.id === 'AP')?.VendorQuotationNo || ''
                  }
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                File Name
              </CCol>
              <CCol className="py-4 border border-3 center-flex flex-column">
                <CButton color="primary" className="p-0">
                  <label
                    htmlFor={`file-uploadAP`}
                    className="px-2 py-1 btn btn-primary"
                  >
                    Upload
                  </label>
                </CButton>
                <CFormInput
                  type="file"
                  className="d-none"
                  accept=".pdf,.docx,.xlsx" // 限定檔案類型
                  id={`file-uploadAP`}
                  onChange={(e) => {
                    setItemAP(handleFileUpload('AP', itemAP, e))
                  }}
                />
                {itemAP[0].AttachFile?.map((v, index) => (
                  <div className="center-flex mt-2" key={index}>
                    <button
                      className="center-flex border border-2 border-dark p-2 rounded p"
                      onClick={() => {
                        if (v.preview) {
                          handlePreview(v.preview)
                        } else {
                          const filePath = `/apply_data/${v.file.name}`
                          window.open(filePath, '_blank') // 直接開啟
                        }
                      }}
                    >
                      <div className={styles.imgbox}>
                        <Image
                          src={v.icon} // 動態圖示
                          alt="file-icon"
                          width={20}
                          height={20}
                        />
                      </div>
                      {v.file.name.length > 20
                        ? `${v.file.name.slice(0, 20)}...`
                        : v.file.name}
                    </button>
                    <FaXmark
                      size={16}
                      className="text-danger"
                      onClick={() => {
                        setItemAP(handleDeleteFile('AP', itemAP, v.file))
                      }}
                      cursor={'pointer'}
                    ></FaXmark>
                  </div>
                ))}
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                LME(Copper)
              </CCol>
              <CCol className="py-4 border border-3">
                <CFormInput
                  type="text"
                  onChange={(e) => handleInput('AP', 'LME', e.target.value)}
                  value={itemAP.find((i) => i.id === 'AP')?.LME || ''}
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                Quota Date(配額生效日)
              </CCol>
              <CCol className="py-4 border border-3">
                <CFormInput
                  type="date"
                  onChange={(e) =>
                    handleInput('AP', 'QuotaDate', e.target.value)
                  }
                  value={itemAP.find((i) => i.id === 'AP')?.QuotaDate || ''}
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                Annulment Date(單價生效日)
              </CCol>
              <CCol className="py-4 border border-3">
                <CFormInput
                  type="date"
                  onChange={(e) =>
                    handleInput('AP', 'AnnulmentDate', e.target.value)
                  }
                  value={itemAP.find((i) => i.id === 'AP')?.AnnulmentDate || ''}
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                Control Quantity(管控數量)
              </CCol>
              <CCol className="py-4 border border-3">
                <CFormInput
                  type="text"
                  onChange={(e) =>
                    handleInput('AP', 'ControlQuantity', e.target.value)
                  }
                  value={
                    itemAP.find((i) => i.id === 'AP')?.ControlQuantity || ''
                  }
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                Is it the spot price? (是否為現貨價?)
              </CCol>
              <CCol className="py-4 border border-3">
                <CFormCheck
                  inline
                  type="radio"
                  name="IsSpotPrice"
                  id="IsSpotPrice1"
                  value="Y"
                  label="Y"
                  onChange={(e) => {
                    console.log(e.target.value)
                    handleInput('AP', 'IsSpotPrice', e.target.value)
                  }}
                  checked={
                    itemAP.find((i) => i.id === 'AP')?.IsSpotPrice === 'Y'
                  }
                  // value={itemAP.find((i) => i.id === 'AP')?.IsSpotPrice || ''}
                />
                <CFormCheck
                  inline
                  type="radio"
                  name="IsSpotPrice"
                  id="IsSpotPrice2"
                  value="N"
                  label="N"
                  onChange={(e) => {
                    console.log(e.target.value)
                    handleInput('AP', 'IsSpotPrice', e.target.value)
                  }}
                  checked={
                    itemAP.find((i) => i.id === 'AP')?.IsSpotPrice === 'N'
                  }
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                Is it the Unpaid order will take effect? (是否要未交訂單即生效?)
              </CCol>
              <CCol className="py-4 border border-3">
                <CFormCheck
                  inline
                  type="radio"
                  name="IsUnpaidOrderEffective"
                  id="IsUnpaidOrderEffective1"
                  value="Y"
                  label="Y"
                  onChange={(e) => {
                    console.log(e.target.value)
                    handleInput('AP', 'IsUnpaidOrderEffective', e.target.value)
                  }}
                  checked={
                    itemAP.find((i) => i.id === 'AP')
                      ?.IsUnpaidOrderEffective === 'Y'
                  }
                />
                <CFormCheck
                  inline
                  type="radio"
                  name="IsUnpaidOrderEffective"
                  id="IsUnpaidOrderEffective2"
                  value="N"
                  label="N"
                  onChange={(e) => {
                    console.log(e.target.value)
                    handleInput('AP', 'IsUnpaidOrderEffective', e.target.value)
                  }}
                  checked={
                    itemAP.find((i) => i.id === 'AP')
                      ?.IsUnpaidOrderEffective === 'N'
                  }
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol
                className={`${styles.formColor} py-4 border border-3 primary text-center center-flex`}
              >
                place of origin(原產地)
              </CCol>
              <CCol className="py-4 border border-3">
                {itemAP[0]?.PlaceOfOrigin.map((value, i) => {
                  return (
                    <div className="d-flex ps-3" key={i}>
                      <span className={`${styles.tags} center-flex`}>
                        {value}{' '}
                        <FaXmark
                          size={16}
                          className={styles.xmark}
                          onClick={() => {
                            handleDeleteCountry(value)
                          }}
                        ></FaXmark>
                      </span>
                    </div>
                  )
                })}
                <CFormSelect
                  options={[
                    { label: '', value: '' },
                    ...selectedCountries.map((item) => {
                      return {
                        label: `${item.code} ${item.name}`,
                        value: `${item.code} ${item.name}`,
                      }
                    }),
                  ]}
                  onClick={handleOriginCountry}
                  onChange={(e) => handleUpdateCountry(e)}
                />
              </CCol>
            </CRow>
          </CContainer>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="primary"
            onClick={() => {
              handleAddPARTS()
            }}
          >
            {itemAP[0].editAgain ? 'EDIT ITEM' : 'ADD ITEM'}
          </CButton>
          {itemAP[0].editAgain ? (
            <CButton
              color="danger"
              onClick={() => {
                handleConfirmDeleteRow(itemAP[0].editAgain)
              }}
            >
              DELETE
            </CButton>
          ) : (
            ''
          )}
          <CButton
            color="secondary"
            onClick={() => {
              handleCloseModalAP()
            }}
          >
            Exit
          </CButton>
        </CModalFooter>
      </CModal>
      )
    </>
  )
}
