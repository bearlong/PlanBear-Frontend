import React, { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import {
  CButton,
  CContainer,
  CRow,
  CCol,
  CTable,
  CFormSelect,
  CFormCheck,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import styles from '@/styles/application.module.scss'
import Image from 'next/image'
import Swal from 'sweetalert2'
import Link from 'next/link'
import { useRouter } from 'next/router'
import useFileManagement from '@/hooks/useFileManagement'
import { FadeLoader } from 'react-spinners'
import { logger } from '@/utils/logger'

export default function SendButton({ items, itemApply, draftNo }) {
  const signFormInit = {
    signRoute: '',
  }
  const router = useRouter()

  const [visibleSign, setVisibleSign] = useState(false)
  const [signForm, setSignForm] = useState(signFormInit)
  const [isSubmit, setIsSubmit] = useState(false)

  const handleSelectSignForm = (id, value) => {
    const newSignForm = {
      ...signForm, // 保留 signForm 的其他屬性
      [id]: value, // 更新指定的屬性
    }
    setSignForm(newSignForm)
  }

  const handleOpenSendForm = () => {
    if (items.length > 0) {
      setVisibleSign(true)
    } else {
      Swal.fire({
        title: 'Warning',
        text: 'Please add items first.',
        icon: 'warning',
        confirmButtonText: 'Okay',
        customClass: {
          popup: 'h3',
          title: 'h3 text-danger',
        },
      })
    }
  }

  const isSignFormIncomplete = () => {
    return Object.values(signForm).some((value) => value === '') // 檢查其餘屬性是否為空
  }

  const getProcessOptions = () => {
    return [
      {
        label: 'Open this select menu',
        value: '', // 預設選項的空值
      },
      {
        label: 'Materials(一般料)',
        value: 'A',
      },
      {
        label: 'Supplies(耗材)',
        value: 'B',
      },
    ]
  }

  const checkNumeric = (value) => {
    const numValue = Number(value)
    return !isNaN(numValue) && numValue !== null && value !== undefined
  }

  const validateItem = (item, keys) => {
    const checkResults = keys.reduce((acc, key) => {
      acc[key] = checkNumeric(item[key]) // 檢查每一個 key 是否為有效數字
      return acc
    }, {})

    return checkResults
  }

  const handleSubmit = async () => {
    setIsSubmit(true)
    const warningTexts = []
    if (isSignFormIncomplete()) {
      Swal.fire({
        title: 'Warning',
        text: 'Please fill out all required fields.',
        icon: 'warning',
        confirmButtonText: 'Okay',
        customClass: {
          popup: 'h3',
          title: 'h3 text-danger',
        },
      })
      setIsSubmit(false)
      return
    }

    const keysToCheck = [
      'ControlQuantity',
      'CostDown',
      'Moq',
      'Mpq',
      'OrderSharerate',
      'LeadTime',
      'LastPutPrice',
      'UnitPrice',
      'LME',
    ]

    if (itemApply.buyer && Object.keys(itemApply.buyer).length <= 0) {
      warningTexts.push('Buyer is required.')
    }

    const checkedItems = items.map((item, index) => {
      const checkResults = validateItem(item, keysToCheck)
      return {
        ...item,
        checkResults,
        index: index + 1,
      }
    })

    checkedItems.forEach((item) => {
      const invalidKeys = Object.keys(item.checkResults).filter(
        (key) => !item.checkResults[key]
      )

      if (invalidKeys.length > 0) {
        logger.warn(
          `Item ${item.index} has invalid keys: ${invalidKeys.join(', ')}`,
          `SumbitForm`
        )
        invalidKeys.forEach((key) => {
          warningTexts.push(
            `Item ${item.index}: ${key} is non-numeric. Please check the data.`
          )
        })
      }
    })

    if (warningTexts.length > 0) {
      Swal.fire({
        title: 'Warning',
        text: warningTexts.join('\n'),
        icon: 'warning',
        confirmButtonText: 'Okay',
        customClass: {
          popup: 'h3',
          title: 'h3 text-danger',
        },
      })
      setIsSubmit(false)
      return
    }

    const isValid = !items.some((item) => Number(item.CostDown) < 0)

    const sign_route = isValid
      ? signForm.signRoute
      : signForm.signRoute === 'A'
      ? 'C'
      : 'D'
    const newItemApply = {
      ...itemApply,
      buyer: itemApply.buyer.username,
      sap_sourcer: itemApply.sap_sourcer.code ? itemApply.sap_sourcer.code : '',
      sap_sourcer_username: itemApply.sap_sourcer.username
        ? itemApply.sap_sourcer.username
        : '',
      sap_sourcer_name: itemApply.sap_sourcer.name
        ? itemApply.sap_sourcer.name
        : '',

      sign_route: sign_route,
    }

    const newItems = items.map((item) => {
      return {
        ...item,
        Factory: item.Factory.code,
        FactoryDisplay: `${item.Factory.display}`,
        Vendor: item.Vendor.code,
        VendorDisplay: item.Vendor.display,
        Brand: item.Brand.code,
        BrandDisplay: item.Brand.display,
        Buyer: item.Buyer.username,
        BuyerUsername: item.Buyer.username,
        PlaceOfOrigin: JSON.stringify(item.PlaceOfOrigin),
        AttachFile: item.AttachFile
          ? item.AttachFile.map((fileObj) => fileObj.file)
          : [],
      }
    })

    const sendForm = {
      signInfo: signForm,
      data: newItems,
      title: newItemApply,
    }
    const formData = new FormData()
    Object.keys(sendForm.signInfo).forEach((key) => {
      formData.append(`signInfo[${key}]`, sendForm.signInfo[key])
    })
    console.log(sendForm.data)
    sendForm.data.forEach((item, index) => {
      // 這裡使用 [index] 作為陣列索引來確保數據正確
      Object.keys(item).forEach((key) => {
        if (key === 'AttachFile' && Array.isArray(item[key])) {
          // AttachFile 是一個檔案陣列，需分別加入 FormData
          item[key].forEach((file, fileIndex) => {
            formData.append(`data[${index}][AttachFile][${fileIndex}]`, file)
          })
        } else if (
          item[key] === null ||
          item[key] === undefined ||
          (typeof item[key] === 'string' &&
            (item[key] === 'null' || item[key] === 'undefined'))
        ) {
          formData.append(`data[${index}][${key}]`, '')
        } else {
          formData.append(`data[${index}][${key}]`, item[key])
        }
      })
    })
    Object.keys(sendForm.title).forEach((key) => {
      if (sendForm.title[key]) {
        formData.append(`title[${key}]`, sendForm.title[key])
      }
    })

    const url = api('/compare-apply')
    const method = 'POST'

    try {
      const response = await fetch(url, {
        method,

        credentials: 'include',
        body: formData,
      })
      const result = await response.json()
      if (result.status === 'success') {
        const url = api(`/compare-data/draft`)
        logger.info(`Deleting draft : ${url}`, `DraftList`)
        const method = 'DELETE'
        const responseDel = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            draft_no: draftNo,
            username: itemApply.buyer.username,
          }),
        })

        const resultDel = await responseDel.json()
        if (responseDel.ok) {
          logger.info('Delete draft API success', `DraftList`)
        } else {
          logger.warn(
            `Delete draft API failed with status ${responseDel.status}`,
            `DraftList`
          )
          throw new Error('Failed to delete draft')
        }

        if (resultDel.status !== 'success') {
          logger.error('Error delete draft', `draftNo：${draftNo}`, null)
        }

        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Your form has been applied successfully',
          customClass: 'h3',
          showConfirmButton: false,
          timer: 1500,
        })
        const isMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

        setTimeout(() => {
          if (!isMock) {
            window.open(result.formUrl, '_blank')
          }
          router.push(`/Procurement/Application/${result.data}`)
        }, 1500)
        setVisibleSign(false)
        setIsSubmit(false)
        return
      } else {
        Swal.fire({
          title: 'Error',
          text:
            result.message || 'An error occurred while submitting the form.',
          icon: 'error',
          confirmButtonText: 'Okay',
          customClass: {
            popup: 'h3',
            title: 'h3 text-danger',
          },
        })
        setIsSubmit(false)
        logger.error('Error submitting form', `draftNo：${draftNo}`, null)
      }
    } catch (err) {
      console.log(err)
    }
  }
  return (
    <>
      <div className="d-flex gap-5 justify-content-center">
        <Link href="/">
          <CButton color="secondary" className={`${styles.ch15} m-0`}>
            Exit
          </CButton>
        </Link>
        <CButton
          color="secondary"
          className={`${styles.ch15} m-0 btn-ph-primary`}
          onClick={() => {
            handleOpenSendForm()
          }}
        >
          SEND
        </CButton>

        {visibleSign && (
          <CModal
            backdrop="static"
            visible={visibleSign}
            alignment="center"
            onClose={() => setVisibleSign(false)}
            aria-labelledby="StaticBackdropExampleLabel"
            className="p"
          >
            <CModalHeader
              className="text-center center-flex"
              closeButton={false}
            >
              <CModalTitle id={`modelMI`} className="primary h3">
                <Image
                  className="me-2 "
                  src="/img/logo.png"
                  width={30}
                  height={30}
                  alt="logo"
                />
                Vendor Compare Price Apply Sign Form
              </CModalTitle>
            </CModalHeader>
            <CModalBody>
              {isSubmit ? (
                <>
                  <div className="d-flex flex-column justify-content-center align-items-center gap-3">
                    <FadeLoader
                      color={'#0d5cab'}
                      height={15}
                      loading
                      margin={2}
                      radius={2}
                      speedMultiplier={1}
                      width={5}
                    />
                  </div>
                </>
              ) : (
                <CContainer className="border h3 border-3">
                  <CRow>
                    <CCol
                      className={`py-4 border border-3 primary text-center`}
                    >
                      Sign Route
                    </CCol>
                    <CCol className="py-4 border border-3" xs={8}>
                      <CFormSelect
                        aria-label="Default select example"
                        options={getProcessOptions()}
                        onChange={(e) => {
                          handleSelectSignForm('signRoute', e.target.value)
                        }}
                        size="lg"
                      />
                    </CCol>
                  </CRow>
                </CContainer>
              )}
            </CModalBody>
            <CModalFooter className="text-center center-flex">
              {isSubmit ? (
                <></>
              ) : (
                <>
                  <CButton
                    color="primary"
                    onClick={() => {
                      handleSubmit()
                    }}
                    size="lg"
                  >
                    Send
                  </CButton>
                  <CButton
                    color="secondary"
                    onClick={() => {
                      setVisibleSign(false)
                      setSignForm(signFormInit)
                    }}
                    size="lg"
                  >
                    Cancel
                  </CButton>
                </>
              )}
            </CModalFooter>
          </CModal>
        )}
      </div>
    </>
  )
}
