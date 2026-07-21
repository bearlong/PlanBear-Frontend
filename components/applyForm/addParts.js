import React, { useState, useEffect } from 'react'
import { api } from '@/utils/api'
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
  CFormLabel,
  CInputGroup,
} from '@coreui/react'
import styles from '@/styles/application.module.scss'
import Image from 'next/image'
import {
  FaXmark,
  FaArrowUpFromBracket,
  FaPenToSquare,
  FaRegSquarePlus,
  FaRegTrashCan,
  FaRegCircleXmark,
} from 'react-icons/fa6'
import useFileManagement from '@/hooks/useFileManagement'
import CheckFactory from './checkFactory'
import SelectForm from './selectForm'
import Swal from 'sweetalert2'
import Select from 'react-select'
import { logger } from '@/utils/logger'

export default function AddParts({
  itemAP,
  setItemAP,
  handleAddPARTS,
  handleConfirmDeleteRow,
  handleCloseModalAP,
  buyer,
  itemApply,
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
  const [buyerOption, setBuyerOption] = useState([])
  const [selectedCountries, setSelectedCountries] = useState([])
  const [prevQuery, setPrevQuery] = useState(null)

  // 1) options：value 用主鍵（建議 buyer 的 username 或 code），data 放原物件
  const buyerOptions = buyerOption.map((item) => ({
    label: `${item.name} (${item.username}, ${item.factory})`,
    value: item.username ?? item.code, // ← 用穩定主鍵
    data: item, // ← 原始物件
  }))

  // 2) 受控 value：用主鍵回找 option
  const apBuyer = itemAP.find((i) => i.id === 'AP')?.Buyer || null
  const selectedBuyer = apBuyer
    ? buyerOptions.find(
        (o) => o.value === (apBuyer.username ?? apBuyer.code)
      ) ?? null
    : null

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
    if (
      fieldName === 'UnitPrice' ||
      fieldName === 'LastPutPrice' ||
      fieldName === 'CurrencyOld' ||
      fieldName === 'CurrencyNew'
    ) {
      const costdownData = calculateAndUpdate(newItem)
      setItemAP(costdownData)
    } else {
      setItemAP(newItem)
    }
  }

  const calculateAndUpdate = (item) => {
    const unitPrice = Number(item[0].UnitPrice)
    const lastPutPrice = Number(item[0].LastPutPrice)
    const exchangeRate = rate[item[0].CurrencyOld]?.[item[0].CurrencyNew] || 0
    const updatedItem = {
      ...item[0],
      Rate: rate[item[0].CurrencyOld]?.[item[0].CurrencyNew] || 0,
      CostDown: (() => {
        if (isNaN(unitPrice) || isNaN(lastPutPrice) || unitPrice === 0) {
          return ''
        }

        const costDownRate = calculateCostDown(
          Number(item[0].LastPutPrice),
          Number(item[0].UnitPrice),
          exchangeRate
        )
        return costDownRate === 0 ? '0' : parseFloat(costDownRate).toFixed(2)
      })(),
    }
    return [updatedItem]
  }

  const calculateCostDown = (lastPutPrice, unitPrice, exchangeRate) => {
    if (lastPutPrice === 0) return 0
    return (
      ((lastPutPrice * exchangeRate - unitPrice) /
        (lastPutPrice * exchangeRate)) *
      100
    ).toFixed(2)
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
            currency: vendorValue.currency,
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
      display: `(${value.code})${value.name}`, // 將 name 改為 display
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

  const getLastPrice = async (factoryCode, brandCode, vendorCode, parts) => {
    const url = new URL(api('/last-price'))
    logger.info(`Fetching last-price from ${url}`, 'AddParts')
    // 將查詢參數加到 URL
    url.search = new URLSearchParams({
      factoryCode,
      brandCode,
      vendorCode,
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

      if (response.ok) {
        logger.info('last-price API success', 'AddParts')
      } else {
        logger.warn(
          `last-price API failed with status ${response.status}`,
          'AddParts'
        )
        throw new Error('Failed to fetch last price')
      }

      return await response.json()
    } catch (err) {
      logger.error('last-price request exception', 'AddParts', err)
      return null
    }
  }

  const getOriginCountry = async () => {
    const url = new URL(api('/origin-countries'))
    logger.info(`Fetching origin-countries from ${url}`, 'AddParts')
    const method = 'GET'
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        logger.info('origin-countries API success', 'AddParts')
      } else {
        logger.warn(
          `origin-countries API failed with status ${response.status}`,
          'AddParts'
        )
        throw new Error('Failed to fetch last price')
      }

      return await response.json()
    } catch (err) {
      logger.error('origin countries request exception', 'AddParts', err)
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
    if (buyer) {
      setBuyerOption(buyer)
    }
  }, [buyer])

  useEffect(() => {
    if (!itemAP.length) return
    const { Factory, Parts, Brand, Vendor } = itemAP[0] || {}
    if (!Factory?.code || !Brand?.code || !Vendor?.code || !Parts) return
    // 檢查這些欄位是否都有值且不為空
    const currentQuery = JSON.stringify({
      Factory: Factory.code,
      Brand: Brand.code,
      Vendor: Vendor.code,
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
        Parts
      )
      console.log(Factory)
      if (data.status === 'success') {
        const { currency, lastprice } = data.data || {}
        setItemAP((prev) =>
          prev.map((item) =>
            item.id === 'AP'
              ? {
                  ...item,
                  LastPutPrice: lastprice || '0',
                  CurrencyOld: currency || Vendor.currency || 'USD',
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
    itemAP[0]?.Factory?.code,
    itemAP[0]?.Brand?.code,
    itemAP[0]?.Vendor?.code,
    itemAP[0]?.Parts,
  ])

  useEffect(() => {
    const { Factory, Parts, Brand, Vendor } = itemAP[0] || {}
    const currentQuery = JSON.stringify({
      Factory: Factory.code,
      Brand: Brand.code,
      Vendor: Vendor.code,
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
        size="xl"
        visible={true}
        onClose={() => handleCloseModalAP()}
        aria-labelledby={`modelAP`}
        backdrop="static"
      >
        <CModalHeader
          className={`text-center ${styles.formColor}`}
          closeButton={false}
        >
          <CModalTitle id={`modelAP`} className="primary h2 fw-bold">
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
          <CContainer>
            <CRow className="gx-5">
              <CCol lg={6}>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">APPLY NO</CFormLabel>
                  <CFormInput
                    id="applyNo"
                    className="p"
                    size="lg"
                    value={itemAP.find((i) => i.id === 'AP')?.apply_no}
                    disabled
                  />
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    Buyer<span className="text-danger"> *</span>
                  </CFormLabel>
                  {/* <CFormSelect
                    className="p"
                    options={[
                      { label: '', value: '' },
                      ...buyerOption.map((item) => {
                        return {
                          label: `${item.name} (${item.factory})`,
                          value: JSON.stringify(item),
                        }
                      }),
                    ]}
                    onChange={(e) => {
                      const selectedItem = JSON.parse(e.target.value)
                      console.log(itemAP.find((i) => i.id === 'AP')?.Buyer)
                      handleInput('AP', 'Buyer', selectedItem)
                    }}
                    value={
                      JSON.stringify(
                        itemAP.find((i) => i.id === 'AP')?.Buyer
                      ) || ''
                    }
                    size="lg"
                  /> */}
                  <Select
                    instanceId="buyer-select"
                    inputId="buyer-select-input"
                    className="w-100 p"
                    classNamePrefix="select"
                    options={[{ label: '', value: '' }, ...buyerOptions]} // 要不要空白選項隨你
                    isSearchable
                    isClearable
                    placeholder=""
                    value={selectedBuyer} // ★ react-select 要整個 option
                    onChange={(opt) => {
                      const picked = opt?.data ?? null // ★ 直接拿回原物件
                      handleInput('AP', 'Buyer', picked) // 你原本的寫法就 OK
                    }}
                  />
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    Factory<span className="text-danger"> *</span>
                  </CFormLabel>
                  <div className="center-flex position-relative">
                    <CFormInput
                      type="text"
                      value={
                        itemAP.find((i) => i.id === 'AP')?.Factory.display || ''
                      }
                      onChange={(e) => {
                        handleInput('AP', 'Factory', e.target.value)
                      }}
                      className="me-3 p"
                      size="lg"
                      disabled
                    />
                    <CButton
                      className="p"
                      color="info"
                      variant="outline"
                      onClick={() => {
                        if (!itemAP[0].Buyer) {
                          Swal.fire({
                            customClass: 'h3',
                            title: 'Please select buyer first!',
                            text: 'You need to choose a buyer to proceed.',
                            icon: 'error',
                          })
                          return
                        }
                        openModal('Factory')
                      }}
                      size="lg"
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
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    VENDOR<span className="text-danger"> *</span>
                  </CFormLabel>
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
                      className="me-3 p"
                      size="lg"
                    />
                    <CButton
                      className="p"
                      color="info"
                      variant="outline"
                      onClick={() => {
                        if (!itemAP[0].Factory) {
                          Swal.fire({
                            customClass: 'h3',
                            title: 'Please select factory first!',
                            text: 'You need to choose a factory to proceed.',
                            icon: 'error',
                          })
                          return
                        }
                        openModal('Vendor')
                      }}
                      size="lg"
                    >
                      Select
                    </CButton>
                    <SelectForm
                      item={itemAP[0]}
                      getUpdateItem={getUpdateVendor}
                      visible={visibleModal.Vendor}
                      onCloseVisible={() => {
                        closeModal('Vendor')
                      }}
                      type={'vendors'}
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    Brand <span className="text-danger">*</span>
                  </CFormLabel>
                  <div className="d-flex  justify-content-center align-items-center">
                    <CFormInput
                      type="text"
                      disabled
                      onChange={(e) =>
                        handleInput('AP', 'Brand', e.target.value)
                      }
                      value={
                        itemAP.find((i) => i.id === 'AP')?.Brand.display || ''
                      }
                      className="me-3 p"
                      size="lg"
                    />
                    <CButton
                      className="p"
                      color="info"
                      variant="outline"
                      onClick={() => {
                        if (!itemAP[0].Vendor) {
                          Swal.fire({
                            customClass: 'h3',
                            title: 'Please select vendor first!',
                            text: 'You need to choose a vendor to proceed.',
                            icon: 'error',
                          })
                          return
                        }
                        openModal('Brand')
                      }}
                      size="lg"
                    >
                      Select
                    </CButton>

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
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    PART NO<span className="text-danger"> *</span>
                  </CFormLabel>
                  <CFormInput
                    className="p"
                    id={`inputVendorAP`}
                    rows={3}
                    disabled
                    value={itemAP.find((i) => i.id === 'AP')?.Parts || ''}
                    size="lg"
                  />
                </div>
                <div className="mb-4">
                  <CContainer>
                    <CRow>
                      <CCol className="p-0 center-flex flex-column">
                        <CFormLabel className="h3 fw-bold align-self-start">
                          Last Price
                        </CFormLabel>
                        <div className="d-flex justify-content-between w-100">
                          <CFormInput
                            type="text"
                            className={`w-100 me-2 ${styles.ch10} p`}
                            onChange={(e) =>
                              handleInput('AP', 'LastPutPrice', e.target.value)
                            }
                            value={
                              itemAP.find((i) => i.id === 'AP')?.LastPutPrice ||
                              ''
                            }
                            size="lg"
                          />
                          <CFormSelect
                            aria-label="Default select example"
                            className={`${styles.ch10} p`}
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
                            value={
                              itemAP.find((i) => i.id === 'AP')?.CurrencyOld ||
                              ''
                            }
                            size="lg"
                            disabled
                          />
                        </div>
                      </CCol>
                      <CCol className="center-flex flex-column">
                        <p className="m-0 p-0">Rate:</p>
                        <p className="m-0 p-0">
                          {rate[itemAP[0].CurrencyOld][itemAP[0].CurrencyNew] ||
                            ''}
                        </p>
                      </CCol>
                      <CCol className="p-0 center-flex flex-column">
                        <CFormLabel className="h3 fw-bold align-self-start">
                          Unit Price<span className="text-danger"> *</span>
                        </CFormLabel>
                        <div className="d-flex justify-content-between w-100">
                          <CFormInput
                            type="text"
                            className={`me-2 ${styles.ch10} w-100 p`}
                            id="AP"
                            onChange={(e) => {
                              handleInput('AP', 'UnitPrice', e.target.value)
                              // handleGetRate(e)
                            }}
                            // onKeyDown={handleGetRateKeyDown}
                            value={
                              itemAP.find((i) => i.id === 'AP')?.UnitPrice || ''
                            }
                            size="lg"
                          />
                          <CFormSelect
                            aria-label="Default select example"
                            className={`${styles.ch10} p`}
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
                            value={
                              itemAP.find((i) => i.id === 'AP')?.CurrencyNew ||
                              ''
                            }
                            disabled={true}
                            size="lg"
                          />
                        </div>
                      </CCol>
                    </CRow>
                  </CContainer>
                </div>
                <div className="mb-4">
                  <CContainer>
                    <CRow>
                      <CCol className="ps-0">
                        <CFormLabel className="h3 fw-bold">
                          Cost Down{' '}
                        </CFormLabel>
                        <div>
                          {itemAP[0].CostDown === '' && (
                            <span className="fs-5 text-danger">
                              *Please input Unit Price
                            </span>
                          )}

                          {itemAP[0].CostDown !== '' && (
                            <span
                              className={`fs-2 fw-bold m-0 ${
                                itemAP[0].CostDown > 0
                                  ? 'text-success'
                                  : itemAP[0].CostDown < 0
                                  ? 'text-danger'
                                  : ''
                              }`}
                            >
                              {itemAP[0].CostDown > 0 && '▼ '}
                              {itemAP[0].CostDown < 0 && '▲ '}
                              {itemAP[0].CostDown}％
                            </span>
                          )}
                        </div>
                      </CCol>
                      <CCol className="ps-0">
                        <CFormLabel className="h3 fw-bold">
                          Effective Date<span className="text-danger"> *</span>
                        </CFormLabel>
                        <CFormInput
                          type="date"
                          className="mb-2 p"
                          onChange={(e) =>
                            handleInput('AP', 'EffectiveDate', e.target.value)
                          }
                          value={
                            itemAP.find((i) => i.id === 'AP')?.EffectiveDate ||
                            ''
                          }
                          size="lg"
                        />
                      </CCol>
                    </CRow>
                  </CContainer>
                </div>
                <div className="mb-4">
                  {' '}
                  <CFormLabel className="h3 fw-bold">
                    Effective Remark
                  </CFormLabel>
                  <CFormTextarea
                    id={`inputVendorAP`}
                    rows={3}
                    onChange={(e) =>
                      handleInput('AP', 'EffectiveRemark', e.target.value)
                    }
                    value={
                      itemAP.find((i) => i.id === 'AP')?.EffectiveRemark || ''
                    }
                    className="fs-4"
                  ></CFormTextarea>
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    Place of Origin(原產地)
                    <span className="text-danger"> *</span>
                  </CFormLabel>
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
                    className="p"
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
                    size="lg"
                  />
                </div>
              </CCol>
              <CCol lg={6}>
                <div className="mb-4">
                  <CContainer>
                    <CRow>
                      <CCol className="ps-0">
                        <CFormLabel className="h3 fw-bold">
                          Share Rate<span className="text-danger"> *</span>
                        </CFormLabel>
                        <div className="d-flex align-items-center h3">
                          <CFormInput
                            className="p"
                            type="text"
                            maxLength={10}
                            onChange={(e) =>
                              handleInput(
                                'AP',
                                'OrderSharerate',
                                e.target.value
                              )
                            }
                            value={
                              itemAP.find((i) => i.id === 'AP')
                                ?.OrderSharerate || ''
                            }
                            size="lg"
                          />
                          ％
                        </div>
                      </CCol>
                      <CCol className="ps-0">
                        <CFormLabel className="h3 fw-bold">
                          Lead Time<span className="text-danger"> *</span>
                        </CFormLabel>
                        <CFormInput
                          className="p"
                          type="text"
                          maxLength={10}
                          onChange={(e) =>
                            handleInput('AP', 'LeadTime', e.target.value)
                          }
                          value={
                            itemAP.find((i) => i.id === 'AP')?.LeadTime || ''
                          }
                          size="lg"
                        />
                      </CCol>
                    </CRow>
                  </CContainer>
                </div>
                <div className="mb-4">
                  <CContainer>
                    <CRow>
                      <CCol className="ps-0">
                        <CFormLabel className="h3 fw-bold">
                          MOQ<span className="text-danger"> *</span>
                        </CFormLabel>
                        <CFormInput
                          className="p"
                          type="text"
                          maxLength={10}
                          onChange={(e) =>
                            handleInput('AP', 'Moq', e.target.value)
                          }
                          value={itemAP.find((i) => i.id === 'AP')?.Moq || ''}
                          size="lg"
                        />
                      </CCol>
                      <CCol className="ps-0">
                        <CFormLabel className="h3 fw-bold">
                          MPQ<span className="text-danger"> *</span>
                        </CFormLabel>
                        <CFormInput
                          className="p"
                          type="text"
                          maxLength={15}
                          onChange={(e) =>
                            handleInput('AP', 'Mpq', e.target.value)
                          }
                          value={itemAP.find((i) => i.id === 'AP')?.Mpq || ''}
                          size="lg"
                        />
                      </CCol>
                    </CRow>
                  </CContainer>
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    Vendor Quotation No.
                  </CFormLabel>
                  <CFormInput
                    className="p"
                    type="text"
                    onChange={(e) =>
                      handleInput('AP', 'VendorQuotationNo', e.target.value)
                    }
                    value={
                      itemAP.find((i) => i.id === 'AP')?.VendorQuotationNo || ''
                    }
                    size="lg"
                  />
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">LME(Copper)</CFormLabel>
                  <CFormInput
                    className="p"
                    type="text"
                    onChange={(e) => handleInput('AP', 'LME', e.target.value)}
                    value={itemAP.find((i) => i.id === 'AP')?.LME || ''}
                    size="lg"
                  />
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    Quota Date(配額生效日)
                    <span className="text-danger"> *</span>
                  </CFormLabel>
                  <CFormInput
                    className="p"
                    type="date"
                    onChange={(e) =>
                      handleInput('AP', 'QuotaDate', e.target.value)
                    }
                    value={itemAP.find((i) => i.id === 'AP')?.QuotaDate || ''}
                    size="lg"
                  />
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    Annulment Date(單價失效日)
                  </CFormLabel>
                  <CFormInput
                    className="p"
                    type="date"
                    min={itemAP.find((i) => i.id === 'AP')?.EffectiveDate || ''}
                    onChange={(e) =>
                      handleInput('AP', 'AnnulmentDate', e.target.value)
                    }
                    value={
                      itemAP.find((i) => i.id === 'AP')?.AnnulmentDate || ''
                    }
                    size="lg"
                  />
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    Control Quantity(管控數量)
                  </CFormLabel>
                  <CFormInput
                    className="p"
                    type="text"
                    onChange={(e) =>
                      handleInput('AP', 'ControlQuantity', e.target.value)
                    }
                    value={
                      itemAP.find((i) => i.id === 'AP')?.ControlQuantity || ''
                    }
                    size="lg"
                  />
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    Is it the spot price?
                  </CFormLabel>
                  <div className="h3  d-flex justify-content-between">
                    <CFormLabel className="h3 fw-bold">
                      (是否為現貨價?)
                    </CFormLabel>
                    <div>
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
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    Is it the Unpaid order will take effect?
                  </CFormLabel>
                  <div className="h3 d-flex justify-content-between">
                    <CFormLabel className="h3 fw-bold">
                      (是否要未交訂單即生效?)
                    </CFormLabel>
                    <div>
                      <CFormCheck
                        inline
                        type="radio"
                        name="IsUnpaidOrderEffective"
                        id="IsUnpaidOrderEffective1"
                        value="Y"
                        label="Y"
                        onChange={(e) => {
                          console.log(e.target.value)
                          handleInput(
                            'AP',
                            'IsUnpaidOrderEffective',
                            e.target.value
                          )
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
                          handleInput(
                            'AP',
                            'IsUnpaidOrderEffective',
                            e.target.value
                          )
                        }}
                        checked={
                          itemAP.find((i) => i.id === 'AP')
                            ?.IsUnpaidOrderEffective === 'N'
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <CFormLabel className="h3 fw-bold">
                    File Name{' '}
                    <span className="ms-3">
                      <CButton
                        color="info"
                        variant="outline"
                        className="p-0"
                        size="lg"
                      >
                        <label
                          htmlFor={`file-uploadAP`}
                          className="py-2 px-3 center-flex h5 m-0"
                        >
                          <FaArrowUpFromBracket size={12.5} className="" />
                        </label>
                      </CButton>
                    </span>
                  </CFormLabel>
                  <CFormInput
                    type="file"
                    className="d-none"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.zip,.rar" // 限定檔案類型
                    id={`file-uploadAP`}
                    onChange={(e) => {
                      setItemAP(handleFileUpload('AP', itemAP, e))
                    }}
                  />
                  {itemAP[0].AttachFile?.map((v, index) => (
                    <div
                      className="d-flex align-items-center mt-2 "
                      key={index}
                    >
                      <button
                        className="center-flex border border-2 border-dark p-2 rounded h5 fw-bold m-0"
                        onClick={() => {
                          if (v.preview) {
                            handlePreview(v.preview)
                          } else {
                            const filename = encodeURIComponent(v.file.name)
                            const url = api(`/data/files?filename=${filename}`)
                            window.open(url, '_blank')
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
                </div>
              </CCol>
            </CRow>
          </CContainer>
        </CModalBody>
        <CModalFooter>
          <CButton
            className="center-flex gap-1"
            color="info"
            onClick={() => {
              handleAddPARTS()
            }}
            size="lg"
          >
            {itemAP[0].editAgain ? (
              <>
                <FaPenToSquare size={12.5} /> EDIT
              </>
            ) : (
              <>
                <FaRegSquarePlus size={12.5} /> ADD
              </>
            )}
          </CButton>
          {itemAP[0].editAgain ? (
            <CButton
              className="center-flex gap-1"
              color="danger"
              onClick={() => {
                handleConfirmDeleteRow(itemAP[0].editAgain)
              }}
              size="lg"
            >
              <FaRegTrashCan size={12.5} /> DEL{' '}
            </CButton>
          ) : (
            ''
          )}
          <CButton
            className="center-flex gap-1"
            color="secondary"
            onClick={() => {
              handleCloseModalAP()
            }}
            size="lg"
          >
            <FaRegCircleXmark size={12.5} /> EXIT
          </CButton>
        </CModalFooter>
      </CModal>
      )
    </>
  )
}
